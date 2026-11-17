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
    es: {
        energy: 'Energía', low: 'Agotada', high: 'Con energía', sleep: 'Sueño', hrs: 'h', less: 'Menos horas', more: 'Más horas',
        quality: { restless: 'Inquieto', solid: 'Bueno', deep: 'Profundo' }
    },
    en: {
        energy: 'Energy', low: 'Exhausted', high: 'Energized', sleep: 'Sleep', hrs: 'hrs', less: 'Fewer hours', more: 'More hours',
        quality: { restless: 'Restless', solid: 'Solid', deep: 'Deep' }
    },
};
/** Energy and sleep. Bare section: the daily log wraps its sections in a single card. */
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0 md:divide-x md:divide-border">
            <section className="flex flex-col gap-4 md:pr-8" aria-labelledby="log-energy-title">
                <div className="flex justify-between items-center gap-3">
                    <h2 id="log-energy-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Icon name="bolt" size={20} weight="duotone" className="text-primary" />
                        {t.energy}
                    </h2>
                    <span className="text-primary font-semibold text-lg tabular-nums">{energyLevel}/10</span>
                </div>
                <input
                    className="w-full h-11 cursor-pointer accent-primary"
                    max="10"
                    min="1"
                    type="range"
                    aria-labelledby="log-energy-title"
                    aria-valuetext={`${energyLevel}/10`}
                    value={energyLevel}
                    onChange={(e) => onEnergyLevelChange(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t.low}</span>
                    <span>{t.high}</span>
                </div>
            </section>
            <section className="flex flex-col gap-4 md:pl-8" aria-labelledby="log-sleep-title">
                <h2 id="log-sleep-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Icon name="bedtime" size={20} weight="duotone" className="text-primary" />
                    {t.sleep}
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onSleepHoursChange(Math.max(0, sleepHours - 0.5))}
                        aria-label={t.less}
                        className="size-11 shrink-0 rounded-full bg-secondary hover:bg-surface-hover flex items-center justify-center text-foreground transition-colors">
                        <Icon name="remove" size={18} />
                    </button>
                    <div className="flex-1 text-center" role="status" aria-live="polite">
                        <span className="text-3xl font-semibold text-foreground tabular-nums">{sleepHours}</span>
                        <span className="text-sm text-muted-foreground ml-1">{t.hrs}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSleepHoursChange(Math.min(24, sleepHours + 0.5))}
                        aria-label={t.more}
                        className="size-11 shrink-0 rounded-full bg-secondary hover:bg-surface-hover flex items-center justify-center text-foreground transition-colors">
                        <Icon name="add" size={18} />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label={t.sleep}>
                    {(['restless', 'solid', 'deep'] as const).map((quality) => {
                        const active = sleepQuality === quality;
                        return (
                            <button key={quality} type="button" aria-pressed={active}
                                onClick={() => onSleepQualityChange(active ? null : quality)}
                                className={`min-h-10 rounded-full text-sm font-semibold transition-colors border
              ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-transparent hover:bg-surface-hover hover:text-foreground'}`}>
                                {t.quality[quality]}
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
