'use client';
import React from 'react';
import { View } from '@/types';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCycleOverview } from '@/hooks/useCycleOverview';
import { CycleHero } from './components/CycleHero';
import { TodayRhythm } from './components/TodayRhythm';
import { InsightsCard, TrackingCard } from './components/DashboardGroups';
import { AppointmentBanner } from './components/AppointmentBanner';
import { ProfileNudge } from './components/ProfileNudge';
import { FertilityWindowCard, PregnancyHero } from '@/features/pregnancy/PregnancyCards';
import { PhaseExplorer } from './components/PhaseExplorer';
import { dashboardText } from './dashboardText';

interface DashboardProps {
    onNavigate: (view: View) => void;
    userName?: string;
}

/**
 * Hierarchy: the cycle hero leads, then today's ritual, then a Tracking card (habits/body/week tabs), then phase
 * suggestions beside the cycle numbers and the weekly summary. Without data
 * (guests, new accounts) a phase explorer takes the place of the personal
 * sections so the page still teaches something. Catalog content
 * (articles, recipes, videos) lives on its own pages.
 */
const Dashboard: React.FC<DashboardProps> = ({ userName }) => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const text = dashboardText[lang];
    const overview = useCycleOverview();
    const explore = !overview.loading && !overview.paused && !overview.info;
    const today = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
            <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 pb-32">
                <header className="flex flex-col gap-1">
                    <h1 className="text-foreground text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-balance">
                        {text.greeting(userName?.split(' ')[0])}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base text-pretty first-letter:uppercase">{today}. {text.subtitle}</p>
                </header>

                <AppointmentBanner />
                <ProfileNudge overview={overview} lang={lang} />
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="flex flex-col gap-6 min-w-0 [&>*:first-child]:flex-1 [&>*:first-child]:justify-between">
                        {overview.paused
                            ? <PregnancyHero overview={overview} lang={lang} />
                            : <CycleHero overview={overview} />}
                        <FertilityWindowCard overview={overview} lang={lang} />
                    </div>
                    <TrackingCard />
                </div>
                <TodayRhythm overview={overview} />
                {explore
                    ? <PhaseExplorer answers={overview.answers} />
                    : <InsightsCard overview={overview} showCycle={false} />}
                <footer className="pt-4 border-t border-border/60 text-center">
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed text-pretty">{text.disclaimer}</p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
