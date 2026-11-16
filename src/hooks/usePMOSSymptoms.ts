'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { savePMOSEntryOffline, getUnsyncedPMOSEntries } from '@/lib/offlineHelpers';
import { syncAll } from '@/hooks/useOfflineSync';
import type { PMOSSymptomEntry } from '@/types';
import { toISODate } from '@/lib/cycle/cycleEngine';

const SYMPTOM_KEYS = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'] as const;
type SymptomKey = (typeof SYMPTOM_KEYS)[number];

const ALERT_THRESHOLD = 2;
const ALERT_WINDOW_DAYS = 7;

export function usePMOSSymptoms() {
  const [entries, setEntries] = useState<PMOSSymptomEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<Partial<PMOSSymptomEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = toISODate(thirtyDaysAgo);
    try {
      const { data, error } = await supabase
        .from('pcos_symptoms')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .order('date', { ascending: true });
      let all = error ? [] : ((data as PMOSSymptomEntry[]) ?? []);
      // Overlay entries saved locally that have not reached Supabase yet.
      const pending = await getUnsyncedPMOSEntries(user.id, fromDate);
      all = all.filter((e) => !pending.some((p) => p.date === e.date));
      for (const p of pending) {
        all.push({
          id: `local-${p.id}`, user_id: p.userId, date: p.date, acne: p.acne, fatigue: p.fatigue,
          hirsutism: p.hirsutism, hair_loss: p.hairLoss, mood_swings: p.moodSwings, bloating: p.bloating,
        });
      }
      all.sort((a, b) => a.date.localeCompare(b.date));
      setEntries(all);
      const today = toISODate(new Date());
      const existing = all.find((e) => e.date === today);
      setTodayEntry(existing ?? { acne: 0, fatigue: 0, hirsutism: 0, hair_loss: 0, mood_swings: 0, bloating: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const saveToday = async (values: Record<SymptomKey, number>) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const today = toISODate(new Date());
      await savePMOSEntryOffline({
        userId: user.id,
        date: today,
        acne: values.acne,
        fatigue: values.fatigue,
        hirsutism: values.hirsutism,
        hairLoss: values.hair_loss,
        moodSwings: values.mood_swings,
        bloating: values.bloating,
      });
      if (navigator.onLine) await syncAll();
      await loadEntries();
    } finally {
      setSaving(false);
    }
  };

  const alerts: string[] = (() => {
    if (entries.length < ALERT_WINDOW_DAYS) return [];
    const recent = entries.slice(-ALERT_WINDOW_DAYS);
    const result: string[] = [];

    for (const key of SYMPTOM_KEYS) {
      const avg = recent.reduce((sum, e) => sum + (e[key] ?? 0), 0) / recent.length;
      if (avg >= ALERT_THRESHOLD) {
        result.push(key);
      }
    }
    return result;
  })();

  return { entries, todayEntry, loading, saving, saveToday, alerts, SYMPTOM_KEYS };
}
