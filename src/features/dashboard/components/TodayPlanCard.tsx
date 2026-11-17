'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { MEAL_SLOTS, toISODate } from '@/lib/planner/week';
import { useGuest } from '@/hooks/useGuest';
import { loadDay, setDone, type MealEntry, type WorkoutEntry } from '@/services/plannerService';

const COPY = {
    es: {
        title: 'Tu plan de hoy',
        open: 'Ver planner',
        rest: 'Día de descanso',
        workout: 'Ejercicio',
        empty: 'Aún no hay nada planeado para hoy.',
        emptyCta: 'Planear mi día',
        guestEmpty: 'Con una cuenta organizas comidas y entrenos de la semana según tu fase.',
        slotHint: 'Sin plan',
        minutes: 'min',
        slots: { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Snack', dinner: 'Cena' },
    },
    en: {
        title: "Today's plan",
        open: 'Open planner',
        rest: 'Rest day',
        workout: 'Workout',
        empty: 'Nothing planned for today yet.',
        emptyCta: 'Plan my day',
        guestEmpty: "With an account you can plan the week's meals and workouts around your phase.",
        slotHint: 'Not planned',
        minutes: 'min',
        slots: { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' },
    },
};

interface ItemProps {
    icon: string;
    label: string;
    title: string;
    detail?: string;
    done: boolean;
    onToggle?: () => void;
}

const Item: React.FC<ItemProps> = ({ icon, label, title, detail, done, onToggle }) => (
    <div className="flex items-center gap-3 py-2.5">
        <div className="size-9 rounded-full bg-blossom-soft text-blossom flex items-center justify-center shrink-0">
            <Icon name={icon} size={18} weight="duotone" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium truncate ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{title}</p>
            {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
        {onToggle && (
            <button
                onClick={onToggle}
                aria-pressed={done}
                aria-label={title}
                className="shrink-0 size-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
            >
                <Icon
                    name="check_circle"
                    size={24}
                    weight={done ? 'fill' : 'regular'}
                    className={done ? 'text-leaf' : 'text-muted-foreground'}
                />
            </button>
        )}
    </div>
);

/** Today's planned workout and meals from the planner, checkable in place. Without a plan it shows empty slots that open the planner. */
/** `embedded`: drops the card chrome so it can sit inside TodayRhythm. */
export const TodayPlanCard: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const copy = COPY[language === 'es' ? 'es' : 'en'];
    const { isGuest, promptSignup } = useGuest();
    const [meals, setMeals] = useState<MealEntry[]>([]);
    const [workout, setWorkout] = useState<WorkoutEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDay(toISODate(new Date()))
            .then((day) => { setMeals(day.meals); setWorkout(day.workout); })
            .catch(() => { /* signed out or offline: no plan card */ })
            .finally(() => { setLoading(false); });
    }, []);

    const toggleWorkout = async () => {
        if (!workout) return;
        const done = !workout.done;
        setWorkout({ ...workout, done });
        try { await setDone('workout', workout.id, done); } catch { setWorkout(workout); }
    };

    const toggleMeal = async (meal: MealEntry) => {
        const done = !meal.done;
        setMeals((list) => list.map((m) => (m.id === meal.id ? { ...m, done } : m)));
        try { await setDone('meal', meal.id, done); } catch {
            setMeals((list) => list.map((m) => (m.id === meal.id ? meal : m)));
        }
    };

    if (loading) {
        return (
            <div className={embedded ? 'animate-pulse' : 'bg-card rounded-3xl border border-border/80 shadow-sm p-5 sm:p-6 animate-pulse'}>
                <div className="flex items-center justify-between mb-3">
                    <div className="h-5 w-32 bg-secondary/80 rounded" />
                    <div className="h-4 w-20 bg-secondary/60 rounded" />
                </div>
                <div className="divide-y divide-border/40">
                    <div className="flex items-center gap-3 py-3">
                        <div className="size-9 rounded-full bg-secondary/80 shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                            <div className="h-3 w-16 bg-secondary/60 rounded" />
                            <div className="h-4 w-40 bg-secondary/80 rounded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                        <div className="size-9 rounded-full bg-secondary/80 shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                            <div className="h-3 w-20 bg-secondary/60 rounded" />
                            <div className="h-4 w-48 bg-secondary/80 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No plan yet: show the day's empty slots so the space reads as "fill me in", not as missing.
    if (!workout && meals.length === 0) {
        const open = () => (isGuest ? promptSignup() : router.push('/planner'));
        const slots = [
            { key: 'workout', icon: 'fitness_center', label: copy.workout },
            ...MEAL_SLOTS.map((slot) => ({ key: slot, icon: 'restaurant', label: copy.slots[slot] })),
        ];
        return (
            <div className={embedded ? 'flex flex-col gap-3' : 'bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-3'}>
                <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-foreground font-semibold ${embedded ? 'text-base' : 'text-lg'}`}>{copy.title}</h3>
                    <button
                        onClick={open}
                        className="shrink-0 inline-flex items-center gap-1 px-3.5 min-h-10 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                        <Icon name="add" size={14} />{copy.emptyCta}
                    </button>
                </div>
                <p className="text-sm text-muted-foreground">{isGuest ? copy.guestEmpty : copy.empty}</p>
                <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {slots.map((s) => (
                        <li key={s.key}>
                            <button
                                type="button"
                                onClick={open}
                                className="w-full h-full rounded-2xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/40 transition-colors p-3 flex flex-col items-start gap-2 text-left cursor-pointer"
                            >
                                <span className="size-8 rounded-full bg-blossom-soft text-blossom flex items-center justify-center">
                                    <Icon name={s.icon} size={16} weight="duotone" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-foreground truncate">{s.label}</span>
                                    <span className="block text-xs text-muted-foreground truncate">{copy.slotHint}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    const ordered = [...meals].sort((a, b) => MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot));

    return (
        <div className={embedded ? '' : 'bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6'}>
            <div className="flex items-center justify-between mb-1">
                <h3 className={`text-foreground font-semibold ${embedded ? 'text-base' : 'text-lg'}`}>{copy.title}</h3>
                <button
                    onClick={() => router.push('/planner')}
                    className="text-blossom text-sm font-semibold flex items-center gap-1 min-h-10 px-2 -mr-2 hover:text-blossom/80 transition-colors"
                >
                    {copy.open}<Icon name="arrow_forward" size={14} />
                </button>
            </div>
            <div className="divide-y divide-border/60">
                {workout && (
                    <Item
                        icon="fitness_center"
                        label={workout.kind === 'rest' ? copy.rest : workout.kind === 'gym' ? 'Gym' : 'Video'}
                        title={workout.title}
                        detail={workout.durationMinutes ? `${workout.durationMinutes} ${copy.minutes}` : undefined}
                        done={workout.done}
                        onToggle={workout.kind === 'rest' ? undefined : toggleWorkout}
                    />
                )}
                {ordered.map((meal) => (
                    <Item
                        key={meal.id}
                        icon="restaurant"
                        label={copy.slots[meal.slot]}
                        title={meal.title}
                        done={meal.done}
                        onToggle={() => toggleMeal(meal)}
                    />
                ))}
            </div>
        </div>
    );
};
