import { supabase } from '@/lib/supabase';
import { addDays, weekDays, type MealSlot } from '@/lib/planner/week';
import type { GeneratedPlan } from '@/lib/planner/plan';

export interface MealEntry {
    id: string;
    date: string;
    slot: MealSlot;
    title: string;
    ingredients: string[];
    done: boolean;
}

export interface WorkoutEntry {
    id: string;
    date: string;
    kind: 'video' | 'gym' | 'rest';
    videoId: string | null;
    title: string;
    durationMinutes: number | null;
    done: boolean;
}

export interface PantryItem {
    id: string;
    name: string;
}

async function currentUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const id = session?.user?.id;
    if (!id) throw new Error('Not signed in');
    return id;
}

const toMeal = (r: any): MealEntry => ({
    id: r.id,
    date: String(r.plan_date).slice(0, 10),
    slot: r.slot,
    title: r.title,
    ingredients: (r.ingredients ?? []) as string[],
    done: !!r.done,
});

const toWorkout = (r: any): WorkoutEntry => ({
    id: r.id,
    date: String(r.plan_date).slice(0, 10),
    kind: r.kind,
    videoId: r.video_id ?? null,
    title: r.title,
    durationMinutes: r.duration_minutes ?? null,
    done: !!r.done,
});

export async function loadWeek(weekStart: string) {
    const userId = await currentUserId();
    const end = addDays(weekStart, 6);
    const [meals, workouts, checks] = await Promise.all([
        supabase.from('meal_plan_entries').select('*').eq('user_id', userId).gte('plan_date', weekStart).lte('plan_date', end),
        supabase.from('workout_plan_entries').select('*').eq('user_id', userId).gte('plan_date', weekStart).lte('plan_date', end),
        supabase.from('grocery_checks').select('item_key').eq('user_id', userId).eq('week_start', weekStart),
    ]);
    if (meals.error) throw meals.error;
    if (workouts.error) throw workouts.error;
    if (checks.error) throw checks.error;
    return {
        meals: (meals.data ?? []).map(toMeal),
        workouts: (workouts.data ?? []).map(toWorkout),
        checked: (checks.data ?? []).map((c) => c.item_key as string),
    };
}

export async function saveMeal(input: { date: string; slot: MealSlot; title: string; ingredients: string[] }) {
    const userId = await currentUserId();
    const { data, error } = await supabase
        .from('meal_plan_entries')
        .upsert(
            { user_id: userId, plan_date: input.date, slot: input.slot, title: input.title, ingredients: input.ingredients, done: false },
            { onConflict: 'user_id,plan_date,slot' },
        )
        .select()
        .single();
    if (error) throw error;
    return toMeal(data);
}

export async function saveWorkout(input: Omit<WorkoutEntry, 'id' | 'done'>) {
    const userId = await currentUserId();
    const { data, error } = await supabase
        .from('workout_plan_entries')
        .upsert(
            {
                user_id: userId,
                plan_date: input.date,
                kind: input.kind,
                video_id: input.videoId,
                title: input.title,
                duration_minutes: input.durationMinutes,
                done: false,
            },
            { onConflict: 'user_id,plan_date' },
        )
        .select()
        .single();
    if (error) throw error;
    return toWorkout(data);
}

export async function setDone(table: 'meal' | 'workout', id: string, done: boolean) {
    const { error } = await supabase
        .from(table === 'meal' ? 'meal_plan_entries' : 'workout_plan_entries')
        .update({ done })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteEntry(table: 'meal' | 'workout', id: string) {
    const { error } = await supabase
        .from(table === 'meal' ? 'meal_plan_entries' : 'workout_plan_entries')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

/** Writes an AI-generated plan into the given week, replacing the entries of the days/slots it covers. */
export async function applyGeneratedPlan(weekStart: string, plan: GeneratedPlan, titles: { video: Map<string, string> }) {
    const userId = await currentUserId();
    const days = weekDays(weekStart);

    if (plan.meals.length > 0) {
        const { error } = await supabase.from('meal_plan_entries').upsert(
            plan.meals.map((m) => ({
                user_id: userId,
                plan_date: days[m.day],
                slot: m.slot,
                title: m.title,
                ingredients: m.ingredients,
                done: false,
            })),
            { onConflict: 'user_id,plan_date,slot' },
        );
        if (error) throw error;
    }

    if (plan.workouts.length > 0) {
        const { error } = await supabase.from('workout_plan_entries').upsert(
            plan.workouts.map((w) => ({
                user_id: userId,
                plan_date: days[w.day],
                kind: w.kind,
                video_id: w.videoId,
                title: (w.videoId && titles.video.get(w.videoId)) || w.title,
                duration_minutes: w.durationMinutes,
                done: false,
            })),
            { onConflict: 'user_id,plan_date' },
        );
        if (error) throw error;
    }
}

export async function clearWeek(weekStart: string) {
    const userId = await currentUserId();
    const end = addDays(weekStart, 6);
    const [m, w] = await Promise.all([
        supabase.from('meal_plan_entries').delete().eq('user_id', userId).gte('plan_date', weekStart).lte('plan_date', end),
        supabase.from('workout_plan_entries').delete().eq('user_id', userId).gte('plan_date', weekStart).lte('plan_date', end),
    ]);
    if (m.error) throw m.error;
    if (w.error) throw w.error;
}

export async function setGroceryChecked(weekStart: string, itemKey: string, checked: boolean) {
    const userId = await currentUserId();
    const q = checked
        ? supabase.from('grocery_checks').upsert({ user_id: userId, week_start: weekStart, item_key: itemKey })
        : supabase.from('grocery_checks').delete().eq('user_id', userId).eq('week_start', weekStart).eq('item_key', itemKey);
    const { error } = await q;
    if (error) throw error;
}

export async function listPantry(): Promise<PantryItem[]> {
    const userId = await currentUserId();
    const { data, error } = await supabase.from('pantry_items').select('id, name').eq('user_id', userId).order('name');
    if (error) throw error;
    return (data ?? []) as PantryItem[];
}

export async function addPantryItem(name: string): Promise<PantryItem> {
    const userId = await currentUserId();
    const { data, error } = await supabase
        .from('pantry_items')
        .upsert({ user_id: userId, name: name.trim().slice(0, 60) }, { onConflict: 'user_id,name' })
        .select('id, name')
        .single();
    if (error) throw error;
    return data as PantryItem;
}

export async function removePantryItem(id: string) {
    const { error } = await supabase.from('pantry_items').delete().eq('id', id);
    if (error) throw error;
}

export async function requestPlan(body: {
    language: 'es' | 'en';
    phase: string;
    pantry: string[];
    dietary?: string[];
    includeMeals: boolean;
    includeWorkouts: boolean;
}): Promise<GeneratedPlan> {
    const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Plan generation failed (${res.status})`);
    return data as GeneratedPlan;
}
