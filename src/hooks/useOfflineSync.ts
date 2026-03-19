'use client';

import { useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/offlineDb';
import { supabase } from '@/lib/supabase';

async function syncDailyLogs() {
  const pending = await db.dailyLogs.where('synced').equals(0).toArray();
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

async function syncHabitLogs() {
  const pending = await db.habitLogs.where('synced').equals(0).toArray();
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

async function syncPCOSEntries() {
  const pending = await db.pcosEntries.where('synced').equals(0).toArray();
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

async function syncAll() {
  try {
    await Promise.all([syncDailyLogs(), syncHabitLogs(), syncPCOSEntries()]);
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
