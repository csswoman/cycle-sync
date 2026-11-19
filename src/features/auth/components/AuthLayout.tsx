import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Flower } from '@/components/ui/Flower';

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
    <div className="relative bg-background text-foreground font-display min-h-screen flex flex-col w-full overflow-y-auto transition-colors duration-300 [background-image:radial-gradient(60rem_30rem_at_85%_-10%,color-mix(in_srgb,var(--blossom-soft)_35%,transparent),transparent),radial-gradient(50rem_30rem_at_0%_105%,color-mix(in_srgb,var(--sage)_30%,transparent),transparent)]">
      <header className="w-full border-b border-border bg-background/80 backdrop-blur z-10 sticky top-0">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Flower
              petal="var(--blossom-soft)"
              center="var(--sun)"
              outline="var(--blossom)"
              rotate={15}
              className="size-9 drop-shadow-sm"
            />
            <h2 className="text-lg font-bold leading-tight tracking-tight">CycleSync</h2>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-colors rounded-lg px-3 h-10 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            <button
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}
              className="flex items-center justify-center bg-secondary hover:bg-surface-hover transition-colors rounded-lg size-10 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {showBackToLogin && (
              <button 
                onClick={onBackToLogin}
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 text-primary font-bold hover:bg-primary/10 transition-colors text-sm"
              >
                <span className="truncate">{t.loginButton}</span>
              </button>
            )}

            {showSignUp && (
              <button 
                onClick={onSignUp}
                className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors text-sm"
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
