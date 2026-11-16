'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getLocalDailyLog } from '@/lib/offlineHelpers';
import { useMedications, localDateString } from '@/hooks/useMedications';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { dashboardText } from '../dashboardText';

interface RowProps {
    icon: string;
    title: string;
    detail: string;
    done: boolean;
    cta: string;
    onClick: () => void;
    progress?: number;
}

const Row: React.FC<RowProps> = ({ icon, title, detail, done, cta, onClick, progress }) => (
    <div className="flex items-center gap-4 py-3">
        <div className={`size-11 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-leaf-soft text-leaf' : 'bg-blossom-soft text-blossom'}`}>
            <Icon name={done ? 'check_circle' : icon} size={22} weight={done ? 'fill' : 'duotone'} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm">{title}</p>
            <p className="text-muted-foreground text-xs truncate">{detail}</p>
            {progress !== undefined && (
                <div className="mt-1.5 h-1.5 w-full max-w-[200px] bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blossom rounded-full" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
        <button
            onClick={onClick}
            className={`shrink-0 px-4 h-9 rounded-full text-xs font-bold transition-colors ${done ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
            {cta}
        </button>
    </div>
);

export const TodayChecklist: React.FC = () => {
    const router = useRouter();
    const { language } = useLanguage();
    const text = dashboardText[language === 'es' ? 'es' : 'en'];
    const { todayDoses, isTaken, loading: medsLoading } = useMedications();
    const [logged, setLogged] = useState(false);

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return;
            const date = localDateString();
            const local = await getLocalDailyLog(user.id, date);
            if (local) { setLogged(true); return; }
            const { data } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', date).maybeSingle();
            setLogged(!!data);
        })();
    }, []);

    // Only doses scheduled for today (weekday-specific medications are excluded on other days).
    const totalDoses = todayDoses.length;
    const takenDoses = todayDoses.filter((d) => isTaken(d.med.id, d.time)).length;

    return (
        <div className="bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6">
            <h3 className="text-foreground text-lg font-semibold mb-1">{text.todayTitle}</h3>
            <div className="divide-y divide-border/60">
                <Row
                    icon="edit_note"
                    title={text.logTitle}
                    detail={logged ? text.logDone : text.logPending}
                    done={logged}
                    cta={logged ? text.doneLabel : text.logCta}
                    onClick={() => router.push('/log')}
                />
                <Row
                    icon="medication"
                    title={text.medsTitle}
                    detail={medsLoading ? '...' : totalDoses ? text.medsProgress(takenDoses, totalDoses) : text.medsNone}
                    done={totalDoses > 0 && takenDoses === totalDoses}
                    cta={totalDoses ? text.medsCta : '+'}
                    onClick={() => router.push('/log?tab=meds')}
                    progress={totalDoses ? Math.round((takenDoses / totalDoses) * 100) : undefined}
                />
            </div>
        </div>
    );
};
