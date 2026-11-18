'use client';

import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { TodayChecklist } from './TodayChecklist';
import { TodayPlanCard } from './TodayPlanCard';
import { HabitsProgress, WeekActivity } from './HabitsProgress';
import { CardFlowers } from '@/components/ui/CardFlowers';

const COPY = {
    es: { title: 'Ritmo de hoy', subtitle: 'Registro, medicación, plan y hábitos en un solo lugar.' },
    en: { title: "Today's rhythm", subtitle: 'Log, medication, plan and habits in one place.' },
};

/**
 * The daily ritual as one surface: check-in and doses, the planner's meals and
 * workout, and habits. Each part keeps its own logic; this only gives them one
 * card and one hierarchy instead of three competing boxes.
 */
export const TodayRhythm: React.FC = () => {
    const { language } = useLanguage();
    const copy = COPY[language === 'es' ? 'es' : 'en'];

    return (
        <section
            aria-labelledby="today-rhythm-title"
            className="relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-6"
        >
            <CardFlowers variant="rhythm" />
            <header>
                <h2 id="today-rhythm-title" className="text-foreground text-xl font-semibold tracking-tight">{copy.title}</h2>
                <p className="text-muted-foreground text-sm">{copy.subtitle}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-6">
                <div className="flex flex-col gap-6 min-w-0">
                    <TodayChecklist embedded />
                    {/* Without a plan TodayPlanCard shows empty slots that open the planner. */}
                    <div className="empty:hidden border-t border-border/60 pt-5">
                        <TodayPlanCard embedded />
                    </div>
                    <WeekActivity />
                </div>
                <div className="min-w-0 border-t border-border/60 pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6">
                    <HabitsProgress embedded />
                </div>
            </div>
        </section>
    );
};
