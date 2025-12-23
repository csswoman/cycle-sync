import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showBackToLogin?: boolean;
  onBackToLogin?: () => void;
  showSignUp?: boolean;
  onSignUp?: () => void;
  title?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  isDarkMode, 
  toggleDarkMode, 
  showBackToLogin, 
  onBackToLogin,
  showSignUp,
  onSignUp
}) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
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

            {showBackToLogin && (
              <button 
                onClick={onBackToLogin}
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 text-primary font-bold hover:bg-primary/10 transition-colors text-sm"
              >
                <span className="truncate">{t.loginButton}</span>
              </button>
            )}

            {showSignUp && (
              <button 
                onClick={onSignUp}
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors text-sm"
              >
                <span className="truncate">{t.signUp}</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
