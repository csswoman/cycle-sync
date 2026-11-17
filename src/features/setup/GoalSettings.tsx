import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import { deriveArchetype, saveOnboardingAnswers, type Goal } from './onboarding';
import { onboardingText } from '@/i18n/onboardingText';
import type { Language } from '@/i18n/translations';
/** Lets the user change the questionnaire goal. "Get pregnant" turns on trying-to-conceive mode. */
const GoalSettings: React.FC<{ language: Language }> = ({ language }) => {
    const answers = useOnboardingAnswers();
    const options = onboardingText[language].archetype.options;
    const [goal, setGoal] = useState<Goal | undefined>(answers.goal);
    const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle');
    useEffect(() => { setGoal(answers.goal); }, [answers.goal]);
    const choose = async (next: Goal) => {
        const previous = goal;
        setGoal(next);
        const merged = { ...answers, goal: next };
        saveOnboardingAnswers(merged);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return;
            const { error } = await supabase.from('cycle_config')
                .update({ archetype: deriveArchetype(merged), onboarding_answers: merged, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
            if (error) throw error;
            setState('saved');
        } catch {
            setGoal(previous);
            saveOnboardingAnswers({ ...answers });
            setState('error');
        }
    };
    const ids: Goal[] = ['performance', 'pmos', 'fertility', 'wellness'];
    return (
        <div className="flex flex-col gap-3" role="radiogroup">
            {ids.map((id) => {
                const opt = options[`goal_${id}`];
                return (
                    <label key={id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${goal === id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <input type="radio" name="goal" checked={goal === id} onChange={() => choose(id)} className="mt-1 accent-primary" />
                        <span>
                            <span className="block text-sm font-bold text-foreground">{opt?.label}</span>
                            {opt?.description && <span className="block text-xs text-muted-foreground">{opt.description}</span>}
                        </span>
                    </label>
                );
            })}
            {state === 'saved' && <p className="text-xs text-emerald-600" aria-live="polite">{language === 'es' ? 'Guardado' : 'Saved'}</p>}
            {state === 'error' && <p className="text-xs text-destructive" role="alert">{language === 'es' ? 'No se pudo guardar.' : 'Could not save.'}</p>}
        </div>
    );
};
export default GoalSettings;
