'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { fetchWorkoutVideos } from '@/services/exercisesService';
import type { WorkoutVideo } from '@/types/exercises';
import { MEAL_SLOTS, addDays, parseISODate, toISODate, weekDays, weekStartOf, type MealSlot } from '@/lib/planner/week';
import { buildGroceryList } from '@/lib/planner/grocery';
import {
    addPantryItem,
    applyGeneratedPlan,
    clearWeek,
    deleteEntry,
    listPantry,
    loadWeek,
    removePantryItem,
    requestPlan,
    saveMeal,
    saveWorkout,
    setDone,
    setGroceryChecked,
    type MealEntry,
    type PantryItem,
    type WorkoutEntry,
} from '@/services/plannerService';

const TEXT = {
    es: {
        title: 'Plan semanal',
        subtitle: 'Menús y entrenamiento de la semana, con seguimiento y lista del súper.',
        generate: 'Generar con IA',
        generateMeals: 'Solo comidas',
        generateWorkouts: 'Solo entrenos',
        generating: 'Generando…',
        clear: 'Vaciar semana',
        today: 'Hoy',
        slots: { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Snack', dinner: 'Cena' } as Record<MealSlot, string>,
        workout: 'Entreno',
        none: 'Sin plan',
        rest: 'Descanso',
        gym: 'Gym',
        mealTitle: 'Plato',
        mealIngredients: 'Ingredientes (separados por coma)',
        save: 'Guardar',
        cancel: 'Cancelar',
        grocery: 'Lista del súper',
        groceryEmpty: 'Agrega comidas con ingredientes para ver la lista.',
        pantry: 'Despensa',
        pantryHint: 'Lo que ya tienes. No aparece en la lista y la IA lo usa primero.',
        pantryAdd: 'Agregar',
        pantryPlaceholder: 'Ej. arroz',
        progress: 'Cumplido esta semana',
        error: 'Algo salió mal. Intenta de nuevo.',
        confirmClear: '¿Vaciar todas las comidas y entrenos de esta semana?',
    },
    en: {
        title: 'Weekly plan',
        subtitle: 'Meals and workouts for the week, with tracking and a grocery list.',
        generate: 'Generate with AI',
        generateMeals: 'Meals only',
        generateWorkouts: 'Workouts only',
        generating: 'Generating…',
        clear: 'Clear week',
        today: 'Today',
        slots: { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' } as Record<MealSlot, string>,
        workout: 'Workout',
        none: 'Not planned',
        rest: 'Rest',
        gym: 'Gym',
        mealTitle: 'Dish',
        mealIngredients: 'Ingredients (comma separated)',
        save: 'Save',
        cancel: 'Cancel',
        grocery: 'Grocery list',
        groceryEmpty: 'Add meals with ingredients to see the list.',
        pantry: 'Pantry',
        pantryHint: 'What you already have. It is left off the list and the AI uses it first.',
        pantryAdd: 'Add',
        pantryPlaceholder: 'e.g. rice',
        progress: 'Done this week',
        error: 'Something went wrong. Try again.',
        confirmClear: 'Clear all meals and workouts of this week?',
    },
};

const inputClass =
    'w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

const WeeklyPlanner: React.FC = () => {
    const { language } = useLanguage();
    const tx = TEXT[language === 'es' ? 'es' : 'en'];
    const { cycleInfo } = useCycleInfo();
    const phase = cycleInfo?.phase ?? 'Follicular';

    const [weekStart, setWeekStart] = useState(() => weekStartOf());
    const [meals, setMeals] = useState<MealEntry[]>([]);
    const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [pantry, setPantry] = useState<PantryItem[]>([]);
    const [videos, setVideos] = useState<WorkoutVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<{ date: string; slot: MealSlot } | null>(null);
    const [draft, setDraft] = useState({ title: '', ingredients: '' });
    const [pantryInput, setPantryInput] = useState('');

    const days = useMemo(() => weekDays(weekStart), [weekStart]);
    const todayISO = toISODate(new Date());

    const fail = (err: unknown) => {
        console.error('Planner error:', err);
        setError(err instanceof Error && err.message ? err.message : tx.error);
    };

    const refresh = useCallback(async () => {
        try {
            const week = await loadWeek(weekStart);
            setMeals(week.meals);
            setWorkouts(week.workouts);
            setChecked(new Set(week.checked));
            setError(null);
        } catch (err) {
            fail(err);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekStart]);

    useEffect(() => {
        setLoading(true);
        refresh();
    }, [refresh]);

    useEffect(() => {
        listPantry().then(setPantry).catch(fail);
        fetchWorkoutVideos().then(setVideos).catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mealAt = (date: string, slot: MealSlot) => meals.find((m) => m.date === date && m.slot === slot);
    const workoutAt = (date: string) => workouts.find((w) => w.date === date);

    const grocery = useMemo(
        () => buildGroceryList(meals.map((m) => m.ingredients), pantry.map((p) => p.name)),
        [meals, pantry],
    );

    const planned = meals.length + workouts.filter((w) => w.kind !== 'rest').length;
    const completed = meals.filter((m) => m.done).length + workouts.filter((w) => w.kind !== 'rest' && w.done).length;

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try {
            await fn();
            await refresh();
        } catch (err) {
            fail(err);
        } finally {
            setBusy(false);
        }
    };

    const generate = (includeMeals: boolean, includeWorkouts: boolean) =>
        run(async () => {
            const plan = await requestPlan({
                language: language === 'es' ? 'es' : 'en',
                phase,
                pantry: pantry.map((p) => p.name),
                includeMeals,
                includeWorkouts,
            });
            await applyGeneratedPlan(weekStart, plan, { video: new Map(videos.map((v) => [v.id, v.title])) });
        });

    const startEdit = (date: string, slot: MealSlot) => {
        const current = mealAt(date, slot);
        setDraft({ title: current?.title ?? '', ingredients: current?.ingredients.join(', ') ?? '' });
        setEditing({ date, slot });
    };

    const submitMeal = () => {
        if (!editing || !draft.title.trim()) return;
        const ingredients = draft.ingredients.split(',').map((s) => s.trim()).filter(Boolean);
        const target = editing;
        setEditing(null);
        run(async () => {
            await saveMeal({ date: target.date, slot: target.slot, title: draft.title.trim(), ingredients });
        });
    };

    const toggle = (kind: 'meal' | 'workout', entry: MealEntry | WorkoutEntry) => {
        const next = !entry.done;
        if (kind === 'meal') setMeals((prev) => prev.map((m) => (m.id === entry.id ? { ...m, done: next } : m)));
        else setWorkouts((prev) => prev.map((w) => (w.id === entry.id ? { ...w, done: next } : w)));
        setDone(kind, entry.id, next).catch((err) => {
            fail(err);
            refresh();
        });
    };

    const remove = (kind: 'meal' | 'workout', id: string) => run(() => deleteEntry(kind, id));

    const changeWorkout = (date: string, value: string) => {
        const existing = workoutAt(date);
        if (!value) {
            if (existing) remove('workout', existing.id);
            return;
        }
        run(async () => {
            if (value === 'rest') await saveWorkout({ date, kind: 'rest', videoId: null, title: tx.rest, durationMinutes: null });
            else if (value === 'gym') await saveWorkout({ date, kind: 'gym', videoId: null, title: tx.gym, durationMinutes: 45 });
            else {
                const v = videos.find((x) => x.id === value);
                if (v) await saveWorkout({ date, kind: 'video', videoId: v.id, title: v.title, durationMinutes: v.durationMinutes });
            }
        });
    };

    const toggleGrocery = (key: string) => {
        const next = !checked.has(key);
        setChecked((prev) => {
            const s = new Set(prev);
            if (next) s.add(key);
            else s.delete(key);
            return s;
        });
        setGroceryChecked(weekStart, key, next).catch(fail);
    };

    const addPantry = async () => {
        const name = pantryInput.trim();
        if (!name) return;
        setPantryInput('');
        try {
            const item = await addPantryItem(name);
            setPantry((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item].sort((a, b) => a.name.localeCompare(b.name))));
        } catch (err) {
            fail(err);
        }
    };

    const dayLabel = (iso: string) =>
        parseISODate(iso).toLocaleDateString(language === 'es' ? 'es' : 'en', { weekday: 'short', day: 'numeric', month: 'short' });
    const rangeLabel = `${dayLabel(days[0])} – ${dayLabel(days[6])}`;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{tx.title}</h1>
                <p className="text-muted-foreground text-sm">{tx.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" icon="chevron_left" label="←" onClick={() => setWeekStart(addDays(weekStart, -7))} />
                <span className="text-sm font-semibold min-w-[12rem] text-center">{rangeLabel}</span>
                <Button variant="ghost" size="sm" icon="chevron_right" label="→" onClick={() => setWeekStart(addDays(weekStart, 7))} />
                <Button variant="ghost" size="sm" onClick={() => setWeekStart(weekStartOf())}>{tx.today}</Button>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <Button size="sm" icon="auto_awesome" disabled={busy} onClick={() => generate(true, true)}>
                        {busy ? tx.generating : tx.generate}
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => generate(true, false)}>{tx.generateMeals}</Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => generate(false, true)}>{tx.generateWorkouts}</Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        icon="delete"
                        disabled={busy || planned === 0}
                        onClick={() => window.confirm(tx.confirmClear) && run(() => clearWeek(weekStart))}
                    >
                        {tx.clear}
                    </Button>
                </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

            {planned > 0 && (
                <p className="text-sm text-muted-foreground">
                    {tx.progress}: <span className="font-semibold text-foreground">{completed}/{planned}</span>
                </p>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {days.map((date) => {
                    const w = workoutAt(date);
                    return (
                        <Card key={date} hoverable={false} className={`p-4 ${date === todayISO ? 'ring-2 ring-primary/50' : ''}`}>
                            <p className="text-sm font-bold capitalize mb-3">{dayLabel(date)}</p>

                            <div className="mb-3 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Icon name="fitness_center" size={16} className="text-primary" />
                                    {w && w.kind !== 'rest' && (
                                        <input type="checkbox" checked={w.done} onChange={() => toggle('workout', w)} aria-label={tx.workout} />
                                    )}
                                    <select
                                        className={inputClass}
                                        aria-label={tx.workout}
                                        value={w ? (w.kind === 'video' ? w.videoId ?? '' : w.kind) : ''}
                                        onChange={(e) => changeWorkout(date, e.target.value)}
                                        disabled={busy}
                                    >
                                        <option value="">{tx.none}</option>
                                        <option value="rest">{tx.rest}</option>
                                        <option value="gym">{tx.gym}</option>
                                        {videos.map((v) => (
                                            <option key={v.id} value={v.id}>{v.title} ({v.durationMinutes}′)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <ul className="flex flex-col gap-2">
                                {MEAL_SLOTS.map((slot) => {
                                    const m = mealAt(date, slot);
                                    const isEditing = editing?.date === date && editing.slot === slot;
                                    return (
                                        <li key={slot} className="text-sm">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{tx.slots[slot]}</p>
                                            {isEditing ? (
                                                <div className="flex flex-col gap-1">
                                                    <input className={inputClass} autoFocus placeholder={tx.mealTitle} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                                                    <input className={inputClass} placeholder={tx.mealIngredients} value={draft.ingredients} onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={submitMeal}>{tx.save}</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>{tx.cancel}</Button>
                                                    </div>
                                                </div>
                                            ) : m ? (
                                                <div className="flex items-start gap-2">
                                                    <input className="mt-1" type="checkbox" checked={m.done} onChange={() => toggle('meal', m)} aria-label={m.title} />
                                                    <button type="button" className={`flex-1 text-left ${m.done ? 'line-through text-muted-foreground' : ''}`} onClick={() => startEdit(date, slot)}>
                                                        {m.title}
                                                    </button>
                                                    <button type="button" aria-label="delete" className="text-muted-foreground hover:text-red-500" onClick={() => remove('meal', m.id)}>
                                                        <Icon name="close" size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button" className="text-muted-foreground hover:text-primary" onClick={() => startEdit(date, slot)}>
                                                    + {tx.mealTitle}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card hoverable={false} className="p-4">
                    <h2 className="font-bold mb-3 flex items-center gap-2"><Icon name="task_alt" size={18} className="text-primary" />{tx.grocery}</h2>
                    {loading ? null : grocery.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tx.groceryEmpty}</p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {grocery.map((item) => (
                                <li key={item.key}>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={checked.has(item.key)} onChange={() => toggleGrocery(item.key)} />
                                        <span className={checked.has(item.key) ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
                                        {item.count > 1 && <span className="text-xs text-muted-foreground">×{item.count}</span>}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card hoverable={false} className="p-4">
                    <h2 className="font-bold mb-1 flex items-center gap-2"><Icon name="restaurant" size={18} className="text-primary" />{tx.pantry}</h2>
                    <p className="text-xs text-muted-foreground mb-3">{tx.pantryHint}</p>
                    <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); addPantry(); }}>
                        <input className={inputClass} placeholder={tx.pantryPlaceholder} value={pantryInput} onChange={(e) => setPantryInput(e.target.value)} />
                        <Button size="sm" type="submit">{tx.pantryAdd}</Button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        {pantry.map((p) => (
                            <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                                {p.name}
                                <button type="button" aria-label={`remove ${p.name}`} onClick={() => removePantryItem(p.id).then(() => setPantry((prev) => prev.filter((x) => x.id !== p.id))).catch(fail)}>
                                    <Icon name="close" size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default WeeklyPlanner;
