import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface SymptomGridProps {
    activeSymptoms: string[];
    toggleSymptom: (symptom: string) => void;
    lang?: 'es' | 'en';
}

/**
 * Quick-log symptoms. Stored values stay in English for compatibility with older logs;
 * acne, hair loss, hirsutism and mood are tracked in detail in the PMOS symptoms tab.
 * Nausea / digestive upset are included because they are common metformin side effects.
 */
const SYMPTOMS: { key: string; es: string }[] = [
    { key: 'Mild Cramps', es: 'Cólicos' },
    { key: 'Pelvic Pain', es: 'Dolor pélvico' },
    { key: 'Bloating', es: 'Hinchazón' },
    { key: 'Sugar Cravings', es: 'Antojos de azúcar' },
    { key: 'Energy Crash After Meals', es: 'Bajón después de comer' },
    { key: 'Headache', es: 'Dolor de cabeza' },
    { key: 'Breast Tenderness', es: 'Sensibilidad en senos' },
    { key: 'Spotting', es: 'Manchado' },
    { key: 'Nausea / Stomach Upset', es: 'Náuseas o malestar estomacal' },
    { key: 'Back Pain', es: 'Dolor de espalda' },
    { key: 'Acne Flare', es: 'Brote de acné' },
    { key: 'Anxiety', es: 'Ansiedad' },
    { key: 'High Libido', es: 'Libido alta' },
    // Eating patterns: the keys match EATING_SYMPTOMS in lib/pmos/wellbeing.ts.
    { key: 'Binge / Loss of Control', es: 'Atracón o pérdida de control' },
    { key: 'Emotional Eating', es: 'Comer por emociones' },
    { key: 'Skipped Meals', es: 'Me salté comidas' },
];

export const SymptomGrid: React.FC<SymptomGridProps> = ({ activeSymptoms, toggleSymptom, lang = 'en' }) => {
    const [adding, setAdding] = useState(false);
    const [custom, setCustom] = useState('');
    const known = new Set(SYMPTOMS.map((s) => s.key));
    // Custom symptoms saved earlier still show up as chips.
    const extras = activeSymptoms.filter((s) => !known.has(s));
    const label = (key: string) => (lang === 'es' ? SYMPTOMS.find((s) => s.key === key)?.es ?? key : key);

    const addCustom = () => {
        const value = custom.trim();
        if (value && !activeSymptoms.includes(value)) toggleSymptom(value);
        setCustom('');
        setAdding(false);
    };

    return (
        <div className="bg-secondary/40 border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
                <Icon name="stethoscope" size={20} weight="duotone" className="text-primary" />
                {lang === 'es' ? 'Síntomas rápidos' : 'Symptom Quick-Log'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
                {lang === 'es' ? 'Toca lo que sientes hoy. Acné, vello y caída de cabello se registran con detalle en “Síntomas PMOS”.' : 'Tap what you feel today. Acne, hair growth and hair loss are tracked in detail under “PMOS symptoms”.'}
            </p>
            <div className="flex flex-wrap gap-2.5">
                {[...SYMPTOMS.map((s) => s.key), ...extras].map(symptom => {
                    const isActive = activeSymptoms.includes(symptom);
                    return (
                        <button
                            key={symptom}
                            onClick={() => toggleSymptom(symptom)}
                            aria-pressed={isActive}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                ${isActive
                                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_4px_10px_rgba(127,25,230,0.3)]'
                                    : 'bg-secondary text-muted-foreground border-transparent hover:bg-surface-hover hover:text-foreground'}`}
                        >
                            {isActive && <Icon name="check" size={16} weight="bold" />}
                            {label(symptom)}
                        </button>
                    );
                })}
                {adding ? (
                    <form onSubmit={(e) => { e.preventDefault(); addCustom(); }} className="flex items-center gap-2">
                        <input autoFocus value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={40}
                            onBlur={() => { if (!custom.trim()) setAdding(false); }}
                            placeholder={lang === 'es' ? '¿Qué sientes?' : 'What do you feel?'}
                            className="px-4 py-2 rounded-full text-sm bg-card border border-primary text-foreground w-44 focus:outline-none" />
                        <button type="submit" className="px-3 py-2 rounded-full text-sm font-bold text-primary">{lang === 'es' ? 'Agregar' : 'Add'}</button>
                    </form>
                ) : (
                    <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-full border border-border border-dashed text-muted-foreground text-sm font-medium hover:text-foreground hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-1 pl-3">
                        <Icon name="add" size={16} />
                        {lang === 'es' ? 'Otro' : 'Add Other'}
                    </button>
                )}
            </div>
        </div>
    );
};
