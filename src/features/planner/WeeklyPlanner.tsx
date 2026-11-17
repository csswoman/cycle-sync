'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TitleSprig, WeekSprouts } from '@/components/ui/Botanical';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCycleInfo } from '@/hooks/useCycleInfo';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { entriesToNames } from '@/lib/nutrition/foodPreferences';
import { fetchWorkoutVideos } from '@/services/exercisesService';
import type { WorkoutVideo } from '@/types/exercises';
import { MEAL_SLOTS, addDays, parseISODate, toISODate, weekDays, weekStartOf, type MealSlot } from '@/lib/planner/week';
import { buildGroceryList } from '@/lib/planner/grocery';
import { buildMealColumns, canAddGlucoseFromMeal } from '@/lib/pmos/mealGlucoseEntry';
import { insertMetric, mealColumnsAvailable } from '@/services/mealGlucoseService';
import { parseNum } from '@/features/health/pmos/shared';
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
    planMealsFromLibrary,
    type MealEntry,
    type PantryItem,
    type WorkoutEntry,
} from '@/services/plannerService';

const TEXT = {
    es: {
        title: 'Plan semanal',
        addGlucose: 'Añadir glucosa',
        glucoseValue: 'Glucosa (mg/dL)',
        oneHour: '1 h después',
        twoHours: '2 h después',
        glucoseSaveError: 'No se pudo guardar la glucosa.',
        glucoseInvalid: 'Escribe un valor de glucosa válido.',
        subtitle: 'Menús y entrenamientos sincronizados con la fisiología de tu ciclo menstrual.',
        phaseContext: 'Fase actual',
        fromRecipes: 'Planear con mis recetas',
        fromRecipesBusy: 'Armando plan…',
        fromRecipesNone: 'Ya hay comidas en todos los espacios de esta semana.',
        gapNotice: (n: number) => `${n} ${n === 1 ? 'espacio quedó' : 'espacios quedaron'} sin receta que encaje. La IA puede completarlos.`,
        completeWithAi: 'Completar con IA',
        aiLabel: 'Con IA:',
        savedRecipes: (n: number) => `${n} ${n === 1 ? 'receta nueva guardada' : 'recetas nuevas guardadas'} en tu biblioteca.`,
        generate: 'Todo con IA',
        generateMeals: 'Comidas con IA',
        generateWorkouts: 'Entrenos con IA',
        generating: 'Generando plan…',
        clear: 'Vaciar semana',
        today: 'Hoy',
        slots: { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Snack', dinner: 'Cena' } as Record<MealSlot, string>,
        slotIcons: { breakfast: 'meal_ideas', lunch: 'restaurant', snack: 'plant', dinner: 'nutrition' } as Record<MealSlot, string>,
        workout: 'Entrenamiento',
        none: 'Sin entreno',
        rest: 'Día de descanso',
        gym: 'Gimnasio / Fuerza',
        mealTitle: 'Nombre del plato',
        mealIngredients: 'Ingredientes (separados por coma)',
        save: 'Guardar',
        cancel: 'Cancelar',
        addMealPrompt: 'Agregar plato',
        grocery: 'Lista del súper',
        groceryEmpty: 'Agrega comidas con ingredientes a tu semana para consolidar tu lista de compras automáticamente.',
        groceryCompleted: 'comprados',
        pantry: 'Mi despensa',
        pantryHint: 'Ingredientes que ya tienes en casa. La IA los prioriza y se omiten de tu lista del súper.',
        pantryAdd: 'Agregar',
        pantryPlaceholder: 'Ej. avena, arroz integral, chía...',
        pantryQuickSuggestions: 'Sugerencias frecuentes:',
        progress: 'Cumplimiento semanal',
        completedText: 'completado',
        error: 'Algo salió mal. Intenta de nuevo.',
        confirmClear: '¿Vaciar todas las comidas y entrenos de esta semana?',
    },
    en: {
        title: 'Weekly plan',
        addGlucose: 'Add glucose',
        glucoseValue: 'Glucose (mg/dL)',
        oneHour: '1 h after',
        twoHours: '2 h after',
        glucoseSaveError: 'Could not save the glucose reading.',
        glucoseInvalid: 'Enter a valid glucose value.',
        subtitle: 'Meals and workouts synchronized with your menstrual cycle physiology.',
        phaseContext: 'Current phase',
        fromRecipes: 'Plan with my recipes',
        fromRecipesBusy: 'Building plan…',
        fromRecipesNone: 'Every meal slot this week already has a meal.',
        gapNotice: (n: number) => `${n} ${n === 1 ? 'slot has' : 'slots have'} no matching recipe. The AI can fill them.`,
        completeWithAi: 'Complete with AI',
        aiLabel: 'With AI:',
        savedRecipes: (n: number) => `${n} new ${n === 1 ? 'recipe' : 'recipes'} saved to your library.`,
        generate: 'Everything with AI',
        generateMeals: 'Meals with AI',
        generateWorkouts: 'Workouts with AI',
        generating: 'Generating plan…',
        clear: 'Clear week',
        today: 'Today',
        slots: { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' } as Record<MealSlot, string>,
        slotIcons: { breakfast: 'meal_ideas', lunch: 'restaurant', snack: 'plant', dinner: 'nutrition' } as Record<MealSlot, string>,
        workout: 'Workout',
        none: 'No workout',
        rest: 'Rest day',
        gym: 'Gym / Strength',
        mealTitle: 'Dish name',
        mealIngredients: 'Ingredients (comma separated)',
        save: 'Save',
        cancel: 'Cancel',
        addMealPrompt: 'Add dish',
        grocery: 'Grocery list',
        groceryEmpty: 'Add meals with ingredients to your week to consolidate your grocery list automatically.',
        groceryCompleted: 'purchased',
        pantry: 'My pantry',
        pantryHint: 'Ingredients already in your kitchen. AI prioritizes them and leaves them off your shopping list.',
        pantryAdd: 'Add',
        pantryPlaceholder: 'e.g. oats, brown rice, chia seeds...',
        pantryQuickSuggestions: 'Common suggestions:',
        progress: 'Weekly progress',
        completedText: 'completed',
        error: 'Something went wrong. Try again.',
        confirmClear: 'Clear all meals and workouts of this week?',
    },
};

const PHASE_NAMES: Record<string, { es: string; en: string }> = {
    Menstrual: { es: 'Fase Menstrual', en: 'Menstrual Phase' },
    Follicular: { es: 'Fase Folicular', en: 'Follicular Phase' },
    Ovulation: { es: 'Fase Ovulatoria', en: 'Ovulatory Phase' },
    Luteal: { es: 'Fase Lútea', en: 'Luteal Phase' },
};

const QUICK_PANTRY_SUGGESTIONS = ['Avena', 'Huevos', 'Arroz integral', 'Espinacas', 'Semillas de chía', 'Aceite de oliva'];

const inputClass =
    'w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors placeholder:text-muted-foreground/60';

const WeeklyPlanner: React.FC = () => {
    const { language } = useLanguage();
    const isEs = language === 'es';
    const tx = TEXT[isEs ? 'es' : 'en'];
    const { cycleInfo } = useCycleInfo();
    const phase = cycleInfo?.phase ?? 'Follicular';
    const phaseLabel = PHASE_NAMES[phase] ? PHASE_NAMES[phase][isEs ? 'es' : 'en'] : phase;

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
    const [notice, setNotice] = useState<string | null>(null);
    const [gaps, setGaps] = useState<{ day: number; slot: MealSlot }[]>([]);
    const foodPrefs = useFoodPreferences();
    const [mealCols, setMealCols] = useState(false);
    const [glucoseFor, setGlucoseFor] = useState<string | null>(null);
    const [glucoseDraft, setGlucoseDraft] = useState<{ value: string; interval: 1 | 2 | null }>({ value: '', interval: null });
    const [glucoseError, setGlucoseError] = useState<string | null>(null);

    const days = useMemo(() => weekDays(weekStart), [weekStart]);
    const todayISO = toISODate(new Date());
    const currentWeekStart = useMemo(() => weekStartOf(), []);
    const isCurrentWeek = weekStart === currentWeekStart;

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
        mealColumnsAvailable().then(setMealCols);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mealAt = (date: string, slot: MealSlot) => meals.find((m) => m.date === date && m.slot === slot);
    const saveGlucose = async (m: MealEntry) => {
        const value = parseNum(glucoseDraft.value);
        if (value == null || value <= 0) { setGlucoseError(tx.glucoseInvalid); return; }
        const built = buildMealColumns({
            context: 'post_meal',
            selection: { kind: 'planner', slot: m.slot, title: m.title },
            interval: glucoseDraft.interval,
        });
        if (!built.ok) { setGlucoseError(tx.glucoseSaveError); return; }
        const res = await insertMetric({
            date: m.date,
            glucose_mg_dl: value,
            glucose_context: 'post_meal',
            ...built.columns,
        });
        if (!res.ok) { setGlucoseError(tx.glucoseSaveError); return; }
        if (res.mealColumnsMissing) setMealCols(false);
        setGlucoseFor(null);
        setGlucoseError(null);
        setGlucoseDraft({ value: '', interval: null });
    };
    const workoutAt = (date: string) => workouts.find((w) => w.date === date);

    const grocery = useMemo(
        () => buildGroceryList(meals.map((m) => m.ingredients), pantry.map((p) => p.name)),
        [meals, pantry],
    );

    const groceryCheckedCount = useMemo(
        () => grocery.filter((g) => checked.has(g.key)).length,
        [grocery, checked],
    );

    const planned = meals.length + workouts.filter((w) => w.kind !== 'rest').length;
    const completed = meals.filter((m) => m.done).length + workouts.filter((w) => w.kind !== 'rest' && w.done).length;
    const progressPercent = planned > 0 ? Math.round((completed / planned) * 100) : 0;

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

    const lang = isEs ? 'es' : 'en';
    const generate = (includeMeals: boolean, includeWorkouts: boolean, onlySlots?: { day: number; slot: MealSlot }[]) =>
        run(async () => {
            setNotice(null);
            setGaps([]);
            const plan = await requestPlan({
                language: lang,
                phase,
                pantry: pantry.map((p) => p.name),
                avoid: entriesToNames(foodPrefs.prefs.avoid, lang),
                includeMeals,
                includeWorkouts,
                onlySlots,
            });
            await applyGeneratedPlan(weekStart, plan, { video: new Map(videos.map((v) => [v.id, v.title])) });
            if (plan.savedRecipes) setNotice(tx.savedRecipes(plan.savedRecipes));
        });
    const planFromRecipes = () =>
        run(async () => {
            setNotice(null);
            const taken = new Set(meals.map((m) => `${days.indexOf(m.date)}-${m.slot}`));
            const result = await planMealsFromLibrary(weekStart, {
                language: lang,
                pantry: pantry.map((p) => p.name),
                avoid: foodPrefs.prefs.avoid,
                likes: foodPrefs.prefs.likes,
                taken,
            });
            setGaps(result.missing);
            if (result.filled === 0 && result.missing.length === 0) setNotice(tx.fromRecipesNone);
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

    const addPantry = async (suggestedName?: string) => {
        const name = (suggestedName || pantryInput).trim();
        if (!name) return;
        if (!suggestedName) setPantryInput('');
        try {
            const item = await addPantryItem(name);
            setPantry((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item].sort((a, b) => a.name.localeCompare(b.name))));
        } catch (err) {
            fail(err);
        }
    };

    const dayLabel = (iso: string) =>
        parseISODate(iso).toLocaleDateString(isEs ? 'es' : 'en', { weekday: 'short', day: 'numeric', month: 'short' });
    const dayNameShort = (iso: string) =>
        parseISODate(iso).toLocaleDateString(isEs ? 'es' : 'en', { weekday: 'long' });
    const dayDateNum = (iso: string) =>
        parseISODate(iso).toLocaleDateString(isEs ? 'es' : 'en', { day: 'numeric', month: 'short' });

    const rangeLabel = `${dayLabel(days[0])} – ${dayLabel(days[6])}`;

    return (
        <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 pb-36 md:pb-28">
                {/* HERO HEADER */}
                <header className="relative overflow-hidden rounded-3xl garden-wash border border-border/80 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
                    <div className="relative flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-wrap-balance">
                                <TitleSprig />{tx.title}
                            </h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold shrink-0">
                                <Icon name="sparkles" size={13} weight="bold" />
                                <span>{cycleInfo?.paused ? (isEs ? 'Modo embarazo' : 'Pregnancy mode') : phaseLabel}</span>
                                {cycleInfo?.cycleDay && !cycleInfo.paused && <span className="opacity-75">• Día {cycleInfo.cycleDay}</span>}
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-wrap-pretty max-w-2xl">
                            {tx.subtitle}
                        </p>
                    </div>

                    {/* One sprout per day; they bloom as the planned items get done. */}
                    <div className="relative flex flex-col items-start md:items-end gap-3 shrink-0">
                    <WeekSprouts
                        bloomed={planned > 0 ? Math.round((completed / planned) * 7) : 0}
                        className="h-20 sm:h-24"
                    />
                    {/* WEEKLY PROGRESS METRIC */}
                    {planned > 0 && (
                        <div className="flex items-center gap-3.5 bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-3 sm:px-4 shadow-xs shrink-0">
                            <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                                <Icon name="task_alt" size={18} weight="bold" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="font-semibold text-muted-foreground">{tx.progress}</span>
                                    <span className="font-bold text-foreground tabular-nums">
                                        {completed} / {planned} <span className="text-[11px] font-normal text-muted-foreground">({progressPercent}%)</span>
                                    </span>
                                </div>
                                <div className="w-36 sm:w-44 bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-garden h-full rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </header>

                {/* CONTROLS & ACTION TOOLBAR */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-card/60 backdrop-blur-sm border border-border/70 rounded-2xl p-3 sm:p-4 shadow-xs">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center bg-background rounded-xl border border-border/80 shadow-xs p-0.5">
                            <button
                                type="button"
                                onClick={() => setWeekStart(addDays(weekStart, -7))}
                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                                aria-label="Semana anterior"
                                title="Semana anterior"
                            >
                                <Icon name="chevron_left" size={18} weight="bold" />
                            </button>
                            <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-foreground min-w-[13rem] justify-center capitalize select-none shrink-0">
                                <Icon name="calendar" size={15} className="text-primary/80" />
                                <span>{rangeLabel}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWeekStart(addDays(weekStart, 7))}
                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer shrink-0"
                                aria-label="Semana siguiente"
                                title="Semana siguiente"
                            >
                                <Icon name="chevron_right" size={18} weight="bold" />
                            </button>
                        </div>

                        <Button
                            variant={isCurrentWeek ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => setWeekStart(currentWeekStart)}
                            className="text-xs shrink-0"
                        >
                            {tx.today}
                        </Button>
                    </div>

                    {/* AI Actions & Clear */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Button
                            size="sm"
                            icon="menu_book"
                            disabled={busy}
                            onClick={planFromRecipes}
                            className="shadow-sm"
                        >
                            {busy ? tx.fromRecipesBusy : tx.fromRecipes}
                        </Button>
                        <span className="text-xs text-muted-foreground">{tx.aiLabel}</span>
                        <Button
                            size="sm"
                            variant="secondary"
                            icon="auto_awesome"
                            disabled={busy}
                            onClick={() => generate(true, true)}
                            className="text-xs"
                        >
                            {tx.generate}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => generate(true, false)}
                            className="text-xs"
                        >
                            {tx.generateMeals}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => generate(false, true)}
                            className="text-xs"
                        >
                            {tx.generateWorkouts}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            icon="delete"
                            disabled={busy || planned === 0}
                            onClick={() => window.confirm(tx.confirmClear) && run(() => clearWeek(weekStart))}
                            className="text-muted-foreground hover:text-red-500 text-xs"
                        >
                            {tx.clear}
                        </Button>
                    </div>
                </div>

                {gaps.length > 0 && (
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-sm flex items-center justify-between gap-3 flex-wrap">
                        <span>{tx.gapNotice(gaps.length)}</span>
                        <Button size="sm" icon="auto_awesome" disabled={busy} onClick={() => generate(true, false, gaps)} className="text-xs">
                            {tx.completeWithAi}
                        </Button>
                    </div>
                )}
                {notice && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">{notice}</div>
                )}

                {error && (
                    <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <Icon name="close" size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* 7-DAY WEEKLY GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 items-start">
                    {days.map((date) => {
                        const w = workoutAt(date);
                        const isToday = date === todayISO;
                        const dayMeals = MEAL_SLOTS.map((s) => mealAt(date, s)).filter(Boolean);
                        const dayPlanned = dayMeals.length + (w && w.kind !== 'rest' ? 1 : 0);
                        const dayDone = dayMeals.filter((m) => m?.done).length + (w && w.kind !== 'rest' && w.done ? 1 : 0);

                        return (
                            <div
                                key={date}
                                className={`rounded-2xl border transition-all duration-200 bg-card p-4 flex flex-col gap-3.5 shadow-xs ${
                                    isToday
                                        ? 'ring-2 ring-primary/60 border-primary/40 bg-gradient-to-b from-primary/5 via-card to-card'
                                        : 'border-border/80 hover:border-border'
                                }`}
                            >
                                {/* DAY CARD HEADER */}
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground capitalize leading-snug">
                                            {dayNameShort(date)}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {dayDateNum(date)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {dayPlanned > 0 && (
                                            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                {dayDone}/{dayPlanned}
                                            </span>
                                        )}
                                        {isToday && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground tracking-wide uppercase">
                                                {tx.today}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* WORKOUT SECTION */}
                                <div className="rounded-xl bg-secondary/35 border border-border/60 p-2.5 flex flex-col gap-1.5 transition-colors">
                                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Icon name="fitness_center" size={14} className="text-primary" />
                                            <span>{tx.workout}</span>
                                        </div>
                                        {w && w.durationMinutes && (
                                            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                                                {w.durationMinutes}′
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {w && w.kind !== 'rest' && (
                                            <input
                                                type="checkbox"
                                                checked={w.done}
                                                onChange={() => toggle('workout', w)}
                                                aria-label={tx.workout}
                                                className="size-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary shrink-0"
                                            />
                                        )}
                                        <select
                                            className={`${inputClass} text-xs py-1.5 ${w?.done ? 'line-through opacity-70' : ''}`}
                                            aria-label={tx.workout}
                                            value={w ? (w.kind === 'video' ? w.videoId ?? '' : w.kind) : ''}
                                            onChange={(e) => changeWorkout(date, e.target.value)}
                                            disabled={busy}
                                        >
                                            <option value="">{tx.none}</option>
                                            <option value="rest">☕ {tx.rest}</option>
                                            <option value="gym">🏋️ {tx.gym}</option>
                                            {videos.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    ▶ {v.title} ({v.durationMinutes}′)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* MEAL SLOTS */}
                                <div className="flex flex-col gap-2.5 pt-1">
                                    {MEAL_SLOTS.map((slot) => {
                                        const m = mealAt(date, slot);
                                        const isEditing = editing?.date === date && editing.slot === slot;
                                        const slotIcon = tx.slotIcons[slot];

                                        return (
                                            <div key={slot} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                                    <Icon name={slotIcon} size={12} className="opacity-70" />
                                                    <span>{tx.slots[slot]}</span>
                                                </div>

                                                {isEditing ? (
                                                    <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-background border border-primary/50 shadow-xs">
                                                        <input
                                                            className={inputClass}
                                                            autoFocus
                                                            placeholder={tx.mealTitle}
                                                            value={draft.title}
                                                            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') submitMeal();
                                                                else if (e.key === 'Escape') setEditing(null);
                                                            }}
                                                        />
                                                        <input
                                                            className={inputClass}
                                                            placeholder={tx.mealIngredients}
                                                            value={draft.ingredients}
                                                            onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') submitMeal();
                                                                else if (e.key === 'Escape') setEditing(null);
                                                            }}
                                                        />
                                                        <div className="flex items-center justify-end gap-1.5 pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditing(null)}
                                                                className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                {tx.cancel}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={submitMeal}
                                                                className="px-2.5 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                                                            >
                                                                {tx.save}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : m ? (
                                                    <>
                                                    <div className="group flex items-start gap-2 p-1.5 rounded-xl hover:bg-muted/40 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={m.done}
                                                            onChange={() => toggle('meal', m)}
                                                            aria-label={m.title}
                                                            className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary shrink-0"
                                                        />
                                                        <div
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => startEdit(date, slot)}
                                                            role="button"
                                                            tabIndex={0}
                                                            onKeyDown={(e) => e.key === 'Enter' && startEdit(date, slot)}
                                                        >
                                                            <p
                                                                className={`text-xs font-medium leading-snug break-words transition-colors hover:text-primary ${
                                                                    m.done ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                }`}
                                                            >
                                                                {m.title}
                                                            </p>
                                                            {m.ingredients && m.ingredients.length > 0 && (
                                                                <p className="text-[11px] text-muted-foreground/80 line-clamp-1 truncate mt-0.5">
                                                                    {m.ingredients.join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {canAddGlucoseFromMeal(m.done, mealCols) && (
                                                            <button
                                                                type="button"
                                                                aria-label={tx.addGlucose}
                                                                title={tx.addGlucose}
                                                                className="text-muted-foreground hover:text-primary transition-colors p-0.5 cursor-pointer shrink-0"
                                                                onClick={() => {
                                                                    setGlucoseFor(glucoseFor === m.id ? null : m.id);
                                                                    setGlucoseError(null);
                                                                    setGlucoseDraft({ value: '', interval: null });
                                                                }}
                                                            >
                                                                <Icon name="glucose" size={13} />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            aria-label="Eliminar comida"
                                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-0.5 cursor-pointer shrink-0"
                                                            onClick={() => remove('meal', m.id)}
                                                        >
                                                            <Icon name="close" size={13} />
                                                        </button>
                                                    </div>
                                                    {glucoseFor === m.id && canAddGlucoseFromMeal(m.done, mealCols) && (
                                                        <div className="flex flex-col gap-1.5 p-1.5">
                                                            <input
                                                                inputMode="decimal"
                                                                value={glucoseDraft.value}
                                                                onChange={(e) => setGlucoseDraft((d) => ({ ...d, value: e.target.value }))}
                                                                placeholder={tx.glucoseValue}
                                                                aria-label={tx.glucoseValue}
                                                                className={inputClass}
                                                            />
                                                            <select
                                                                value={glucoseDraft.interval ?? ''}
                                                                onChange={(e) => setGlucoseDraft((d) => ({ ...d, interval: e.target.value === '' ? null : (Number(e.target.value) as 1 | 2) }))}
                                                                className={inputClass}
                                                            >
                                                                <option value="">—</option>
                                                                <option value="1">{tx.oneHour}</option>
                                                                <option value="2">{tx.twoHours}</option>
                                                            </select>
                                                            {glucoseError && <p className="text-[11px] text-destructive">{glucoseError}</p>}
                                                            <div className="flex justify-end gap-1.5">
                                                                <button type="button" onClick={() => setGlucoseFor(null)} className="px-2.5 py-1 text-xs text-muted-foreground cursor-pointer">
                                                                    {tx.cancel}
                                                                </button>
                                                                <button type="button" onClick={() => saveGlucose(m)} className="px-2.5 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 cursor-pointer">
                                                                    {tx.save}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="w-full py-1 px-2 rounded-lg border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
                                                        onClick={() => startEdit(date, slot)}
                                                    >
                                                        <Icon name="plus" size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                                        <span>{tx.addMealPrompt}</span>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* BOTTOM SECTION: GROCERY & PANTRY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
                    {/* GROCERY LIST CARD */}
                    <Card hoverable={false} className="p-5 flex flex-col gap-4 border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary">
                                    <Icon name="task_alt" size={17} weight="bold" />
                                </div>
                                <h2 className="text-base font-bold text-foreground">{tx.grocery}</h2>
                            </div>
                            {grocery.length > 0 && (
                                <span className="text-xs font-semibold tabular-nums text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                    {groceryCheckedCount} / {grocery.length} {tx.groceryCompleted}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Cargando lista…</p>
                        ) : grocery.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                                    <Icon name="meal_ideas" size={24} />
                                </div>
                                <p className="text-sm text-muted-foreground max-w-sm text-wrap-pretty leading-relaxed">
                                    {tx.groceryEmpty}
                                </p>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                                {grocery.map((item) => {
                                    const isItemChecked = checked.has(item.key);
                                    return (
                                        <li
                                            key={item.key}
                                            className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-colors ${
                                                isItemChecked ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            <label className="flex items-center gap-2.5 text-sm cursor-pointer flex-1 select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={isItemChecked}
                                                    onChange={() => toggleGrocery(item.key)}
                                                    className="size-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary"
                                                />
                                                <span className={`font-medium ${isItemChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                    {item.label}
                                                </span>
                                            </label>
                                            {item.count > 1 && (
                                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums shrink-0">
                                                    ×{item.count}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>

                    {/* PANTRY CARD */}
                    <Card hoverable={false} className="p-5 flex flex-col gap-4 border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary">
                                    <Icon name="restaurant" size={17} weight="bold" />
                                </div>
                                <h2 className="text-base font-bold text-foreground">{tx.pantry}</h2>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                {pantry.length} ingredientes
                            </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed -mt-1 text-wrap-pretty">
                            {tx.pantryHint}
                        </p>

                        <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                addPantry();
                            }}
                        >
                            <input
                                className={inputClass}
                                placeholder={tx.pantryPlaceholder}
                                value={pantryInput}
                                onChange={(e) => setPantryInput(e.target.value)}
                            />
                            <Button size="sm" type="submit" disabled={!pantryInput.trim()} className="shrink-0">
                                {tx.pantryAdd}
                            </Button>
                        </form>

                        {/* Quick Suggestions */}
                        <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                {tx.pantryQuickSuggestions}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_PANTRY_SUGGESTIONS.filter((s) => !pantry.some((p) => p.name.toLowerCase() === s.toLowerCase())).map((sug) => (
                                    <button
                                        key={sug}
                                        type="button"
                                        onClick={() => addPantry(sug)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border/80 px-2 py-0.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                    >
                                        <Icon name="plus" size={10} />
                                        <span>{sug}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pantry tags */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50 max-h-48 overflow-y-auto">
                            {pantry.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2">
                                    Tu despensa está vacía. Agrega lo que tienes en cocina para que la IA lo use primero.
                                </p>
                            ) : (
                                pantry.map((p) => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 border border-border/70 px-3 py-1 text-xs font-medium text-foreground transition-colors group"
                                    >
                                        <span>{p.name}</span>
                                        <button
                                            type="button"
                                            aria-label={`Quitar ${p.name}`}
                                            className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                            onClick={() =>
                                                removePantryItem(p.id)
                                                    .then(() => setPantry((prev) => prev.filter((x) => x.id !== p.id)))
                                                    .catch(fail)
                                            }
                                        >
                                            <Icon name="close" size={11} />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlanner;
