import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';

interface DashboardHeaderProps {
    phase: string;
    day: number;
    focus: string;
    userName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ phase, day, focus, userName }) => {
    return (
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 pb-1">
            <div className="flex flex-col gap-2">
                <h1 className="text-foreground text-3xl sm:text-4xl md:text-[40px] font-semibold leading-tight tracking-tight">
                    {userName ? `Hi, ${userName.split(' ')[0]}!` : 'Daily Personalized Plan'}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-muted-foreground text-xs sm:text-sm font-medium">
                    <Badge variant="primary" icon="water_drop">{phase} Phase</Badge>
                    <span className="size-1 rounded-full bg-border"></span>
                    <span className="text-foreground font-semibold">Day {day}</span>
                    <span className="size-1 rounded-full bg-border"></span>
                    <span className="flex items-center gap-1.5">
                        <Icon name="flag" size={16} weight="duotone" className="text-blossom" />
                        <span>Focus: <strong className="text-foreground font-semibold">{focus}</strong></span>
                    </span>
                </div>
            </div>
        </header>
    );
};
