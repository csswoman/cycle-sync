import React, { useEffect, useState } from 'react';
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
  // Set by /auth/callback when the confirm link opened where the session could not be created.
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => setConfirmed(new URLSearchParams(window.location.search).has('confirmed')), []);
  const { t, language } = useLanguage();

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
        if (error.message.includes('Invalid login credentials')) {
          setError(t.invalidCredentials);
          return;
        }
        throw error;
      }
      onLogin();
    } catch (err: any) {
      const message = err?.message ?? String(err);
      if (message === 'Failed to fetch' || message.includes('fetch failed')) {
        setError(t.connectionError);
      } else {
        setError(message);
      }
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError(language === 'es' ? 'Escribe tu correo para enviarte el enlace.' : 'Enter your email to receive the link.');
      return;
    }
    setMagicLinkLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false,
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes('signups not allowed')) {
          setError(t.noAccountForEmail);
          return;
        }
        throw error;
      }
      setMagicLinkSent(true);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      if (message === 'Failed to fetch' || message.includes('fetch failed')) {
        setError(t.connectionError);
      } else {
        setError(message);
      }
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
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.025em] text-balance text-foreground">
              {t.magicLinkSent}
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs md:max-w-sm text-pretty">
              {t.magicLinkSentDescription}
            </p>
          </div>

          <div className="w-full bg-card border border-border rounded-3xl p-6 md:p-8 dark:shadow-none shadow-[0_1px_2px_color-mix(in_srgb,var(--foreground)_8%,transparent),0_16px_32px_-16px_color-mix(in_srgb,var(--foreground)_28%,transparent)] text-center">
            <div className="mb-6">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 border border-border/50">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>local_florist</span>
              </div>
              <p className="text-sm font-medium text-foreground/70">{email}</p>
            </div>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="w-full h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 active:translate-y-px transition-colors"
            >
              {t.backToLogin}
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-secondary/60 px-3 py-1.5 rounded-2xl">
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
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.025em] text-balance text-foreground">
            {t.welcomeBack}
          </h1>
          <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs md:max-w-sm text-pretty">
            {t.loginDescription}
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-3xl p-6 md:p-8 dark:shadow-none shadow-[0_1px_2px_color-mix(in_srgb,var(--foreground)_8%,transparent),0_16px_32px_-16px_color-mix(in_srgb,var(--foreground)_28%,transparent)]">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="email">
                {t.emailLabel}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>mail</span>
                <input
                  className="w-full bg-secondary border border-border rounded-xl h-12 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors font-body"
                  id="email"
                  name="email"
                  placeholder="nombre@correo.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground" htmlFor="password">
                  {t.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm font-semibold text-primary hover:underline underline-offset-4 py-1"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>key</span>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 size-12 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-xl"
                  aria-label={showPassword ? (language === 'es' ? 'Ocultar contraseña' : 'Hide password') : (language === 'es' ? 'Mostrar contraseña' : 'Show password')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <input
                  className="w-full bg-secondary border border-border rounded-xl h-12 pl-10 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors font-body"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder=" "
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            {confirmed && !error && (
              <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-foreground text-sm font-medium">
                {language === 'es' ? 'Tu correo está confirmado. Inicia sesión para entrar.' : 'Your email is confirmed. Sign in to continue.'}
              </p>
            )}
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm font-medium">
                <span className="material-symbols-outlined shrink-0" aria-hidden="true" style={{ fontSize: '18px', marginTop: '1px' }}>error</span>
                {error}
              </p>
            )}

            <button
              className="mt-2 w-full h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 active:translate-y-px transition-colors"
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
              <span className="bg-card px-3 text-muted-foreground text-sm">{t.orContinueWith}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkLoading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-full border border-border-emphasized/40 bg-transparent text-foreground text-base font-semibold hover:bg-secondary active:translate-y-px transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
            <a
              href="/dashboard"
              className="inline-flex items-center min-h-10 mb-1 text-sm font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {t.guestExplore}
            </a>
            <p className="text-sm text-muted-foreground">
              {t.dontHaveAccount}
              <button 
                onClick={onSignUp}
                className="text-primary font-semibold hover:underline underline-offset-4 ml-1 min-h-10"
              >
                {t.signUp}
              </button>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-secondary/60 px-3 py-1.5 rounded-2xl">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shield_lock</span>
            <span className="text-pretty">{t.dataSecurityInfo}</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
