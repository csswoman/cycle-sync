'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveWorkoutLogOffline, getUnsyncedWorkoutLogs } from '@/lib/offlineHelpers';
import { db } from '@/lib/offlineDb';
import { syncAll } from '@/hooks/useOfflineSync';
import { logSource, type LogSource, type SetEntry } from '@/lib/exercise/trainingStats';

export interface WorkoutLog {
  id: string;
  date: string;
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  feeling: number;
  notes: string | null;
  phase: string | null;
  source: LogSource;
  refId: string | null;
  refName: string | null;
  sessionId: string | null;
  setDetails: SetEntry[] | null;
  createdAt: string | null;
  pending: boolean;
}

export interface WorkoutLogInput {
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  feeling: number;
  notes: string | null;
  phase: string | null;
  /** YYYY-MM-DD; today when omitted (the calendar can log a past day). */
  date?: string;
  source?: LogSource;
  refId?: string | null;
  refName?: string | null;
  sessionId?: string | null;
  setDetails?: SetEntry[] | null;
}

/** History kept in memory: a year covers the calendar, the streak and personal records. */
const HISTORY_DAYS = 400;
const HISTORY_LIMIT = 3000;

/** Today as YYYY-MM-DD in the user's local timezone (toISOString would give the UTC date). */
export function localDateString(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const parseSets = (v: unknown): SetEntry[] | null => {
  if (!Array.isArray(v)) return null;
  const sets = v
    .filter((s) => s && typeof s === 'object')
    .map((s: any) => ({ reps: Number.isFinite(Number(s.reps)) && s.reps != null ? Number(s.reps) : null, weight: Number.isFinite(Number(s.weight)) && s.weight != null ? Number(s.weight) : null }));
  return sets.length ? sets : null;
};

export function useWorkoutLogs() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const since = new Date();
      since.setDate(since.getDate() - HISTORY_DAYS);
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', localDateString(since))
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);

      const remote: WorkoutLog[] = error ? [] : (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.date,
        exercise: r.exercise,
        sets: r.sets,
        weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
        durationMinutes: r.duration_minutes,
        feeling: r.feeling,
        notes: r.notes,
        phase: r.phase,
        source: logSource({ source: r.source, notes: r.notes }),
        refId: r.ref_id ?? null,
        refName: r.ref_name ?? null,
        sessionId: r.session_id ?? null,
        setDetails: parseSets(r.set_details),
        createdAt: r.created_at ?? null,
        pending: false,
      }));

      // Overlay entries saved locally that have not reached Supabase yet.
      const pending = await getUnsyncedWorkoutLogs(user.id);
      const local: WorkoutLog[] = pending.map((p) => ({
        id: p.remoteId,
        date: p.date,
        exercise: p.exercise,
        sets: p.sets,
        weightKg: p.weightKg,
        durationMinutes: p.durationMinutes,
        feeling: p.feeling,
        notes: p.notes,
        phase: p.phase,
        source: logSource({ source: p.source, notes: p.notes }),
        refId: p.refId ?? null,
        refName: p.refName ?? null,
        sessionId: p.sessionId ?? null,
        setDetails: p.setDetails ?? null,
        createdAt: p.updatedAt,
        pending: true,
      }));
      const localIds = new Set(local.map((l) => l.id));
      const merged = [...local, ...remote.filter((r) => !localIds.has(r.id))];
      merged.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      setLogs(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Saves several logs (a whole session) and syncs once. Returns their ids, or null without a user. */
  const addLogs = async (inputs: WorkoutLogInput[]): Promise<string[] | null> => {
    if (inputs.length === 0) return [];
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return null;
      const today = localDateString();
      const ids: string[] = [];
      for (const { date, ...input } of inputs) {
        ids.push(await saveWorkoutLogOffline({ userId: user.id, date: date ?? today, ...input }));
      }
      if (navigator.onLine) await syncAll();
      await load();
      return ids;
    } finally {
      setSaving(false);
    }
  };
  /** Saves a log and returns its id, or null when there is no signed-in user. */
  const addLogWithId = async (input: WorkoutLogInput): Promise<string | null> => (await addLogs([input]))?.[0] ?? null;
  const addLog = async (input: WorkoutLogInput): Promise<boolean> => (await addLogWithId(input)) !== null;

  /** Deletes logs: locally when they never synced, otherwise from Supabase too. */
  const removeLogs = async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return true;
    try {
      const locals = await db.workoutLogs.filter((l) => ids.includes(l.remoteId)).toArray();
      const unsynced = new Set(locals.filter((l) => !l.synced).map((l) => l.remoteId));
      const remoteIds = ids.filter((id) => !unsynced.has(id));
      if (remoteIds.length) {
        const { error } = await supabase.from('workout_logs').delete().in('id', remoteIds);
        if (error) return false;
      }
      await db.workoutLogs.filter((l) => ids.includes(l.remoteId)).delete();
      await load();
      return true;
    } catch {
      return false;
    }
  };
  const removeLog = (id: string) => removeLogs([id]);

  return { logs, loading, saving, addLog, addLogs, addLogWithId, removeLog, removeLogs, reload: load };
}
