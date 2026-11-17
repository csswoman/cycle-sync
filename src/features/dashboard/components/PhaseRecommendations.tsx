'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import type { OnboardingAnswers } from '@/features/setup/onboarding';
import { useRecipes } from '@/hooks/useRecipes';
import { useHabits } from '@/hooks/useHabits';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { useGuest } from '@/hooks/useGuest';
import { avoidedIn } from '@/lib/nutrition/foodPreferences';
import { toPhaseKey, rankRecipesForPhase, pendingPhaseHabits, FOOD_FOCUS } from '@/lib/cycle/phaseSuggestions';
import { PhaseRecipePicks } from '@/features/health/components/PhaseRecipePicks';
import { PhaseVideoPicks } from './PhaseVideoPicks';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { dashboardText, phaseKey } from '../dashboardText';

interface Props { phase: string; answers: OnboardingAnswers }

const COPY = {
  es: { videos: 'Clases sugeridas', meals: 'Comidas sugeridas', habits: 'Hábitos para estos días', add: 'Añadir', added: 'Añadido', seeHabits: 'Ver hábitos', allAdded: 'Ya tienes los hábitos sugeridos para esta fase.' },
  en: { videos: 'Suggested classes', meals: 'Suggested meals', habits: 'Habits for these days', add: 'Add', added: 'Added', seeHabits: 'See habits', allAdded: 'You already have the habits suggested for this phase.' },
};

export const PhaseRecommendations: React.FC<Props> = ({ phase, answers }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const text = dashboardText[lang];
    const copy = text.phases[phaseKey(phase)];
    const extra = COPY[lang];
    const key = toPhaseKey(phase);
    const focus = FOOD_FOCUS[key];
    const { isGuest, promptSignup } = useGuest();

    const foodPrefs = useFoodPreferences();
    const library = useRecipes(foodPrefs.prefs);
    const { habits, addCustomHabit, loading: habitsLoading } = useHabits();
    const [adding, setAdding] = useState<string | null>(null);

    const avoid = foodPrefs.prefs.avoid;
    const picks = useMemo(
        () => rankRecipesForPhase(library.recipes.filter((r) => avoidedIn(r, avoid).length === 0), key, lang, 3),
        [library.recipes, avoid, key, lang]
    );
    const habitIdeas = pendingPhaseHabits(key, habits.map((h) => h.name)).slice(0, 2);

    const notes: string[] = [];
    if (answers.activity === 'low') notes.push(text.lowActivityNote);
    if (answers.goal === 'pmos') notes.push(text.pmosNote);

    const addHabit = async (id: string) => {
        if (isGuest) { promptSignup(); return; }
        const s = habitIdeas.find((h) => h.id === id);
        if (!s) return;
        setAdding(id);
        try { await addCustomHabit(s.name[lang], s.goal, s.unit[lang]); } finally { setAdding(null); }
    };

    return (
        <div data-phase={key} className="relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <CardFlowers variant="phase" />
            <div>
                <h3 className="text-foreground text-lg font-semibold">{text.recommendTitle} · {copy.name}</h3>
                <p className="text-muted-foreground text-sm">{text.recommendSubtitle} {copy.hormones}.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Movement */}
                <div className="bg-secondary/40 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-phase">
                        <Icon name="fitness_center" size={20} weight="duotone" />
                        <p className="text-foreground font-semibold text-sm">{copy.movement.title}</p>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{copy.movement.desc}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">{extra.videos}</p>
                    <PhaseVideoPicks phase={key} lang={lang} lowActivity={answers.activity === 'low'} />
                    <button onClick={() => router.push('/routines?tab=phase')} className="mt-auto self-start text-sm font-semibold text-primary flex items-center gap-1 min-h-10 cursor-pointer">
                        {text.workoutCta}<Icon name="arrow_forward" size={14} />
                    </button>
                </div>

                {/* Food */}
                <div className="bg-secondary/40 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-phase">
                        <Icon name="restaurant" size={20} weight="duotone" />
                        <p className="text-foreground font-semibold text-sm">{copy.food.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {focus.nutrients.slice(0, 3).map((n) => (
                            <span key={n.en} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-phase-soft text-phase">{n[lang]}</span>
                        ))}
                    </div>
                    {/* Why these nutrients now: a general reason, not a diagnosis. */}
                    <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{focus.why[lang]}</p>
                    {picks.length > 0 ? (
                        <>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">{extra.meals}</p>
                            <PhaseRecipePicks compact matches={picks} onOpen={() => router.push('/nutrition?tab=recipes')} />
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm leading-relaxed">{copy.food.desc}</p>
                    )}
                    <button onClick={() => router.push('/nutrition?tab=recipes')} className="self-start text-sm font-semibold text-primary flex items-center gap-1 min-h-10 cursor-pointer mt-1">
                        {text.foodCta}<Icon name="arrow_forward" size={14} />
                    </button>
                </div>
            </div>

            {/* Habits */}
            {!habitsLoading && (
                <div className="bg-secondary/40 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-phase">
                        <Icon name="habits" size={20} weight="duotone" />
                        <p className="text-foreground font-semibold text-sm">{extra.habits}</p>
                    </div>
                    {habitIdeas.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{extra.allAdded}</p>
                    ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {habitIdeas.map((s) => (
                                <li key={s.id} className="flex items-start gap-3 rounded-xl bg-card border border-border p-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground text-sm font-semibold">{s.name[lang]}</p>
                                        <p className="text-muted-foreground text-xs leading-snug">{s.why[lang]}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addHabit(s.id)}
                                        disabled={adding === s.id}
                                        aria-label={`${extra.add}: ${s.name[lang]}`}
                                        className="shrink-0 flex items-center gap-1 text-sm font-semibold px-3 min-h-10 rounded-full bg-primary text-primary-foreground disabled:opacity-60 cursor-pointer"
                                    >
                                        <Icon name="add" size={14} />{extra.add}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <button onClick={() => router.push('/habits')} className="self-start text-sm font-semibold text-primary flex items-center gap-1 min-h-10 cursor-pointer">
                        {extra.seeHabits}<Icon name="arrow_forward" size={14} />
                    </button>
                </div>
            )}
            {notes.map((n) => <p key={n} className="text-xs text-muted-foreground">{n}</p>)}
        </div>
    );
};
