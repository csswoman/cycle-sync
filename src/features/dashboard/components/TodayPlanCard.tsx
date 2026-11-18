'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { MEAL_SLOTS, toISODate } from '@/lib/planner/week';
import { useGuest } from '@/hooks/useGuest';
import { loadDay, setDone, type MealEntry, type WorkoutEntry } from '@/services/plannerService';
import { listLibrary } from '@/services/recipesService';
import { CATALOG_RECIPES } from '@/data/seedRecipes';
import { titleKey, isSimilarTitle } from '@/lib/recipes/normalize';
import { TODAY_CHANGED_EVENT } from '@/hooks/useTodayCheckin';

const COPY = {
    es: {
        title: 'Tu plan de hoy',
        open: 'Ver plan semanal',
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
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium truncate ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{title}</p>
            {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
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

type Photo = { title: string; key: string; url: string };
const collectPhotos = (recipes: { title: string; imageUrl?: string | null }[]): Photo[] =>
    recipes.filter((r) => r.imageUrl).map((r) => ({ title: r.title, key: titleKey(r.title), url: r.imageUrl as string }));

/** Planner entries only store the meal title, so the photo comes from the matching recipe. */
const photoFor = (photos: Photo[], title: string): string | null => {
    const key = titleKey(title);
    return (photos.find((p) => p.key === key) ?? photos.find((p) => isSimilarTitle(p.title, title)))?.url ?? null;
};

interface MealTileProps {
    slotLabel: string;
    meal: MealEntry;
    image: string | null;
    onBroken: (url: string) => void;
    onToggle: () => void;
}
const MealTile: React.FC<MealTileProps> = ({ slotLabel, meal, image, onBroken, onToggle }) => (
    <li className="min-w-0 flex flex-col gap-2">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => onBroken(image)}
                    className={`size-full object-cover transition-opacity ${meal.done ? 'opacity-50' : ''}`}
                />
            ) : (
                <span className="size-full flex items-center justify-center text-muted-foreground/60">
                    <Icon name="restaurant" size={28} weight="duotone" />
                </span>
            )}
            <button
                onClick={onToggle}
                aria-pressed={meal.done}
                aria-label={meal.title}
                className="absolute top-1 right-1 size-10 rounded-full flex items-center justify-center cursor-pointer"
            >
                <span className="size-8 rounded-full bg-card/90 shadow-sm flex items-center justify-center">
                    <Icon
                        name="check_circle"
                        size={22}
                        weight={meal.done ? 'fill' : 'regular'}
                        className={meal.done ? 'text-leaf' : 'text-muted-foreground'}
                    />
                </span>
            </button>
        </div>
        <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{slotLabel}</p>
            <p className={`text-sm font-medium leading-snug line-clamp-2 text-pretty ${meal.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{meal.title}</p>
        </div>
    </li>
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
    const [photos, setPhotos] = useState<Photo[]>(() => collectPhotos(CATALOG_RECIPES));
    const [broken, setBroken] = useState<Set<string>>(new Set());
    useEffect(() => {
        // Library recipes first (planner meals usually come from there); the bundled catalog stays as fallback and for guests.
        listLibrary()
            .then((lib) => setPhotos(collectPhotos([...lib, ...CATALOG_RECIPES])))
            .catch(() => { /* keep catalog photos */ });
    }, []);
    useEffect(() => {
        const load = () => loadDay(toISODate(new Date()))
            .then((day) => { setMeals(day.meals); setWorkout(day.workout); })
            .catch(() => { /* signed out or offline: no plan card */ })
            .finally(() => { setLoading(false); });
        void load();
        // "Your version of today" can mark the planned workout done.
        window.addEventListener(TODAY_CHANGED_EVENT, load);
        return () => window.removeEventListener(TODAY_CHANGED_EVENT, load);
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
            {workout && (
                <div className="divide-y divide-border/60">
                    <Item
                        icon="fitness_center"
                        label={workout.kind === 'rest' ? copy.rest : workout.kind === 'gym' ? 'Gym' : 'Video'}
                        title={workout.title}
                        detail={workout.durationMinutes ? `${workout.durationMinutes} ${copy.minutes}` : undefined}
                        done={workout.done}
                        onToggle={workout.kind === 'rest' ? undefined : toggleWorkout}
                    />
                </div>
            )}
            {ordered.length > 0 && (
                <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-4 mt-3">
                    {ordered.map((meal) => {
                        const url = photoFor(photos, meal.title);
                        return (
                            <MealTile
                                key={meal.id}
                                slotLabel={copy.slots[meal.slot]}
                                meal={meal}
                                image={url && !broken.has(url) ? url : null}
                                onBroken={(u) => setBroken((prev) => new Set(prev).add(u))}
                                onToggle={() => toggleMeal(meal)}
                            />
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
