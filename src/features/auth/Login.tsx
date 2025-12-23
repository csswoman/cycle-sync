import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onLogin: () => void;
  onSignUp: () => void;
  onUnconfirmedEmail: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSignUp, onUnconfirmedEmail, isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert(err.message);
    }
  };

  return (
    <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full overflow-y-auto transition-colors duration-300">
      <header className="w-full border-b border-border bg-background z-10 sticky top-0">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_florist</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight">CycleSync</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 text-muted-foreground font-bold hover:bg-secondary transition-colors text-sm">
              <span className="truncate">{t.help}</span>
            </button>
            <button 
              onClick={onSignUp}
              className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors text-sm"
            >
              <span className="truncate">{t.signUp}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-foreground/80" htmlFor="password">
                    {t.passwordLabel}
                  </label>
                  <a className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors" href="#">{t.forgotPassword}</a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>key</span>
                  <input
                    className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="mt-2 w-full h-12 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                type="submit"
              >
                {t.loginButton}
              </button>
            </form>

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
      </main>
    </div>
  );
};

export default Login;
