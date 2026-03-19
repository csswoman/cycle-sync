import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import AuthLayout from './components/AuthLayout';

interface LoginProps {
  onLogin: () => void;
  onSignUp: () => void;
  onUnconfirmedEmail: () => void;
  onForgotPassword: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSignUp, onUnconfirmedEmail, onForgotPassword, isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          onUnconfirmedEmail();
          return;
        }
        throw error;
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError(t.emailLabel);
      return;
    }
    setMagicLinkLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <AuthLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} showSignUp onSignUp={onSignUp}>
        <div className="w-full max-w-[480px] flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col gap-3 text-center items-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner ring-4 ring-primary/5">
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>mark_email_unread</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-foreground">
              {t.magicLinkSent}
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs md:max-w-sm">
              {t.magicLinkSentDescription}
            </p>
          </div>

          <div className="w-full bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/5 backdrop-blur-sm text-center">
            <div className="mb-6">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 border border-border/50">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>local_florist</span>
              </div>
              <p className="text-sm font-medium text-foreground/70">{email}</p>
            </div>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="w-full h-12 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.backToLogin}
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-secondary/50 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
              <span>{t.checkSpamFolder}</span>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      isDarkMode={isDarkMode} 
      toggleDarkMode={toggleDarkMode} 
      showSignUp 
      onSignUp={onSignUp}
    >
      <div className="w-full max-w-[480px] flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-3 text-center items-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-foreground">
            {t.welcomeBack}
          </h1>
          <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs md:max-w-sm">
            {t.loginDescription}
          </p>
        </div>

        <div className="w-full bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/5 backdrop-blur-sm">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground/80" htmlFor="email">
                {t.emailLabel}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>mail</span>
                <input
                  className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-foreground/80" htmlFor="password">
                  {t.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>key</span>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <input
                  className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}

            <button
              className="mt-2 w-full h-12 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              type="submit"
            >
              {t.loginButton}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground font-medium">{t.orContinueWith}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkLoading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-secondary text-foreground text-base font-bold hover:bg-surface-hover hover:border-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {magicLinkLoading ? (
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_fix_high</span>
                {t.sendMagicLink}
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t.dontHaveAccount}
              <button 
                onClick={onSignUp}
                className="text-primary font-bold hover:underline ml-1"
              >
                {t.signUp}
              </button>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-secondary/50 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shield_lock</span>
            <span>{t.dataSecurityInfo}</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
