'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { PCOSSymptomEntry } from '@/types';

const SYMPTOM_KEYS = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'] as const;
type SymptomKey = (typeof SYMPTOM_KEYS)[number];

const ALERT_THRESHOLD = 2;
const ALERT_WINDOW_DAYS = 7;

export function usePCOSSymptoms() {
  const [entries, setEntries] = useState<PCOSSymptomEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<Partial<PCOSSymptomEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('pcos_symptoms')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    const all = (data as PCOSSymptomEntry[]) ?? [];
    setEntries(all);

    const today = new Date().toISOString().split('T')[0];
    const existing = all.find((e) => e.date === today);
    setTodayEntry(existing ?? { acne: 0, fatigue: 0, hirsutism: 0, hair_loss: 0, mood_swings: 0, bloating: 0 });
    setLoading(false);
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const saveToday = async (values: Record<SymptomKey, number>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];

      await supabase.from('pcos_symptoms').upsert({
        user_id: user.id,
        date: today,
        ...values,
      }, { onConflict: 'user_id,date' });

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
