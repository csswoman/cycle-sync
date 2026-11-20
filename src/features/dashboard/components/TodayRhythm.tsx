'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { useLanguage } from '@/i18n/LanguageContext';
import { TodayTabs } from './DashboardGroups';
import { DailyGuide, PhaseSubtitle } from './DailyGuide';
import { CycleStatsCard } from './CycleStatsCard';
import { useTodayCheckin } from '@/hooks/useTodayCheckin';
import type { CycleOverview } from '@/hooks/useCycleOverview';

const COPY = {
    es: { planTitle: 'Tu plan de hoy', planLink: 'Ver plan semanal', planSub: 'Tus comidas y entrenamiento de hoy.', title: 'Ritmo de hoy', subtitle: 'Tu guía, tu plan y tus pendientes de hoy.' },
    en: { planTitle: "Today's plan", planLink: 'Open planner', planSub: 'Your meals and workout for today.', title: "Today's rhythm", subtitle: 'Your guide, plan and to-dos for today.' },
};

/**
 * The daily ritual as one surface: check-in and doses, the planner's meals and
 * workout, and habits. Each part keeps its own logic; this only gives them one
 * card and one hierarchy instead of three competing boxes.
 */
export const TodayRhythm: React.FC<{ overview: CycleOverview }> = ({ overview }) => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const copy = COPY[lang];
    const checkin = useTodayCheckin();

    return (
        <section
            aria-labelledby="today-rhythm-title"
            className="relative isolate overflow-hidden bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-4 sm:p-6"
        >
            <CardFlowers variant="rhythm" />
            {/* Left: title + Hoy/Plan/Registro tabs. Right: cycle numbers as a compact side column. */}
            <div className={`flex flex-col gap-5 ${overview.estimate ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-6 lg:items-start' : ''}`}>
                <div className="min-w-0">
                    <TodayTabs
                        header={(id) => (
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-baseline gap-x-4 gap-y-0 flex-wrap">
                                    <h2 id="today-rhythm-title" className="text-foreground text-lg sm:text-xl font-semibold tracking-tight">{id === 'plan' ? copy.planTitle : copy.title}</h2>
                                    {id === 'plan' && (
                                        <Link href="/planner" className="text-blossom text-sm font-semibold inline-flex items-center gap-1 py-2.5 -my-2.5 sm:py-0 sm:my-0 hover:text-blossom/80 transition-colors">
                                            {copy.planLink}<Icon name="arrow_forward" size={14} />
                                        </Link>
                                    )}
                                </div>
                                {id === 'plan' && !overview.paused
                                    ? <PhaseSubtitle overview={overview} lang={lang} fallback={copy.planSub} />
                                    : <p className="text-muted-foreground text-sm text-pretty">{id === 'plan' ? copy.planSub : copy.subtitle}</p>}
                            </div>
                        )}
                        guide={!overview.paused ? <DailyGuide state={checkin} overview={overview} lang={lang} /> : undefined}
                    />
                </div>
                {overview.estimate && (
                    <div className="min-w-0 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6">
                        <CycleStatsCard overview={overview} lang={lang} embedded />
                    </div>
                )}
            </div>
        </section>
    );
};
