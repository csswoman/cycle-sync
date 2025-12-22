import React from 'react';
import { Badge } from '@/components/ui/Badge';

interface DashboardHeaderProps {
    phase: string;
    day: number;
    focus: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ phase, day, focus }) => {
    return (
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Daily Personalized Plan</h1>
                <div className="flex flex-wrap items-center gap-2 text-[#ad93c8] text-sm md:text-base">
                    <Badge variant="primary" icon="water_drop">Phase: {phase}</Badge>
                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span>Day {day}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">target</span>
                        Focus: {focus}
                    </span>
                </div>
            </div>
        </header>
    );
};
