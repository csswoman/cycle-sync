import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { onboardingText } from '@/i18n/onboardingText';
import { PeriodDayCalendar } from '@/components/PeriodDayCalendar';

interface StepCycleDetailsProps {
    selectedDays: string[];
    onChangeDays: (days: string[]) => void;
    savedDays: string[];
    cycleLength: number;
    setCycleLength: (length: number) => void;
    /** Cycles detected from the marked/saved history (0 when there is not enough data). */
    detectedCycles: number;
    unsure: boolean;
    setUnsure: (value: boolean) => void;
}

export const StepCycleDetails: React.FC<StepCycleDetailsProps> = ({
    selectedDays, onChangeDays, savedDays, cycleLength, setCycleLength, detectedCycles, unsure, setUnsure,
}) => {
    const { language } = useLanguage();
    const text = onboardingText[language].setup.cycle;
    const total = selectedDays.length + savedDays.length;
    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{text.title}</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal">{text.subtitle}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-foreground">{text.calendarTitle}</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-5">{text.calendarHelp}</p>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <PeriodDayCalendar selected={selectedDays} onChange={onChangeDays} saved={savedDays} />
                    <p className="text-sm text-muted-foreground">{text.daysMarked(total)}</p>
                </div>
                {total === 0 && !unsure && <p className="text-sm text-sun-ink mt-4">{text.needData}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-foreground">{text.avgTitle}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{text.avgHelp}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6 bg-secondary rounded-lg p-2 border border-border">
                        <button
                            type="button"
                            onClick={() => setCycleLength(Math.max(20, cycleLength - 1))}
                            className="size-10 flex items-center justify-center rounded-md hover:bg-accent text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">remove</span>
                        </button>
                        <span className="text-2xl font-bold text-foreground">{cycleLength}</span>
                        <button
                            type="button"
                            onClick={() => setCycleLength(Math.min(60, cycleLength + 1))}
                            className="size-10 flex items-center justify-center rounded-md hover:bg-accent text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    </div>
                    {detectedCycles > 0 && <p className="text-xs text-muted-foreground mt-3">{text.avgFromHistory(cycleLength, detectedCycles)}</p>}
                </div>
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-foreground">{text.unsureTitle}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{text.unsureHelp}</p>
                    </div>
                    <label className="mt-6 flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={unsure}
                            onChange={(e) => setUnsure(e.target.checked)}
                            className="h-5 w-5 cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{text.unsureCheck}</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
