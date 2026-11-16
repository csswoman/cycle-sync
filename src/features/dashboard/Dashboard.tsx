'use client';
import React from 'react';
import { View } from '@/types';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCycleOverview } from '@/hooks/useCycleOverview';
import { CycleHero } from './components/CycleHero';
import { TodayChecklist } from './components/TodayChecklist';
import { TodayPlanCard } from './components/TodayPlanCard';
import { PhaseRecommendations } from './components/PhaseRecommendations';
import { HabitsProgress } from './components/HabitsProgress';
import { WeeklySummaryCard } from './components/WeeklySummaryCard';
import { AppointmentBanner } from './components/AppointmentBanner';
import HealthConnectWidget from './components/HealthConnectWidget';
import { dashboardText } from './dashboardText';

interface DashboardProps {
    onNavigate: (view: View) => void;
    userName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userName }) => {
    const { language } = useLanguage();
    const text = dashboardText[language === 'es' ? 'es' : 'en'];
    const overview = useCycleOverview();

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 pb-32">
                <header className="flex flex-col gap-1">
                    <h1 className="text-foreground text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
                        {text.greeting(userName?.split(' ')[0])}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">{text.subtitle}</p>
                </header>

                <AppointmentBanner />
                <CycleHero overview={overview} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <TodayChecklist />
                        <TodayPlanCard />
                        <HealthConnectWidget />
                        {overview.info && <PhaseRecommendations phase={overview.info.phase} answers={overview.answers} />}
                        <WeeklySummaryCard />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <HabitsProgress />
                    </div>
                </div>

                <footer className="pt-4 border-t border-border/60 text-center">
                    <p className="text-[11px] text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">{text.disclaimer}</p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
