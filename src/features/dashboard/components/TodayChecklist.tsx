'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getLocalDailyLog } from '@/lib/offlineHelpers';
import { useMedications, localDateString } from '@/hooks/useMedications';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { dashboardText } from '../dashboardText';
import { TODAY_CHANGED_EVENT } from '@/hooks/useTodayCheckin';

const COPY = {
    es: {
        markTaken: (name: string, time: string) => `Marcar toma de ${name} de las ${time}`,
        unmarkTaken: (name: string, time: string) => `Desmarcar toma de ${name} de las ${time}`,
        pending: (n: number) => (n === 1 ? '1 pendiente' : `${n} pendientes`),
        allDone: 'Todo al día',
        addMed: 'Añadir',
        section: 'Registro y medicación',
    },
    en: {
        markTaken: (name: string, time: string) => `Mark ${name} at ${time} as taken`,
        unmarkTaken: (name: string, time: string) => `Unmark ${name} at ${time}`,
        pending: (n: number) => `${n} pending`,
        allDone: 'All caught up',
        addMed: 'Add',
        section: 'Log and medication',
    },
};

interface HeadProps {
    icon: string;
    title: string;
    detail: string;
    done: boolean;
    cta: string;
    onClick: () => void;
}

/** Section heading: status icon, title with one detail line, and a quiet link to the full page. */
const Head: React.FC<HeadProps> = ({ icon, title, detail, done, cta, onClick }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`grid place-items-center size-6 rounded-lg shrink-0 ${done ? 'bg-leaf-soft text-leaf' : 'bg-blossom-soft text-blossom'}`}>
            <Icon name={done ? 'check_circle' : icon} size={14} weight={done ? 'fill' : 'duotone'} />
        </span>
        <div className="flex-1 basis-36 min-w-0">
            <p className="text-foreground font-semibold text-sm leading-snug">{title}</p>
            <p className="text-muted-foreground text-sm leading-snug">{detail}</p>
        </div>
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 inline-flex items-center gap-1 px-3.5 min-h-11 sm:min-h-9 sm:px-3 rounded-full text-sm font-semibold transition-colors cursor-pointer ${done ? 'text-muted-foreground hover:bg-secondary hover:text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
        >
            {cta}
            {done && <Icon name="arrow_forward" size={14} />}
        </button>
    </div>
);

/** `embedded`: drops the card chrome and title so it can sit inside TodayRhythm. */
export const TodayChecklist: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const text = dashboardText[lang];
    const copy = COPY[lang];
    const { todayDoses, isTaken, setTaken, loading: medsLoading } = useMedications();
    const [logged, setLogged] = useState(false);

    useEffect(() => {
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return;
            const date = localDateString();
            const local = await getLocalDailyLog(user.id, date);
            if (local) { setLogged(true); return; }
            const { data } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', date).maybeSingle();
            setLogged(!!data);
        };
        void check();
        // The quick check-in on the dashboard also counts as today's log.
        window.addEventListener(TODAY_CHANGED_EVENT, check);
        return () => window.removeEventListener(TODAY_CHANGED_EVENT, check);
    }, []);

    // Only doses scheduled for today (weekday-specific medications are excluded on other days).
    const totalDoses = todayDoses.length;
    const takenDoses = todayDoses.filter((d) => isTaken(d.med.id, d.time)).length;
    const medsDone = totalDoses > 0 && takenDoses === totalDoses;
    const pendingTotal = (logged ? 0 : 1) + (totalDoses - takenDoses);

    return (
        <div className={embedded ? 'flex flex-col gap-2' : 'bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-5'}>
            {!embedded && (
                <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-foreground text-lg font-semibold tracking-tight">{text.todayTitle}</h3>
                    {!medsLoading && (
                        <span className={`text-sm tabular-nums ${pendingTotal === 0 ? 'text-leaf font-medium' : 'text-muted-foreground'}`}>
                            {pendingTotal === 0 ? copy.allDone : copy.pending(pendingTotal)}
                        </span>
                    )}
                </div>
            )}

            {/* Log and medication side by side as two tiles; the dose list spans both below. */}
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-xl bg-secondary/30 p-3">
                        <Head
                            icon="edit_note"
                            title={text.logTitle}
                            detail={logged ? text.logDone : text.logPending}
                            done={logged}
                            cta={logged ? text.doneLabel : text.logCta}
                            onClick={() => router.push('/log')}
                        />
                    </div>
                    <div className="rounded-xl bg-secondary/30 p-3">
                        <Head
                            icon="medication"
                            title={text.medsTitle}
                            detail={medsLoading ? '...' : totalDoses ? text.medsProgress(takenDoses, totalDoses) : text.medsNone}
                            done={medsDone}
                            cta={totalDoses ? text.medsCta : copy.addMed}
                            onClick={() => router.push(totalDoses ? '/log?tab=meds' : '/medications')}
                        />
                    </div>
                </div>

                {totalDoses > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {todayDoses.map(({ med, time }) => {
                            const taken = isTaken(med.id, time);
                            return (
                                <li key={`${med.id}-${time}`}>
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={taken}
                                        aria-label={taken ? copy.unmarkTaken(med.name, time) : copy.markTaken(med.name, time)}
                                        onClick={() => void setTaken(med.id, time, !taken)}
                                        className={`w-full min-h-11 px-3 rounded-xl flex items-center gap-3 text-left transition-colors duration-200 cursor-pointer active:scale-[0.99] ${taken ? 'bg-leaf-soft/60' : 'bg-secondary/30 hover:bg-secondary/60'
                                            }`}
                                    >
                                        <span
                                            aria-hidden
                                            className={`size-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-200 ${taken ? 'bg-leaf border-leaf text-card' : 'border-muted-foreground/40'
                                                }`}
                                        >
                                            {taken && <Icon name="check" size={14} weight="bold" />}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className={`block text-sm font-medium truncate ${taken ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                {med.name}
                                            </span>
                                            {med.dose && <span className="block text-sm text-muted-foreground truncate">{med.dose}</span>}
                                        </span>
                                        <span className="text-sm text-muted-foreground tabular-nums shrink-0">{time}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};
