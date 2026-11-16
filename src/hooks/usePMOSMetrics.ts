'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GlucoseContext, PMOSMetricEntry } from '@/lib/pmos/metrics';

export type NewMetricEntry = Partial<Omit<PMOSMetricEntry, 'id' | 'user_id'>> & { date: string };

/** Body and metabolic readings for the signed-in user. Online only. */
export function usePMOSMetrics() {
  const [entries, setEntries] = useState<PMOSMetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('pmos_metrics')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
    if (err) setError(err.message);
    else setEntries((data as PMOSMetricEntry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (entry: NewMetricEntry & { glucose_context?: GlucoseContext | null }) => {
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;
      const { error: err } = await supabase.from('pmos_metrics').insert({ ...entry, user_id: session.user.id });
      if (err) { setError(err.message); return false; }
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from('pmos_metrics').delete().eq('id', id);
    if (err) setError(err.message);
    else setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, loading, saving, error, add, remove };
}
