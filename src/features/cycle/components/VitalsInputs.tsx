import React from 'react';

interface VitalsInputsProps {
    energyLevel: number;
    onEnergyLevelChange: (level: number) => void;
    sleepHours: number;
    onSleepHoursChange: (hours: number) => void;
}

export const VitalsInputs: React.FC<VitalsInputsProps> = ({
    energyLevel,
    onEnergyLevelChange,
    sleepHours,
    onSleepHoursChange,
}) => {
    return (
        <div className="bg-secondary/40 border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors flex flex-col md:flex-row gap-8">
            {/* Energy Slider */}
            <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">bolt</span>
                        Energy
                    </h3>
                    <span className="text-primary font-bold text-lg">{energyLevel}/10</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                    <input
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer z-10"
                        max="10"
                        min="1"
                        type="range"
                        value={energyLevel}
                        onChange={(e) => onEnergyLevelChange(parseInt(e.target.value))}
                    />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-l-lg pointer-events-none" style={{ width: `${energyLevel * 10}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                    <span>Exhausted</span>
                    <span>Energized</span>
                </div>
            </div>

            <div className="w-px bg-border hidden md:block"></div>

            {/* Sleep Input */}
            <div className="flex-1 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">bedtime</span>
                    Sleep Quality
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onSleepHoursChange(Math.max(0, sleepHours - 0.5))}
                        className="size-10 rounded-lg bg-secondary hover:bg-surface-hover flex items-center justify-center text-foreground transition-colors">
                        <span className="material-symbols-outlined">remove</span>
                    </button>
                    <div className="flex-1 text-center bg-secondary/50 rounded-lg py-2 border border-border">
                        <span className="text-2xl font-bold text-foreground">{sleepHours}</span>
                        <span className="text-xs text-muted-foreground ml-1">hrs</span>
                    </div>
                    <button
                        onClick={() => onSleepHoursChange(sleepHours + 0.5)}
                        className="size-10 rounded-lg bg-secondary hover:bg-surface-hover flex items-center justify-center text-foreground transition-colors">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    {['Restless', 'Solid', 'Deep'].map((quality) => (
                        <button key={quality} className={`flex-1 py-1.5 rounded text-xs transition-colors
              ${quality === 'Solid' ? 'bg-primary/20 text-foreground border border-primary/50' : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-foreground'}`}>
                            {quality}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
