import React, { useState } from 'react';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import { persistOnboardingAnswers } from '@/stores/profileStore';
import { cycleProfile, type Diagnosis, type Goal, type OnboardingAnswers, type PmosToolsPref } from './onboarding';
import { onboardingText } from '@/i18n/onboardingText';
import type { Language } from '@/i18n/translations';

const COPY = {
    es: {
        goal: 'Objetivo', diagnosis: '¿Tienes diagnóstico de SOP/PMOS?', tools: 'Herramientas de PMOS',
        toolsHint: 'Incluye el kit PMOS en el menú y los consejos sobre resistencia a la insulina.',
        prefs: { auto: 'Automático', show: 'Mostrar', hide: 'Ocultar' } as Record<PmosToolsPref, string>,
        auto: (on: boolean) => `Según tu perfil: ${on ? 'se muestran' : 'ocultas'}.`,
        saved: 'Guardado', error: 'No se pudo guardar.',
    },
    en: {
        goal: 'Goal', diagnosis: 'Have you been diagnosed with PCOS/PMOS?', tools: 'PMOS tools',
        toolsHint: 'Includes the PMOS toolkit in the menu and the insulin resistance tips.',
        prefs: { auto: 'Automatic', show: 'Show', hide: 'Hide' } as Record<PmosToolsPref, string>,
        auto: (on: boolean) => `Based on your profile: ${on ? 'shown' : 'hidden'}.`,
        saved: 'Saved', error: 'Could not save.',
    },
};

/** Goal, PMOS diagnosis and the PMOS-tools override. "Get pregnant" turns on trying-to-conceive mode. */
const GoalSettings: React.FC<{ language: Language }> = ({ language }) => {
    const answers = useOnboardingAnswers();
    const options = onboardingText[language].archetype.options;
    const c = COPY[language === 'es' ? 'es' : 'en'];
    const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle');

    // The store updates right away; a failed remote save rolls it back.
    const update = async (patch: Partial<OnboardingAnswers>) => {
        const previous = answers;
        const ok = await persistOnboardingAnswers({ ...answers, ...patch });
        if (ok) setState('saved');
        else {
            await persistOnboardingAnswers(previous).catch(() => undefined);
            setState('error');
        }
    };

    const goals: Goal[] = ['performance', 'pmos', 'fertility', 'wellness'];
    const diagnoses: Diagnosis[] = ['yes', 'suspect', 'no', 'private'];
    const prefs: PmosToolsPref[] = ['auto', 'show', 'hide'];
    const pref = answers.pmosTools ?? 'auto';

    return (
        <div className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-3">
                <legend className="text-sm font-bold text-foreground mb-2">{c.goal}</legend>
                {goals.map((id) => {
                    const opt = options[`goal_${id}`];
                    return (
                        <label key={id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${answers.goal === id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                            <input type="radio" name="goal" checked={answers.goal === id} onChange={() => update({ goal: id })} className="mt-1 accent-primary" />
                            <span>
                                <span className="block text-sm font-bold text-foreground">{opt?.label}</span>
                                {opt?.description && <span className="block text-xs text-muted-foreground">{opt.description}</span>}
                            </span>
                        </label>
                    );
                })}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold text-foreground mb-2">{c.diagnosis}</legend>
                <div className="flex flex-wrap gap-2">
                    {diagnoses.map((id) => (
                        <label key={id} className={`px-3.5 py-2 rounded-full border text-sm font-semibold cursor-pointer ${answers.diagnosis === id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}>
                            <input type="radio" name="diagnosis" className="sr-only" checked={answers.diagnosis === id} onChange={() => update({ diagnosis: id })} />
                            {options[`dx_${id}`]?.label}
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold text-foreground mb-1">{c.tools}</legend>
                <p className="text-xs text-muted-foreground">{c.toolsHint}</p>
                <div className="flex flex-wrap gap-2">
                    {prefs.map((id) => (
                        <label key={id} className={`px-3.5 py-2 rounded-full border text-sm font-semibold cursor-pointer ${pref === id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}>
                            <input type="radio" name="pmosTools" className="sr-only" checked={pref === id} onChange={() => update({ pmosTools: id })} />
                            {c.prefs[id]}
                        </label>
                    ))}
                </div>
                {pref === 'auto' && <p className="text-xs text-muted-foreground">{c.auto(cycleProfile(answers) === 'pmos')}</p>}
            </fieldset>

            {state === 'saved' && <p className="text-xs text-leaf" aria-live="polite">{c.saved}</p>}
            {state === 'error' && <p className="text-xs text-destructive" role="alert">{c.error}</p>}
        </div>
    );
};
export default GoalSettings;
