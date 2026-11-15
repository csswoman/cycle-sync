'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveHabitLogOffline, getUnsyncedHabitLogs } from '@/lib/offlineHelpers';
import { syncAll } from '@/hooks/useOfflineSync';
import type { Habit, HabitLog } from '@/types';

const DEFAULT_HABITS: Omit<Habit, 'id' | 'user_id'>[] = [
  { name: 'Water Intake', type: 'water', goal: 8, unit: 'glasses', active: true },
  { name: 'Sleep', type: 'sleep', goal: 8, unit: 'hours', active: true },
  { name: 'Mindfulness', type: 'mindfulness', goal: 10, unit: 'minutes', active: true },
];

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLogs, setWeekLogs] = useState<HabitLog[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    try {
      const [habitsRes, weekRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('active', true).order('created_at'),
        supabase.from('habit_logs').select('*').eq('user_id', user.id)
          .gte('date', weekStart)
          .order('date', { ascending: true }),
      ]);
      if (!habitsRes.error) {
        let userHabits = (habitsRes.data as Habit[]) ?? [];
        if (userHabits.length === 0) {
          const inserts = DEFAULT_HABITS.map((h) => ({ ...h, user_id: user.id }));
          const { data: created } = await supabase.from('habits').insert(inserts).select();
          userHabits = (created as Habit[]) ?? [];
        }
        setHabits(userHabits);
      }
      const remoteWeek = weekRes.error ? [] : ((weekRes.data as HabitLog[]) ?? []);
      // Overlay logs saved locally that have not reached Supabase yet.
      const pending = await getUnsyncedHabitLogs(user.id, weekStart);
      const merged = remoteWeek.filter(
        (r) => !pending.some((p) => p.habitId === r.habit_id && p.date === r.date),
      );
      for (const p of pending) {
        merged.push({
          id: `local-${p.id}`, user_id: p.userId, habit_id: p.habitId,
          date: p.date, value: p.value, completed: p.completed,
        });
      }
      setWeekLogs(merged);
      setTodayLogs(merged.filter((l) => l.date === today));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const logHabit = async (habitId: string, value: number, completed: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    await saveHabitLogOffline({ userId: user.id, habitId, date: today, value, completed });
    if (navigator.onLine) await syncAll();
    await loadData();
  };

  const addCustomHabit = async (name: string, goal: number, unit: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('habits').insert({
      user_id: user.id,
      name,
      type: 'custom',
      goal,
      unit,
      active: true,
    });

    await loadData();
  };

  const getLogForHabit = (habitId: string): HabitLog | undefined => {
    return todayLogs.find((l) => l.habit_id === habitId);
  };

  const dailyProgress = (() => {
    if (habits.length === 0) return 0;
    const completed = habits.filter((h) => {
      const log = getLogForHabit(h.id);
      return log?.completed;
    }).length;
    return Math.round((completed / habits.length) * 100);
  })();

  const getStreak = (habitId: string): number => {
    const habitWeekLogs = weekLogs
      .filter((l) => l.habit_id === habitId && l.completed)
      .map((l) => l.date)
      .sort()
      .reverse();

    if (habitWeekLogs.length === 0) return 0;

    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().split('T')[0];
      if (habitWeekLogs.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  return { habits, todayLogs, loading, logHabit, addCustomHabit, getLogForHabit, dailyProgress, getStreak, weekLogs };
}
