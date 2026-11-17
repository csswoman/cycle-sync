'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { useGuest } from '@/hooks/useGuest';
import { Icon } from '@/components/ui/Icon';

interface GuestPreviewBannerProps {
  /** What the guest can unlock on this page, already in the current language. */
  message: string;
  className?: string;
}

/** Tells guests they are in read-only mode and what an account adds. Renders nothing for members. */
export default function GuestPreviewBanner({ message, className = '' }: GuestPreviewBannerProps) {
  const { t } = useLanguage();
  const { isGuest, promptSignup } = useGuest();
  if (!isGuest) return null;

  return (
    <section
      className={`w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5 sm:px-5 ${className}`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon name="visibility" size={20} weight="duotone" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{t.guestPreviewTitle}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={promptSignup}
        className="shrink-0 self-stretch sm:self-auto bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl transition-colors"
      >
        {t.createAccount}
      </button>
    </section>
  );
}
