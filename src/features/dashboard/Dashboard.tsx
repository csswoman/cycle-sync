'use client';
import React from 'react';
import { View } from '@/types';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCycleOverview } from '@/hooks/useCycleOverview';
import { CycleHero } from './components/CycleHero';
import { TodayRhythm } from './components/TodayRhythm';
import { PhaseRecommendations } from './components/PhaseRecommendations';
import { WeeklySummaryCard } from './components/WeeklySummaryCard';
import { AppointmentBanner } from './components/AppointmentBanner';
import { ProfileNudge } from './components/ProfileNudge';
import HealthConnectWidget from './components/HealthConnectWidget';
import { FertilityWindowCard, PregnancyHero } from '@/features/pregnancy/PregnancyCards';
import { PhaseExplorer } from './components/PhaseExplorer';
import { CycleStatsCard } from './components/CycleStatsCard';
import { DiscoverSection } from './components/DiscoverSection';
import { dashboardText } from './dashboardText';

interface DashboardProps {
    onNavigate: (view: View) => void;
    userName?: string;
}

/**
 * Hierarchy: the cycle hero leads. With data, today's ritual follows, then phase
 * suggestions beside the cycle numbers and the weekly summary. Without data
 * (guests, new accounts) a phase explorer takes the place of the personal
 * sections so the page still teaches something. A rotating article and
 * shortcuts close the page for everyone.
 */
const Dashboard: React.FC<DashboardProps> = ({ userName }) => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const text = dashboardText[lang];
    const overview = useCycleOverview();
    const showPhase = !!overview.info && !overview.paused;
    const explore = !overview.loading && !overview.paused && !overview.info;
    const today = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 pb-32">
                <header className="flex flex-col gap-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground first-letter:uppercase">{today}</p>
                    <h1 className="text-foreground text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
                        {text.greeting(userName?.split(' ')[0])}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">{text.subtitle}</p>
                </header>

                <AppointmentBanner />
                <ProfileNudge overview={overview} lang={lang} />
                {overview.paused
                    ? <PregnancyHero overview={overview} lang={lang} />
                    : <CycleHero overview={overview} />}
                <FertilityWindowCard overview={overview} lang={lang} />

                {explore ? (
                    <>
                        <PhaseExplorer answers={overview.answers} />
                        <TodayRhythm />
                        <WeeklySummaryCard />
                    </>
                ) : (
                    <>
                        <TodayRhythm />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {showPhase && (
                                <div className="lg:col-span-8">
                                    <PhaseRecommendations phase={overview.info!.phase} answers={overview.answers} />
                                </div>
                            )}
                            <div className={`flex flex-col gap-6 ${showPhase ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
                                {showPhase && <CycleStatsCard overview={overview} lang={lang} />}
                                <WeeklySummaryCard />
                            </div>
                        </div>
                    </>
                )}

                <DiscoverSection lang={lang} />

                <HealthConnectWidget quiet />

                <footer className="pt-4 border-t border-border/60 text-center">
                    <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">{text.disclaimer}</p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
