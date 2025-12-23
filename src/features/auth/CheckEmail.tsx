import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import AuthLayout from './components/AuthLayout';

interface CheckEmailProps {
  onBackToLogin: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const CheckEmail: React.FC<CheckEmailProps> = ({ onBackToLogin, isDarkMode, toggleDarkMode }) => {
  const { t } = useLanguage();

  return (
    <AuthLayout 
      isDarkMode={isDarkMode} 
      toggleDarkMode={toggleDarkMode} 
      showBackToLogin 
      onBackToLogin={onBackToLogin}
    >
      <div className="w-full max-w-[480px] flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-3 text-center items-center">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner ring-4 ring-primary/5">
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>mark_email_unread</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-foreground">
            {t.checkEmailTitle}
          </h1>
          <p className="text-muted-foreground text-lg font-normal leading-relaxed max-w-xs md:max-w-sm">
            {t.checkEmailDescription}
          </p>
        </div>

        <div className="w-full bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/5 backdrop-blur-sm text-center">
          <div className="mb-6">
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 border border-border/50">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>local_florist</span>
            </div>
            <p className="text-sm font-medium text-foreground italic">
              "Every cycle is a new beginning. We're excited to have you with us."
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
            <span>Didn't receive the email? Check your spam folder.</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default CheckEmail;
