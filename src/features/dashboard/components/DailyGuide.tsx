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

type Lang = 'es' | 'en';

const COPY = {
    es: {
        title: 'Tu versión de hoy',
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
        title: 'Your version of today',
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

const Block: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="flex gap-3">
        <div className="size-9 rounded-full bg-blossom-soft text-blossom flex items-center justify-center shrink-0">
            <Icon name={icon} size={18} weight="duotone" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="text-sm text-foreground leading-relaxed text-pretty">{children}</div>
        </div>
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

    return (
        <section aria-labelledby="daily-guide-title" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h3 id="daily-guide-title" className="text-foreground text-base font-semibold">{copy.title}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${MODE_STYLE[plan.mode]}`}>{copy.modes[plan.mode]}</span>
            </div>

            <p className="text-sm font-medium text-foreground bg-secondary/40 rounded-2xl px-4 py-3 flex gap-2">
                <Icon name="lightbulb" size={18} weight="duotone" className="text-blossom shrink-0 mt-0.5" />
                <span className="text-pretty">{plan.focus[lang]}</span>
            </p>

            <div className="flex flex-col gap-4">
                <Block icon="fitness_center" label={copy.move}>
                    <p>{plan.move[lang]}</p>
                    <p className="text-muted-foreground">{plan.why[lang]}</p>
                    {plan.minutes != null && (
                        <button
                            type="button"
                            onClick={markDone}
                            disabled={busy || movedToday}
                            className={`mt-2 inline-flex items-center gap-1.5 px-3.5 min-h-10 rounded-full text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default ${movedToday ? 'bg-leaf-soft text-leaf' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                        >
                            <Icon name={movedToday ? 'check_circle' : 'check'} size={16} weight={movedToday ? 'fill' : 'bold'} />
                            {movedToday ? copy.didDone : copy.did(plan.minutes)}
                        </button>
                    )}
                </Block>
                <Block icon="restaurant" label={copy.meal}>
                    <p>{plan.meal[lang]}</p>
                </Block>
                {plan.craving && (
                    <Block icon="local_fire_department" label={copy.craving}>
                        <p>{plan.craving[lang]}</p>
                    </Block>
                )}
            </div>

            {!isGuest && (
                <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2" aria-hidden>
                        {Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(); d.setDate(d.getDate() - (6 - i));
                            const on = state.moveDates.includes(toISODate(d)) || (i === 6 && movedToday);
                            return <span key={i} className={`h-2 flex-1 rounded-full ${on ? 'bg-leaf' : 'bg-secondary'}`} />;
                        })}
                    </div>
                    <p className="text-sm text-foreground font-medium">{copy.streak(streak.days + (movedToday && !streak.movedToday ? 1 : 0))}</p>
                    <p className="text-sm text-muted-foreground text-pretty">
                        {!movedToday && streak.twoZeroDays ? copy.zero : copy.streakGoal}
                    </p>
                </div>
            )}
        </section>
    );
};
