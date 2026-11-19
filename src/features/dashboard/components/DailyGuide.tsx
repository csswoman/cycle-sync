'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useGuest } from '@/hooks/useGuest';
import { loadDay, setDone, type WorkoutEntry } from '@/services/plannerService';
import { toISODate } from '@/lib/planner/week';
import { buildDailyPlan, flexibleStreak, type MoveMode } from '@/lib/today/dailyPlan';
import { TODAY_CHANGED_EVENT, type TodayCheckinState } from '@/hooks/useTodayCheckin';
import { usesHormonalContraception } from '@/features/setup/onboarding';
import type { CycleOverview } from '@/hooks/useCycleOverview';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toPhaseKey, FOOD_FOCUS } from '@/lib/cycle/phaseSuggestions';
import { dashboardText, phaseKey } from '../dashboardText';

type Lang = 'es' | 'en';

const COPY = {
    es: {
        title: 'Tu día',
        mode: 'Modo de hoy',
        phase: 'Para tu fase',
        classes: 'Clases',
        recipes: 'Recetas',
        help: 'Se adapta a tu check-in y a tu fase: el modo (Completo, Ligero, Mínimo o Descanso) cambia según tu energía. Son sugerencias generales, no un diagnóstico.',
        helpLabel: 'Cómo funciona esta guía',
        whyLabel: 'Por qué',
        modes: { full: 'Completo', light: 'Ligero', minimum: 'Mínimo', rest: 'Descanso' } as Record<MoveMode, string>,
        move: 'Movimiento',
        meal: 'Comida ancla',
        craving: 'Para tu antojo',
        did: (m: number) => `Lo hice (${m} min)`,
        didDone: 'Hecho hoy',
        streak: (n: number) => `Te moviste ${n} de los últimos 7 días`,
        streakGoal: 'La meta es constancia, no perfección: 3 a 5 días a la semana ya suman.',
        zero: 'Llevas dos días sin moverte: hoy basta con la versión mínima para cortar la racha en cero.',
        logLabel: { full: 'Entreno completo', light: 'Entreno ligero', minimum: 'Movimiento mínimo', rest: 'Movimiento suave' } as Record<MoveMode, string>,
    },
    en: {
        title: 'Your day',
        mode: 'Mode today',
        phase: 'For your phase',
        classes: 'Classes',
        recipes: 'Recipes',
        help: 'It adapts to your check-in and phase: the mode (Full, Light, Minimum or Rest) changes with your energy. These are general suggestions, not a diagnosis.',
        helpLabel: 'How this guide works',
        whyLabel: 'Why',
        modes: { full: 'Full', light: 'Light', minimum: 'Minimum', rest: 'Rest' } as Record<MoveMode, string>,
        move: 'Movement',
        meal: 'Anchor meal',
        craving: 'For your craving',
        did: (m: number) => `I did it (${m} min)`,
        didDone: 'Done today',
        streak: (n: number) => `You moved on ${n} of the last 7 days`,
        streakGoal: 'The goal is consistency, not perfection: 3 to 5 days a week already adds up.',
        zero: 'Two days without moving: the minimum version today is enough to break the gap.',
        logLabel: { full: 'Full workout', light: 'Light workout', minimum: 'Minimum movement', rest: 'Gentle movement' } as Record<MoveMode, string>,
    },
};

const MODE_STYLE: Record<MoveMode, string> = {
    full: 'bg-leaf-soft text-leaf',
    light: 'bg-blossom-soft text-blossom',
    minimum: 'bg-secondary text-foreground',
    rest: 'bg-secondary text-muted-foreground',
};

