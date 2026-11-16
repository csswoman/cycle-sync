'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { MEAL_SLOTS, toISODate } from '@/lib/planner/week';
import { loadDay, setDone, type MealEntry, type WorkoutEntry } from '@/services/plannerService';

const COPY = {
    es: {
        title: 'Tu plan de hoy',
        open: 'Ver planner',
        rest: 'Día de descanso',
        minutes: 'min',
        slots: { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Snack', dinner: 'Cena' },
    },
    en: {
        title: "Today's plan",
        open: 'Open planner',
        rest: 'Rest day',
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
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium truncate ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{title}</p>
            {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
        {onToggle && (
            <button
                onClick={onToggle}
                aria-pressed={done}
                aria-label={title}
                className="shrink-0 size-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
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

/** Today's planned workout and meals from the planner, checkable in place. Renders nothing without a plan. */
export const TodayPlanCard: React.FC = () => {
    const router = useRouter();
    const { language } = useLanguage();
    const copy = COPY[language === 'es' ? 'es' : 'en'];
    const [meals, setMeals] = useState<MealEntry[]>([]);
    const [workout, setWorkout] = useState<WorkoutEntry | null>(null);

    useEffect(() => {
        loadDay(toISODate(new Date()))
            .then((day) => { setMeals(day.meals); setWorkout(day.workout); })
            .catch(() => { /* signed out or offline: no plan card */ });
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

    if (!workout && meals.length === 0) return null;

    const ordered = [...meals].sort((a, b) => MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot));

    return (
        <div className="bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-foreground text-lg font-semibold">{copy.title}</h3>
                <button
                    onClick={() => router.push('/planner')}
                    className="text-blossom text-xs font-semibold flex items-center gap-1 hover:text-blossom/80 transition-colors"
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
