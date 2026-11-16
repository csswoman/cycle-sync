'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveWorkoutLogOffline, getUnsyncedWorkoutLogs } from '@/lib/offlineHelpers';
import { syncAll } from '@/hooks/useOfflineSync';

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
}

const HISTORY_LIMIT = 30;

/** Today as YYYY-MM-DD in the user's local timezone (toISOString would give the UTC date). */
export function localDateString(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function useWorkoutLogs() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
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
        pending: true,
      }));
      const localIds = new Set(local.map((l) => l.id));
      const merged = [...local, ...remote.filter((r) => !localIds.has(r.id))];
      merged.sort((a, b) => b.date.localeCompare(a.date));
      setLogs(merged.slice(0, HISTORY_LIMIT));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addLog = async (input: WorkoutLogInput): Promise<boolean> => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return false;
      await saveWorkoutLogOffline({ userId: user.id, date: localDateString(), ...input });
      if (navigator.onLine) await syncAll();
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { logs, loading, saving, addLog };
}
