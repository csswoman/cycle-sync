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
import { useRouter } from 'next/navigation';
import { toPhaseKey, FOOD_FOCUS } from '@/lib/cycle/phaseSuggestions';
import { dashboardText, phaseKey } from '../dashboardText';

type Lang = 'es' | 'en';

const COPY = {
    es: {
        title: 'Tu día',
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
    <div className={`flex flex-col gap-1.5 rounded-xl bg-secondary/30 p-3 min-w-0 ${wide ? 'col-span-2' : ''}`}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
    const router = useRouter();

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

    const phase = info?.phase ? phaseKey(info.phase) : null;
    const text = dashboardText[lang];
    const focus = info?.phase ? FOOD_FOCUS[toPhaseKey(info.phase)] : null;
    const clamp = 'text-sm text-foreground leading-snug line-clamp-3 text-pretty';
    const daysMoved = streak.days + (movedToday && !streak.movedToday ? 1 : 0);
    return (
        <section aria-labelledby="daily-guide-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                    <h3 id="daily-guide-title" className="text-foreground text-base font-semibold">{copy.title}</h3>
                    <InfoTooltip label={copy.helpLabel}><p>{copy.help}</p></InfoTooltip>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${MODE_STYLE[plan.mode]}`}>{copy.modes[plan.mode]}</span>
            </div>
            <p className="text-sm font-medium text-foreground bg-blossom-soft/50 rounded-xl px-3 py-2 flex gap-2">
                <Icon name="lightbulb" size={17} weight="duotone" className="text-blossom shrink-0 mt-0.5" />
                <span className="text-pretty line-clamp-2">{plan.focus[lang]}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
                <Tile icon="fitness_center" label={copy.move} tip={`${plan.move[lang]} ${plan.why[lang]}`} wide>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-foreground leading-snug line-clamp-2 text-pretty">{plan.move[lang]}</p>
                        {plan.minutes != null && (
                            <button
                                type="button"
                                onClick={markDone}
                                disabled={busy || movedToday}
                                className={`shrink-0 inline-flex items-center gap-1.5 px-3 min-h-9 rounded-full text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default ${movedToday ? 'bg-leaf-soft text-leaf' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                            >
                                <Icon name={movedToday ? 'check_circle' : 'check'} size={16} weight={movedToday ? 'fill' : 'bold'} />
                                {movedToday ? copy.didDone : `${plan.minutes} min`}
                            </button>
                        )}
                    </div>
                </Tile>
                <Tile icon="restaurant" label={copy.meal} tip={plan.meal[lang]} wide={!plan.craving}>
                    <p className={clamp}>{plan.meal[lang]}</p>
                </Tile>
                {plan.craving && (
                    <Tile icon="local_fire_department" label={copy.craving} tip={plan.craving[lang]}>
                        <p className={clamp}>{plan.craving[lang]}</p>
                    </Tile>
                )}
                {phase && focus && (
                    <Tile icon="spa" label={`${copy.phase} · ${text.phases[phase].name}`} tip={focus.why[lang]} wide>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {focus.nutrients.slice(0, 3).map((n) => (
                                <span key={n.en} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-phase-soft text-phase">{n[lang]}</span>
                            ))}
                            <button type="button" onClick={() => router.push('/routines?tab=phase')} className="ml-auto text-sm font-semibold text-primary inline-flex items-center gap-1 min-h-8 cursor-pointer">
                                {copy.classes}<Icon name="arrow_forward" size={13} />
                            </button>
                            <button type="button" onClick={() => router.push('/nutrition?tab=recipes')} className="text-sm font-semibold text-primary inline-flex items-center gap-1 min-h-8 cursor-pointer">
                                {copy.recipes}<Icon name="arrow_forward" size={13} />
                            </button>
                        </div>
                    </Tile>
                )}
                {!isGuest && (
                    <div className="col-span-2 rounded-xl bg-secondary/30 px-3 py-2.5 flex items-center gap-3">
                        <div className="flex flex-1 items-center gap-1" aria-hidden>
                            {Array.from({ length: 7 }, (_, i) => {
                                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                                const on = state.moveDates.includes(toISODate(d)) || (i === 6 && movedToday);
                                return <span key={i} className={`h-2 flex-1 rounded-full ${on ? 'bg-leaf' : 'bg-secondary'}`} />;
                            })}
                        </div>
                        <p className="flex items-center gap-1 text-sm text-foreground font-semibold shrink-0">
                            {daysMoved}/7
                            <InfoTooltip label={copy.streak(daysMoved)}>
                                <p>{copy.streak(daysMoved)}. {!movedToday && streak.twoZeroDays ? copy.zero : copy.streakGoal}</p>
                            </InfoTooltip>
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};
