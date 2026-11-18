'use client';

import { useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/offlineDb';
import { supabase } from '@/lib/supabase';

async function syncDailyLogs(uid: string) {
  const pending = await db.dailyLogs.filter((r) => !r.synced && r.userId === uid).toArray();
  for (const log of pending) {
    const { error } = await supabase.from('daily_logs').upsert(
      {
        user_id: log.userId,
        date: log.date,
        mood: log.mood,
        energy_level: log.energyLevel,
        sleep_hours: log.sleepHours,
        sleep_quality: log.sleepQuality,
        symptoms: log.symptoms,
        notes: log.notes,
      },
      { onConflict: 'user_id,date' },
    );
    if (!error && log.id != null) {
      await db.dailyLogs.update(log.id, { synced: true });
    }
  }
}

async function syncHabitLogs(uid: string) {
  const pending = await db.habitLogs.filter((r) => !r.synced && r.userId === uid).toArray();
  for (const log of pending) {
    const { error } = await supabase.from('habit_logs').upsert(
      {
        user_id: log.userId,
        habit_id: log.habitId,
        date: log.date,
        value: log.value,
        completed: log.completed,
      },
      { onConflict: 'user_id,habit_id,date' },
    );
    if (!error && log.id != null) {
      await db.habitLogs.update(log.id, { synced: true });
    }
  }
}

async function syncPMOSEntries(uid: string) {
  const pending = await db.pcosEntries.filter((r) => !r.synced && r.userId === uid).toArray();
  for (const entry of pending) {
    const { error } = await supabase.from('pcos_symptoms').upsert(
      {
        user_id: entry.userId,
        date: entry.date,
        acne: entry.acne,
        fatigue: entry.fatigue,
        hirsutism: entry.hirsutism,
        hair_loss: entry.hairLoss,
        mood_swings: entry.moodSwings,
        bloating: entry.bloating,
      },
      { onConflict: 'user_id,date' },
    );
    if (!error && entry.id != null) {
      await db.pcosEntries.update(entry.id, { synced: true });
    }
  }
}

async function syncWorkoutLogs(uid: string) {
  const pending = await db.workoutLogs.filter((r) => !r.synced && r.userId === uid).toArray();
  for (const log of pending) {
    const { error } = await supabase.from('workout_logs').upsert(
      {
        id: log.remoteId,
        user_id: log.userId,
        date: log.date,
        exercise: log.exercise,
        sets: log.sets,
        weight_kg: log.weightKg,
        duration_minutes: log.durationMinutes,
        feeling: log.feeling,
        notes: log.notes,
        phase: log.phase,
      },
      { onConflict: 'id' },
    );
    if (!error && log.id != null) {
      await db.workoutLogs.update(log.id, { synced: true });
    }
  }
}
async function syncCycleSigns(uid: string) {
  const pending = await db.cycleSigns.filter((r) => !r.synced && r.userId === uid).toArray();
  for (const sign of pending) {
    const base = {
      user_id: sign.userId,
      date: sign.date,
      spotting: sign.spotting,
      bbt_celsius: sign.bbtCelsius,
      bbt_disturbed: sign.bbtDisturbed,
      cervical_mucus: sign.cervicalMucus,
      sex_count: sign.sexCount,
      sex_protection: sign.sexCount > 0 ? sign.sexProtection : null,
      notes: sign.notes,
      flow: sign.flow,
      clots: sign.clots,
      pain: sign.pain,
      updated_at: sign.updatedAt,
    };
    let res = sign.deleted
      ? await supabase.from('cycle_signs').delete().eq('user_id', sign.userId).eq('date', sign.date)
      : await supabase.from('cycle_signs').upsert({ ...base, lh_test: sign.lhTest, pregnancy_test: sign.pregnancyTest ?? null }, { onConflict: 'user_id,date' });
    // lh_test and the flow columns come from later migrations; save the rest if they are not applied yet.
    if (res.error && /lh_test|pregnancy_test|flow|clots|pain/.test(res.error.message ?? '') && !sign.deleted) {
      const { flow: _f, clots: _c, pain: _p, ...older } = base;
      res = await supabase.from('cycle_signs').upsert(older, { onConflict: 'user_id,date' });
    }
    if (!res.error && sign.id != null) {
      await db.cycleSigns.update(sign.id, { synced: true });
    }
  }
}
export async function syncAll() {
  try {
    // Only the signed-in user's rows: RLS rejects other users' rows and they would retry forever.
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return;
    await Promise.all([syncDailyLogs(uid), syncHabitLogs(uid), syncPMOSEntries(uid), syncWorkoutLogs(uid), syncCycleSigns(uid)]);
  } catch {
    // Will retry on next online event
  }
}

export function useOfflineSync() {
  const syncingRef = useRef(false);

  const handleSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      await syncAll();
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleSync);

    if (navigator.onLine) {
      handleSync();
    }

    return () => {
      window.removeEventListener('online', handleSync);
    };
  }, [handleSync]);
}
