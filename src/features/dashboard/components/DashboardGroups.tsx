'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/i18n/LanguageContext';
import { useHabits } from '@/hooks/useHabits';
import { useTodayCheckin } from '@/hooks/useTodayCheckin';
import { useMedications } from '@/hooks/useMedications';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';
import type { CycleOverview } from '@/hooks/useCycleOverview';
import { DashTabs } from './DashTabs';
import { TodayPlanCard } from './TodayPlanCard';
import { TodayChecklist } from './TodayChecklist';
import { HabitsProgress, WeekActivity } from './HabitsProgress';
import HealthConnectWidget from './HealthConnectWidget';
import { QuickCheckin } from './QuickCheckin';
import { CycleStatsCard } from './CycleStatsCard';
import { WeeklySummaryCard } from './WeeklySummaryCard';

const COPY = {
    es: { today: 'Hoy', plan: 'Plan', pending: 'Registro', habits: 'Hábitos', body: 'Cuerpo', week: 'Semana', cycle: 'Mi ciclo', summary: 'Resumen semanal', trackTitle: 'Seguimiento', titles: { habits: 'Hábitos de hoy', body: 'Tu cuerpo hoy', week: 'Esta semana' } as Record<string, string>, trackSub: 'Hábitos, pasos, sueño y actividad.', checkin: 'Cómo me siento', fullLog: 'Registro completo' },
    en: { today: 'Today', plan: 'Plan', pending: 'Log', habits: 'Habits', body: 'Body', week: 'Week', cycle: 'My cycle', summary: 'Weekly summary', trackTitle: 'Tracking', titles: { habits: "Today's habits", body: 'Your body today', week: 'This week' } as Record<string, string>, trackSub: 'Habits, steps, sleep and activity.', checkin: 'How I feel', fullLog: 'Full log' },
};
const useCopy = () => COPY[useLanguage().language === 'es' ? 'es' : 'en'];

/** Today's plan and the log/medication checklist as two tabs; the badge counts doses still to take. */
export const TodayTabs: React.FC<{ guide?: React.ReactNode; header?: React.ReactNode | ((activeId: string) => React.ReactNode) }> = ({ guide, header }) => {
    const c = useCopy();
    const { todayDoses, isTaken, loading } = useMedications();
    const left = todayDoses.filter((d) => !isTaken(d.med.id, d.time)).length;
    return (
        <DashTabs
            label={c.today}
            storageKey="dash-tab-today-v3"
            header={header}
            stretch
            tabs={[
                { id: 'plan', label: c.plan, content: <TodayPlanCard embedded /> },
                { id: 'today', label: c.today, badge: !loading && left > 0 ? String(left) : undefined, content: <div className="flex flex-col gap-2">{guide}<TodayChecklist embedded /></div> },
            ]}
        />
    );
};

/**
 * Body metrics with the optional check-in behind a toggle. The check-in replaces only the three
 * tiles (same grid cell), so opening it never makes the card taller.
 */
const BodyTab: React.FC = () => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const c = COPY[lang];
    const checkin = useTodayCheckin();
    const [open, setOpen] = useState(false);
    return (
        <HealthConnectWidget
            bare
            swap={open ? <QuickCheckin state={checkin} lang={lang} paged onClose={() => setOpen(false)} /> : null}
            footerStart={open ? (
                <Link href="/log" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground min-h-9">
                    {c.fullLog}<Icon name="arrow_forward" size={14} />
                </Link>
            ) : undefined}
            footerAction={
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-pressed={open}
                    className={`inline-flex items-center gap-1.5 px-3 min-h-8 rounded-full text-sm font-semibold transition-colors cursor-pointer ${open ? 'bg-blossom/15 text-blossom' : 'bg-secondary hover:bg-secondary/70 text-foreground'}`}
                >
                    <Icon
                        name={open ? 'close' : checkin.logged ? 'check_circle' : 'add'}
                        size={15}
                        weight={!open && checkin.logged ? 'fill' : 'regular'}
                        className={open ? '' : checkin.logged ? 'text-leaf' : 'text-blossom'}
                    />
                    {c.checkin}
                </button>
            }
        />
    );
};

/** Habits, body data (steps, sleep, activity) and weekly bars in one card. */
export const TrackingCard: React.FC = () => {
    const c = useCopy();
    const { habits, getLogForHabit } = useHabits();
    const shown = habits.slice(0, 5);
    const done = shown.filter((h) => getLogForHabit(h.id)?.completed).length;
    return (
        <section aria-labelledby="tracking-title" className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-4 sm:p-5 flex flex-col gap-3">
            <DashTabs
                label={c.trackTitle}
                storageKey="dash-tab-tracking"
                header={(id) => <h2 id="tracking-title" className="text-foreground text-lg sm:text-xl font-semibold tracking-tight">{c.titles[id] ?? c.trackTitle}</h2>}
                tabs={[
                    { id: 'habits', label: c.habits, badge: shown.length ? `${done}/${shown.length}` : undefined, content: <HabitsProgress embedded /> },
                    { id: 'body', label: c.body, content: <BodyTab /> },
                    { id: 'week', label: c.week, content: <WeekActivity /> },
                ]}
            />
        </section>
    );
};

/** Cycle numbers and the weekly summary (only offered once it has data) as tabs in one card. */
export const InsightsCard: React.FC<{ overview: CycleOverview; showCycle: boolean }> = ({ overview, showCycle }) => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const c = COPY[lang];
    const { summary, loading } = useWeeklySummary(lang);
    const hasSummary = !loading && !!summary && summary.loggedDays >= 3;
    const tabs = [
        ...(showCycle ? [{ id: 'cycle', label: c.cycle, content: <CycleStatsCard overview={overview} lang={lang} embedded /> }] : []),
        ...(hasSummary ? [{ id: 'summary', label: c.summary, content: <WeeklySummaryCard embedded /> }] : []),
    ];
    if (tabs.length === 0) return null;
    return (
        <section className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-4 sm:p-6">
            {tabs.length === 1 ? tabs[0].content : <DashTabs tabs={tabs} label={c.cycle} storageKey="dash-tab-insights" />}
        </section>
    );
};
