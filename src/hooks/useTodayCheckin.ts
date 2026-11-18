'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/offlineDb';
import { getLocalDailyLog, saveDailyLogOffline, saveWorkoutLogOffline } from '@/lib/offlineHelpers';
import { syncAll } from '@/hooks/useOfflineSync';
import { localDateString } from '@/hooks/useMedications';
import { addDays } from '@/lib/planner/week';
import type { CravingKind, TodayCheckin } from '@/lib/today/dailyPlan';

/** Fired after any change to today's log or movement, so other dashboard cards can refresh. */
export const TODAY_CHANGED_EVENT = 'cyclesync:today-changed';

/** Full row kept so a check-in save never wipes fields edited on the full log page. */
interface StoredLog {
  mood: string | null;
  energyLevel: number | null;
  sleepHours: number | null;
  sleepQuality: string | null;
  symptoms: string[];
  notes: string | null;
  cravings: CravingKind[];
  cravingIntensity: number | null;
  motivation: number | null;
}

const EMPTY: StoredLog = {
  mood: null, energyLevel: null, sleepHours: null, sleepQuality: null, symptoms: [], notes: null,
  cravings: [], cravingIntensity: null, motivation: null,
};

export const SUGAR_SYMPTOM = 'Sugar Cravings';

const fromRemote = (r: any): StoredLog => ({
  mood: r.mood ?? null,
  energyLevel: r.energy_level ?? null,
  sleepHours: r.sleep_hours != null ? Number(r.sleep_hours) : null,
  sleepQuality: r.sleep_quality ?? null,
  symptoms: r.symptoms ?? [],
  notes: r.notes ?? null,
  cravings: (r.cravings ?? []) as CravingKind[],
  cravingIntensity: r.craving_intensity ?? null,
  motivation: r.motivation ?? null,
});

export type { StoredLog };

export interface TodayCheckinState {
  loading: boolean;
  userId: string | null;
  /** True once today has a log (from this card or the full log page). */
  logged: boolean;
  log: StoredLog;
  /** Yesterday's log, for "same as yesterday". */
  yesterday: StoredLog | null;
  /** Dates in the last 14 days with a logged workout or a completed planned one. */
  moveDates: string[];
  checkin: TodayCheckin | null;
  save: (patch: Partial<StoredLog>) => Promise<void>;
  /** Logs a movement session (e.g. the 10-minute minimum) as a workout. */
  logMovement: (label: string, minutes: number, phase: string | null) => Promise<void>;
}

export function useTodayCheckin(): TodayCheckinState {
  const [userId, setUserId] = useState<string | null>(null);
  const [log, setLog] = useState<StoredLog>(EMPTY);
  const [logged, setLogged] = useState(false);
  const [yesterday, setYesterday] = useState<StoredLog | null>(null);
  const [moveDates, setMoveDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? null;
    setUserId(uid);
    if (!uid) { setLoading(false); return; }
    const today = localDateString();
    const since = addDays(today, -13);
    try {
      const [local, remote, prev, workouts, planned, localWorkouts] = await Promise.all([
        getLocalDailyLog(uid, today),
        supabase.from('daily_logs').select('*').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('daily_logs').select('*').eq('user_id', uid).eq('date', addDays(today, -1)).maybeSingle(),
        supabase.from('workout_logs').select('date').eq('user_id', uid).gte('date', since),
        supabase.from('workout_plan_entries').select('plan_date, kind, done').eq('user_id', uid).gte('plan_date', since).eq('done', true),
        db.workoutLogs.filter((w) => w.userId === uid && w.date >= since).toArray(),
      ]);
      if (local && !local.synced) {
        // Pending local edits win over the remote copy.
        setLog({
          mood: local.mood, energyLevel: local.energyLevel, sleepHours: local.sleepHours, sleepQuality: local.sleepQuality,
          symptoms: local.symptoms ?? [], notes: local.notes,
          cravings: (local.cravings ?? (remote.data?.cravings ?? [])) as CravingKind[],
          cravingIntensity: local.cravingIntensity ?? remote.data?.craving_intensity ?? null,
          motivation: local.motivation ?? remote.data?.motivation ?? null,
        });
        setLogged(true);
      } else if (remote.data) {
        setLog(fromRemote(remote.data));
        setLogged(true);
      } else {
        setLog(EMPTY);
        setLogged(false);
      }
      setYesterday(prev.data ? fromRemote(prev.data) : null);
      const dates = new Set<string>();
      for (const w of workouts.data ?? []) dates.add(String(w.date).slice(0, 10));
      for (const w of planned.data ?? []) if (w.kind !== 'rest') dates.add(String(w.plan_date).slice(0, 10));
      for (const w of localWorkouts) dates.add(w.date);
      setMoveDates(Array.from(dates).sort());
    } catch (err) {
      console.error('Today check-in load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onChange = () => { void load(); };
    window.addEventListener(TODAY_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(TODAY_CHANGED_EVENT, onChange);
  }, [load]);

  const save = useCallback(async (patch: Partial<StoredLog>) => {
    if (!userId) return;
    const next = { ...log, ...patch };
    // Keep the older "Sugar Cravings" symptom in step with the sweet craving so existing insights still see it.
    if (patch.cravings) {
      const hasSweet = next.cravings.includes('sweet');
      const withoutSugar = next.symptoms.filter((s) => s !== SUGAR_SYMPTOM);
      next.symptoms = hasSweet ? [...withoutSugar, SUGAR_SYMPTOM] : withoutSugar;
    }
    setLog(next);
    setLogged(true);
    await saveDailyLogOffline({ userId, date: localDateString(), ...next });
    if (navigator.onLine) await syncAll();
    window.dispatchEvent(new Event(TODAY_CHANGED_EVENT));
  }, [log, userId]);

  const logMovement = useCallback(async (label: string, minutes: number, phase: string | null) => {
    if (!userId) return;
    const today = localDateString();
    // feeling is 1-5; derived from the check-in so the workout log stays a one-tap action.
    const feeling = log.energyLevel == null ? 3 : Math.min(5, Math.max(1, Math.round(log.energyLevel / 2)));
    await saveWorkoutLogOffline({
      userId, date: today, exercise: label, sets: null, weightKg: null,
      durationMinutes: minutes, feeling, notes: null, phase,
    });
    setMoveDates((d) => (d.includes(today) ? d : [...d, today].sort()));
    if (navigator.onLine) await syncAll();
    window.dispatchEvent(new Event(TODAY_CHANGED_EVENT));
  }, [log.energyLevel, userId]);

  const checkin: TodayCheckin | null = logged
    ? {
        energy: log.energyLevel,
        motivation: log.motivation,
        sleepHours: log.sleepHours,
        cravings: log.cravings,
        cravingIntensity: log.cravingIntensity,
        symptoms: log.symptoms,
      }
    : null;

  return { loading, userId, logged, log, yesterday, moveDates, checkin, save, logMovement };
}
