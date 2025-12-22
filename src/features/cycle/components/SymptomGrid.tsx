import React from 'react';

interface SymptomGridProps {
    activeSymptoms: string[];
    toggleSymptom: (symptom: string) => void;
}

export const SymptomGrid: React.FC<SymptomGridProps> = ({ activeSymptoms, toggleSymptom }) => {
    const symptoms = ['Mild Cramps', 'Bloating', 'Headache', 'Acne Flare', 'High Libido', 'Sugar Cravings', 'Back Pain'];

    return (
        <div className="bg-surface-dark/40 border border-surface-dark rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
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
                                    ? 'bg-primary text-white border-primary shadow-[0_4px_10px_rgba(127,25,230,0.3)]'
                                    : 'bg-surface-dark text-text-secondary border-transparent hover:bg-surface-dark-hover hover:text-white'}`}
                        >
                            {isActive && <span className="material-symbols-outlined text-[18px]">check</span>}
                            {symptom}
                        </button>
                    );
                })}
                <button className="px-4 py-2 rounded-full border border-surface-dark border-dashed text-text-secondary text-sm font-medium hover:text-white hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-1 pl-3">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Other
                </button>
            </div>
        </div>
    );
};