const Tile: React.FC<{ icon: string; label: string; tip?: string; wide?: boolean; children: React.ReactNode }> = ({ icon, label, tip, wide, children }) => (
    <div className={`flex flex-col gap-1.5 rounded-xl bg-secondary/30 p-3 min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="grid place-items-center size-6 rounded-lg bg-blossom-soft text-blossom shrink-0"><Icon name={icon} size={14} weight="duotone" /></span>
            {label}
            {tip && <InfoTooltip label={label}><p>{tip}</p></InfoTooltip>}
        </p>
        {children}
    </div>
);
/**
 * Turns the check-in, the cycle phase and the planner's workout into one plan for today:
 * a movement version that fits her energy (with a minimum that still counts), an anchor
 * meal, a craving tip and a flexible weekly streak.
 */
export const DailyGuide: React.FC<{ state: TodayCheckinState; overview: CycleOverview; lang: Lang }> = ({ state, overview, lang }) => {
    const copy = COPY[lang];
    const { isGuest, promptSignup } = useGuest();
    const [planned, setPlanned] = useState<WorkoutEntry | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const load = () => {
            loadDay(toISODate(new Date()))
                .then((day) => setPlanned(day.workout))
                .catch(() => { /* signed out or offline: plan without a planned workout */ });
        };
        load();
        window.addEventListener(TODAY_CHANGED_EVENT, load);
        return () => window.removeEventListener(TODAY_CHANGED_EVENT, load);
    }, []);

    const info = overview.info;
    const plan = useMemo(() => buildDailyPlan({
        phase: info?.phase ?? null,
        confidence: info?.confidence,
        irregular: info?.irregular,
        overdue: info?.overdue,
        hormonal: usesHormonalContraception(overview.answers),
        checkin: state.checkin,
        planned,
    }), [info, overview.answers, state.checkin, planned]);

    const today = toISODate(new Date());
    const streak = flexibleStreak(state.moveDates, today);
    const movedToday = streak.movedToday || !!planned?.done;

    const markDone = async () => {
        if (isGuest || !state.userId) { promptSignup(); return; }
        if (!plan.minutes || busy) return;
        setBusy(true);
        try {
            // A planned workout done in any version counts as done in the planner too.
            if (planned && planned.kind !== 'rest' && !planned.done) {
                await setDone('workout', planned.id, true);
                setPlanned({ ...planned, done: true });
            }
            await state.logMovement(copy.logLabel[plan.mode], plan.minutes, info?.phase ?? null);
        } catch (err) {
            console.error('Log movement error:', err);
        } finally {
            setBusy(false);
        }
    };

    const clamp = 'text-sm text-muted-foreground leading-snug text-pretty line-clamp-4 sm:line-clamp-2';
    const daysMoved = streak.days + (movedToday && !streak.movedToday ? 1 : 0);
    return (
        <section aria-label={copy.title} className="flex flex-col gap-2">
            <div className="flex items-start sm:items-center gap-2 px-1 pt-1">
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-sm font-semibold ${MODE_STYLE[plan.mode]}`}>{copy.modes[plan.mode]}</span>
                <p className="min-w-0 text-sm font-semibold text-foreground text-pretty">{plan.focus[lang]}</p>
                <InfoTooltip label={copy.helpLabel}><p>{copy.help}</p></InfoTooltip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                <Tile icon="fitness_center" label={copy.move} tip={`${plan.move[lang]} ${plan.why[lang]}`}>
                    <div className="flex flex-1 flex-col justify-between gap-3">
                        <p className="text-sm text-muted-foreground leading-snug text-pretty line-clamp-4 sm:line-clamp-2">{plan.move[lang]}</p>
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        {plan.minutes != null && (
                            <button
                                type="button"
                                onClick={markDone}
                                disabled={busy || movedToday}
                                className={`self-start shrink-0 inline-flex items-center gap-1.5 px-3.5 min-h-11 sm:min-h-9 sm:px-3 rounded-full text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default ${movedToday ? 'bg-leaf-soft text-leaf' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                            >
                                <Icon name={movedToday ? 'check_circle' : 'check'} size={16} weight={movedToday ? 'fill' : 'bold'} />
                                {movedToday ? copy.didDone : copy.did(plan.minutes)}
                            </button>
                        )}
                        {!isGuest && (
                            <div className="flex items-center gap-2 ml-auto">
                                <div className="flex items-center gap-1" aria-hidden>
                                    {Array.from({ length: 7 }, (_, i) => {
                                        const d = new Date(); d.setDate(d.getDate() - (6 - i));
                                        const on = state.moveDates.includes(toISODate(d)) || (i === 6 && movedToday);
                                        return <span key={i} className={`h-2 w-3.5 rounded-full ${on ? 'bg-leaf' : 'bg-secondary'}`} />;
                                    })}
                                </div>
                                <p className="flex items-center gap-1 text-sm text-foreground font-semibold">
                                    {daysMoved}/7
                                    <InfoTooltip label={copy.streak(daysMoved)}>
                                        <p>{copy.streak(daysMoved)}. {!movedToday && streak.twoZeroDays ? copy.zero : copy.streakGoal}</p>
                                    </InfoTooltip>
                                </p>
                            </div>
                        )}
                        </div>
                    </div>
                </Tile>
                <Tile icon="restaurant" label={copy.meal} tip={plan.meal[lang]}>
                    <p className={clamp}>{plan.meal[lang]}</p>
                </Tile>
                {plan.craving && (
                    <Tile icon="local_fire_department" label={copy.craving} tip={plan.craving[lang]}>
                        <p className={clamp}>{plan.craving[lang]}</p>
                    </Tile>
                )}
            </div>
        </section>
    );
};

/** Subtitle of the Plan tab: the phase name, its key nutrients as badges and shortcuts to classes and recipes. */
export const PhaseSubtitle: React.FC<{ overview: CycleOverview; lang: Lang; fallback: string }> = ({ overview, lang, fallback }) => {
    const copy = COPY[lang];
    const info = overview.info;
    const focus = info?.phase ? FOOD_FOCUS[toPhaseKey(info.phase)] : null;
    if (!info?.phase || !focus) return <p className="text-muted-foreground text-sm text-pretty">{fallback}</p>;
    return (
        <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {`${copy.phase} · ${dashboardText[lang].phases[phaseKey(info.phase)].name}`}
                <InfoTooltip label={copy.phase}><p>{focus.why[lang]}</p></InfoTooltip>
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ul className="flex flex-wrap gap-1.5">
                    {focus.nutrients.slice(0, 3).map((n) => (
                        <li key={n.en} className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-phase-soft text-phase">{n[lang]}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
