'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { activePregnancy, type Pregnancy } from '@/lib/cycle/pregnancy';
import { toLocalISO } from '@/lib/medications/schedule';
/**
 * Pregnancy intervals. Fails soft: if the `pregnancies` table is not there yet the list is empty
 * and the app behaves as before.
 */
export function usePregnancies() {
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data, error } = await supabase.from('pregnancies').select('id,start_date,positive_test_date,end_date')
        .eq('user_id', user.id).order('start_date', { ascending: false });
      if (error) return;
      setPregnancies((data ?? []).map((r: any) => ({
        id: r.id,
        start_date: String(r.start_date).slice(0, 10),
        positive_test_date: r.positive_test_date ? String(r.positive_test_date).slice(0, 10) : null,
        end_date: r.end_date ? String(r.end_date).slice(0, 10) : null,
      })));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const today = toLocalISO(new Date());
  const active = useMemo(() => activePregnancy(pregnancies, today), [pregnancies, today]);
  /** Turns pregnancy mode on. `startDate` is usually the last period start. */
  const start = useCallback(async (startDate: string, positiveTestDate: string | null): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return false;
    const { error } = await supabase.from('pregnancies').insert({ user_id: user.id, start_date: startDate, positive_test_date: positiveTestDate });
    if (error) return false;
    await load();
    return true;
  }, [load]);
  /** Turns pregnancy mode off in one step. No outcome is asked or stored. */
  const end = useCallback(async (endDate: string): Promise<boolean> => {
    if (!active?.id) return false;
    const { error } = await supabase.from('pregnancies').update({ end_date: endDate < active.start_date ? active.start_date : endDate }).eq('id', active.id);
    if (error) return false;
    await load();
    return true;
  }, [active, load]);
  return { pregnancies, active, loading, start, end, reload: load };
}
