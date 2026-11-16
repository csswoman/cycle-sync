'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LabMarker } from '@/lib/pmos/metrics';

export interface LabResult {
  id: string;
  user_id: string;
  date: string;
  marker: LabMarker;
  value: number;
  source?: 'manual' | 'scan';
}

/** Lab results for the signed-in user. Online only. */
export function useLabResults() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true });
    if (err) setError(err.message);
    else setResults(((data as LabResult[]) ?? []).map((r) => ({ ...r, value: Number(r.value) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (marker: LabMarker, value: number, date: string) => {
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;
      const { error: err } = await supabase.from('lab_results').insert({ user_id: session.user.id, marker, value, date });
      if (err) { setError(err.message); return false; }
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  };

  /** Saves several confirmed rows at once, marked as read from a scanned file. */
  const addMany = async (rows: { marker: LabMarker; value: number; date: string }[]) => {
    if (rows.length === 0) return true;
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;
      const { error: err } = await supabase.from('lab_results').insert(
        rows.map((r) => ({ user_id: session.user.id, marker: r.marker, value: r.value, date: r.date, source: 'scan' })),
      );
      if (err) { setError(err.message); return false; }
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    const { error: err } = await supabase.from('lab_results').delete().eq('id', id);
    if (err) setError(err.message);
    else setResults((prev) => prev.filter((r) => r.id !== id));
  };

  return { results, loading, saving, error, add, addMany, remove };
}
