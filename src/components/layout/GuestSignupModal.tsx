'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';

export default function GuestSignupModal() {
  const router = useRouter();
  const { t } = useLanguage();
  const { signupPromptOpen, setSignupPromptOpen } = useAppStore();

  if (!signupPromptOpen) return null;

  const go = (path: string) => {
    setSignupPromptOpen(false);
    router.push(path);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setSignupPromptOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-modal-title"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Icon name="lock" size={44} weight="duotone" className="text-blossom mx-auto" />
        <h2 id="guest-modal-title" className="mt-2 text-lg font-bold text-foreground">
          {t.guestModalTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.guestModalBody}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => go('/register')}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.createAccount}
          </button>
          <button
            onClick={() => go('/login')}
            className="w-full rounded-full border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            {t.guestSignIn}
          </button>
          <button
            onClick={() => setSignupPromptOpen(false)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            {t.guestLater}
          </button>
        </div>
      </div>
    </div>
  );
}
