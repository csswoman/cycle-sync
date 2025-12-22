import React from 'react';

interface SymptomGridProps {
    activeSymptoms: string[];
    toggleSymptom: (symptom: string) => void;
}

export const SymptomGrid: React.FC<SymptomGridProps> = ({ activeSymptoms, toggleSymptom }) => {
    const symptoms = ['Mild Cramps', 'Bloating', 'Headache', 'Acne Flare', 'High Libido', 'Sugar Cravings', 'Back Pain'];

    return (
        <div className="bg-secondary/40 border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">stethoscope</span>
                Symptom Quick-Log
            </h3>
            <div className="flex flex-wrap gap-3">
                {symptoms.map(symptom => {
                    const isActive = activeSymptoms.includes(symptom);
                    return (
                        <button
                            key={symptom}
                            onClick={() => toggleSymptom(symptom)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                ${isActive
                                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_4px_10px_rgba(127,25,230,0.3)]'
                                    : 'bg-secondary text-muted-foreground border-transparent hover:bg-surface-hover hover:text-foreground'}`}
                        >
                            {isActive && <span className="material-symbols-outlined text-[18px]">check</span>}
                            {symptom}
                        </button>
                    );
                })}
                <button className="px-4 py-2 rounded-full border border-border border-dashed text-muted-foreground text-sm font-medium hover:text-foreground hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-1 pl-3">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Other
                </button>
            </div>
        </div>
    );
};
