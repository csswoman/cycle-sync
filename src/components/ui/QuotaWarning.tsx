import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { APIQuotaStatus } from '@/types/recipes';

interface QuotaWarningProps {
    quotaStatus: APIQuotaStatus;
    show: boolean;
}

export const QuotaWarning: React.FC<QuotaWarningProps> = ({ quotaStatus, show }) => {
    const { t } = useLanguage();

    if (!show) return null;

    const resetTime = quotaStatus.resetTime ? new Date(quotaStatus.resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00';

    return (
        <div className="bg-accent/20 border border-primary/30 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">info</span>
                <div className="flex-1">
                    <h3 className="text-foreground font-bold text-sm mb-1">{t.quotaExceeded}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{t.quotaExceededMessage}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{t.quotaResetTime}: {resetTime}</span>
                    </div>
                    <div className="mt-2 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
                        {t.usingFallbackData}
                    </div>
                </div>
            </div>
        </div>
    );
};
