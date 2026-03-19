import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import AuthLayout from './components/AuthLayout';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin, isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} showBackToLogin onBackToLogin={onBackToLogin}>
        <div className="w-full max-w-[480px] flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col gap-3 text-center items-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner ring-4 ring-primary/5">
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>mark_email_unread</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-foreground">
              {t.resetLinkSent}
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs md:max-w-sm">
              {t.resetLinkSentDescription}
            </p>
          </div>

          <div className="w-full bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/5 backdrop-blur-sm text-center">
            <div className="mb-6">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 border border-border/50">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>local_florist</span>
              </div>
              <p className="text-sm font-medium text-foreground/70">
                {email}
              </p>
            </div>

            <button
              onClick={onBackToLogin}
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
    <AuthLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} showBackToLogin onBackToLogin={onBackToLogin}>
      <div className="w-full max-w-[480px] flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-3 text-center items-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock_reset</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-foreground">
            {t.forgotPasswordTitle}
          </h1>
          <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs md:max-w-sm">
            {t.forgotPasswordDescription}
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
                  onChange={(e) => setEmail(e.target.value)}
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
              className="mt-2 w-full h-12 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
              ) : (
                t.sendResetLink
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t.alreadyHaveAccount}
              <button
                onClick={onBackToLogin}
                className="text-primary font-bold hover:underline ml-1"
              >
                {t.loginButton}
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

export default ForgotPassword;
