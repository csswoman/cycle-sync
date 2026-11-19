'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface BodyProfile {
  heightCm: number | null;
  startWeightKg: number | null;
  /** YYYY-MM-DD */
  startDate: string | null;
  /** How the day's protein is split in /nutrition. */
  mealsPerDay: 3 | 4 | null;
  /** HH:MM */
  firstMealTime: string | null;
  /** Goal weight the user wants to reach. */
  goalWeightKg: number | null;
  /** Habit goals (keys from lib/body/goals). */
  focusHabits: string[];
}

const EMPTY: BodyProfile = {
  heightCm: null, startWeightKg: null, startDate: null, mealsPerDay: null, firstMealTime: null,
  goalWeightKg: null, focusHabits: [],
};

const isMissingColumn = (err: { code?: string } | null) => err?.code === '42703' || err?.code === 'PGRST204';

const num = (v: unknown): number | null => {
  const n = Number(v);
  return v != null && Number.isFinite(n) && n > 0 ? n : null;
};

const BODY_COLUMNS = 'height_cm, start_weight_kg, start_date';
const MEAL_COLUMNS = 'meals_per_day, first_meal_time';
const GOAL_COLUMNS = 'goal_weight_kg, focus_habits';

/** Goals are also kept on the device so they survive a reload before the goals migration is applied. */
type LocalGoals = Pick<BodyProfile, 'goalWeightKg' | 'focusHabits'>;
const goalsKey = (userId: string) => `cyclesync.bodyGoals.${userId}`;

function readLocalGoals(userId: string): Partial<LocalGoals> {
  try {
    const raw = localStorage.getItem(goalsKey(userId));
    if (!raw) return {};
    const v = JSON.parse(raw) as Partial<LocalGoals>;
    return {
      ...(num(v.goalWeightKg) != null && { goalWeightKg: num(v.goalWeightKg) }),
      ...(Array.isArray(v.focusHabits) && { focusHabits: v.focusHabits.filter((h): h is string => typeof h === 'string') }),
    };
  } catch {
    return {};
  }
}

function writeLocalGoals(userId: string, patch: Partial<BodyProfile>) {
  if (!('goalWeightKg' in patch) && !('focusHabits' in patch)) return;
  try {
    const next: Partial<LocalGoals> = { ...readLocalGoals(userId) };
    if ('goalWeightKg' in patch) next.goalWeightKg = patch.goalWeightKg ?? null;
    if ('focusHabits' in patch) next.focusHabits = patch.focusHabits ?? [];
    localStorage.setItem(goalsKey(userId), JSON.stringify(next));
  } catch {
    // Storage blocked: the database copy is all there is.
  }
}

/**
 * Height, starting weight and meal settings, stored on `cycle_config`.
 * `available` is false when the body migration is not applied yet; the page then
 * keeps working with local values only. Meal settings need the journal migration and
 * are skipped silently without it.
 */
export function useBodyProfile() {
  const [profile, setProfile] = useState<BodyProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        if (live) setSignedIn(true);
        const query = (columns: string) => supabase.from('cycle_config').select(columns).eq('user_id', session.user.id).maybeSingle();
        let { data, error } = await query(`${BODY_COLUMNS}, ${MEAL_COLUMNS}, ${GOAL_COLUMNS}`);
        if (error && isMissingColumn(error)) ({ data, error } = await query(`${BODY_COLUMNS}, ${MEAL_COLUMNS}`));
        if (error && isMissingColumn(error)) ({ data, error } = await query(BODY_COLUMNS));
        if (!live) return;
        const local = readLocalGoals(session.user.id);
        if (local.goalWeightKg != null || local.focusHabits) setProfile((p) => ({ ...p, ...local }));
        if (error) { if (isMissingColumn(error)) setAvailable(false); return; }
        const row = data as {
          height_cm?: unknown; start_weight_kg?: unknown; start_date?: string | null;
          meals_per_day?: unknown; first_meal_time?: string | null;
          goal_weight_kg?: unknown; focus_habits?: unknown;
        } | null;
        if (row) {
          const meals = Number(row.meals_per_day);
          setProfile({
            heightCm: num(row.height_cm),
            startWeightKg: num(row.start_weight_kg),
            startDate: row.start_date ?? null,
            mealsPerDay: meals === 3 || meals === 4 ? meals : null,
            firstMealTime: typeof row.first_meal_time === 'string' && /^\d{2}:\d{2}$/.test(row.first_meal_time) ? row.first_meal_time : null,
            // Database first; the device copy covers a missing goals migration or a save that failed.
            goalWeightKg: num(row.goal_weight_kg) ?? local.goalWeightKg ?? null,
            focusHabits: Array.isArray(row.focus_habits) && row.focus_habits.length > 0
              ? row.focus_habits.filter((h): h is string => typeof h === 'string')
              : local.focusHabits ?? [],
          });
        }
      } catch {
        // Offline: keep local values.
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const save = useCallback(async (patch: Partial<BodyProfile>): Promise<boolean> => {
    setProfile((prev) => ({ ...prev, ...patch }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;
      writeLocalGoals(session.user.id, patch);
      const row: Record<string, unknown> = { user_id: session.user.id, updated_at: new Date().toISOString() };
      if ('heightCm' in patch) row.height_cm = patch.heightCm;
      if ('startWeightKg' in patch) row.start_weight_kg = patch.startWeightKg;
      if ('startDate' in patch) row.start_date = patch.startDate;
      if ('mealsPerDay' in patch) row.meals_per_day = patch.mealsPerDay;
      if ('firstMealTime' in patch) row.first_meal_time = patch.firstMealTime;
      if ('goalWeightKg' in patch) row.goal_weight_kg = patch.goalWeightKg;
      if ('focusHabits' in patch) row.focus_habits = patch.focusHabits;
      const { error } = await supabase.from('cycle_config').upsert(row, { onConflict: 'user_id' });
      if (error) {
        // Meal and goal columns come from later migrations: a missing one there must not hide the body profile.
        const optionalOnly = !('heightCm' in patch) && !('startWeightKg' in patch) && !('startDate' in patch);
        if (isMissingColumn(error) && !optionalOnly) setAvailable(false);
        console.warn('body profile not saved:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { profile, loading, available, signedIn, save };
}
