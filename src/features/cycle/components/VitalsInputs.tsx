import React from 'react';
import { Icon } from '@/components/ui/Icon';

export type SleepQuality = 'restless' | 'solid' | 'deep';

interface VitalsInputsProps {
    energyLevel: number;
    onEnergyLevelChange: (level: number) => void;
    sleepHours: number;
    onSleepHoursChange: (hours: number) => void;
    sleepQuality: SleepQuality | null;
    onSleepQualityChange: (quality: SleepQuality | null) => void;
    lang?: 'es' | 'en';
}

const T = {
    es: { energy: 'Energía', low: 'Agotada', high: 'Con energía', sleep: 'Sueño', hrs: 'h', less: 'Menos horas', more: 'Más horas',
        quality: { restless: 'Inquieto', solid: 'Bueno', deep: 'Profundo' } },
    en: { energy: 'Energy', low: 'Exhausted', high: 'Energized', sleep: 'Sleep', hrs: 'hrs', less: 'Fewer hours', more: 'More hours',
        quality: { restless: 'Restless', solid: 'Solid', deep: 'Deep' } },
};

export const VitalsInputs: React.FC<VitalsInputsProps> = ({
    energyLevel,
    onEnergyLevelChange,
    sleepHours,
    onSleepHoursChange,
    sleepQuality,
    onSleepQualityChange,
    lang = 'en',
}) => {
    const t = T[lang];
    return (
        <div className="bg-secondary/40 border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors flex flex-col md:flex-row gap-8">
            {/* Energy Slider */}
            <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Icon name="bolt" size={20} weight="duotone" className="text-primary" />
                        {t.energy}
                    </h3>
                    <span className="text-primary font-bold text-lg">{energyLevel}/10</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                    <input
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer z-10"
                        max="10"
                        min="1"
                        type="range"
                        aria-label={t.energy}
                        value={energyLevel}
                        onChange={(e) => onEnergyLevelChange(parseInt(e.target.value))}
                    />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-l-lg pointer-events-none" style={{ width: `${energyLevel * 10}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                    <span>{t.low}</span>
                    <span>{t.high}</span>
                </div>
            </div>

            <div className="w-px bg-border hidden md:block"></div>

            {/* Sleep */}
            <div className="flex-1 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Icon name="bedtime" size={20} weight="duotone" className="text-primary" />
                    {t.sleep}
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onSleepHoursChange(Math.max(0, sleepHours - 0.5))}
                        aria-label={t.less}
                        className="size-10 rounded-lg bg-secondary hover:bg-surface-hover flex items-center justify-center text-foreground transition-colors">
                        <Icon name="remove" size={16} />
                    </button>
                    <div className="flex-1 text-center bg-secondary/50 rounded-lg py-2 border border-border">
                        <span className="text-2xl font-bold text-foreground">{sleepHours}</span>
                        <span className="text-xs text-muted-foreground ml-1">{t.hrs}</span>
                    </div>
                    <button
                        onClick={() => onSleepHoursChange(Math.min(24, sleepHours + 0.5))}
                        aria-label={t.more}
                        className="size-10 rounded-lg bg-secondary hover:bg-surface-hover flex items-center justify-center text-foreground transition-colors">
                        <Icon name="add" size={16} />
                    </button>
                </div>
                <div className="flex gap-2">
                    {(['restless', 'solid', 'deep'] as const).map((quality) => {
                        const active = sleepQuality === quality;
                        return (
                            <button key={quality} aria-pressed={active}
                                onClick={() => onSleepQualityChange(active ? null : quality)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors border
              ${active ? 'bg-primary/20 text-foreground border-primary/50' : 'bg-secondary text-muted-foreground border-transparent hover:bg-primary/10 hover:text-foreground'}`}>
                                {t.quality[quality]}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
