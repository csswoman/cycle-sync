'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import type { OnboardingAnswers } from '@/features/setup/onboarding';
import { useRecipes } from '@/hooks/useRecipes';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { avoidedIn } from '@/lib/nutrition/foodPreferences';
import { toPhaseKey, rankRecipesForPhase, FOOD_FOCUS } from '@/lib/cycle/phaseSuggestions';
import { PhaseRecipePicks } from '@/features/health/components/PhaseRecipePicks';
import { PhaseVideoPicks } from './PhaseVideoPicks';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { dashboardText, phaseKey } from '../dashboardText';

interface Props { phase: string; answers: OnboardingAnswers }

const COPY = {
  es: { videos: 'Clases sugeridas', meals: 'Comidas sugeridas' },
  en: { videos: 'Suggested classes', meals: 'Suggested meals' },
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

    const foodPrefs = useFoodPreferences();
    const library = useRecipes(foodPrefs.prefs);

    const avoid = foodPrefs.prefs.avoid;
    const picks = useMemo(
        () => rankRecipesForPhase(library.recipes.filter((r) => avoidedIn(r, avoid).length === 0), key, lang, 3),
        [library.recipes, avoid, key, lang]
    );

    const notes: string[] = [];
    if (answers.activity === 'low') notes.push(text.lowActivityNote);
    if (answers.goal === 'pmos') notes.push(text.pmosNote);

    return (
        <div data-phase={key} className="relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <CardFlowers variant="phase" />
            <div>
                <h3 className="text-foreground text-lg font-semibold">{text.recommendTitle} · {copy.name}</h3>
                <p className="text-muted-foreground text-sm">{text.recommendSubtitle} {copy.hormones}.</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Movement */}
                <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-2 text-phase">
                        <Icon name="fitness_center" size={20} weight="duotone" />
                        <p className="text-foreground font-semibold text-sm">{copy.movement.title}</p>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{copy.movement.desc}</p>
                    <p className="text-sm font-semibold text-muted-foreground mt-1">{extra.videos}</p>
                    <PhaseVideoPicks phase={key} lang={lang} lowActivity={answers.activity === 'low'} />
                    <button onClick={() => router.push('/routines?tab=phase')} className="mt-auto self-start text-sm font-semibold text-primary flex items-center gap-1 min-h-10 cursor-pointer">
                        {text.workoutCta}<Icon name="arrow_forward" size={14} />
                    </button>
                </div>

                {/* Food */}
                <div className="flex flex-col gap-2 min-w-0 border-t border-border/60 pt-6 xl:border-t-0 xl:pt-0 xl:border-l xl:pl-6">
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
                            <p className="text-sm font-semibold text-muted-foreground mt-1">{extra.meals}</p>
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

            {notes.map((n) => <p key={n} className="text-sm text-muted-foreground text-pretty">{n}</p>)}
        </div>
    );
};
