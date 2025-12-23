import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface CheckEmailProps {
  onBackToLogin: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const CheckEmail: React.FC<CheckEmailProps> = ({ onBackToLogin, isDarkMode, toggleDarkMode }) => {
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
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[480px] flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col gap-3 text-center items-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>mark_email_read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-foreground">
              {t.checkEmailTitle}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg font-normal leading-relaxed">
              {t.checkEmailDescription}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button
              onClick={onBackToLogin}
              className="w-full h-14 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.backToLogin}
            </button>
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

export default CheckEmail;
