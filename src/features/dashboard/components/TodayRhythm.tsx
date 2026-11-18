'use client';

import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { TodayChecklist } from './TodayChecklist';
import { TodayPlanCard } from './TodayPlanCard';
import { HabitsProgress, WeekActivity } from './HabitsProgress';
import { QuickCheckin } from './QuickCheckin';
import { DailyGuide } from './DailyGuide';
import { useTodayCheckin } from '@/hooks/useTodayCheckin';
import type { CycleOverview } from '@/hooks/useCycleOverview';

const COPY = {
    es: { title: 'Ritmo de hoy', subtitle: 'Cuéntanos cómo vas y tu día se ajusta a ti.' },
    en: { title: "Today's rhythm", subtitle: 'Tell us how you are and your day adapts to you.' },
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
            className="relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4"
        >
            <header className="flex flex-col gap-0.5">
                <h2 id="today-rhythm-title" className="text-foreground text-xl font-semibold tracking-tight">{copy.title}</h2>
                <p className="text-muted-foreground text-sm text-pretty">{copy.subtitle}</p>
            </header>

            {/*
              Two independent columns on desktop so neither leaves a gap waiting for the other row:
              left = check-in, meals, log/meds, week; right = today's guide, habits.
              On mobile the columns dissolve (`contents`) and `order` puts the guide right after
              the check-in, since it adapts to it. Pregnancy mode drops the guide.
            */}
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
                <div className="contents lg:flex lg:flex-col lg:gap-4 lg:min-w-0">
                    {/* The check-in drives the rest of the card, so it gets its own soft panel. */}
                    <div className="order-1 min-w-0 rounded-2xl bg-secondary/30 border border-border/50 p-3">
                        <QuickCheckin state={checkin} lang={lang} />
                    </div>
                    {/* Plan right after the check-in: it is what the day is built around. Without a plan it shows empty slots that open the planner. */}
                    <div className="order-3 min-w-0 empty:hidden border-t border-border/60 pt-4">
                        <TodayPlanCard embedded />
                    </div>
                    <div className="order-4 min-w-0 border-t border-border/60 pt-4">
                        <TodayChecklist embedded />
                    </div>
                    <div className="order-5 min-w-0">
                        <WeekActivity />
                    </div>
                </div>
                <div className="contents lg:flex lg:flex-col lg:gap-6 lg:min-w-0 lg:border-l lg:border-border/60 lg:pl-6">
                    {!overview.paused && (
                        <div className="order-2 min-w-0 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0">
                            <DailyGuide state={checkin} overview={overview} lang={lang} />
                        </div>
                    )}
                    <div className="order-6 min-w-0 border-t border-border/60 pt-4 lg:mt-2 lg:pt-8">
                        <HabitsProgress embedded />
                    </div>
                </div>
            </div>
        </section>
    );
};
