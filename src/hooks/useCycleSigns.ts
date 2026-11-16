'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { emptySign, isEmptySign, type CycleSign } from '@/lib/cycle/fertilitySigns';

function fromRow(r: any): CycleSign {
  return {
    date: String(r.date).slice(0, 10),
    spotting: !!r.spotting,
    bbtCelsius: r.bbt_celsius != null ? Number(r.bbt_celsius) : null,
    bbtDisturbed: !!r.bbt_disturbed,
    cervicalMucus: r.cervical_mucus ?? null,
    sexCount: r.sex_count ?? 0,
    sexProtection: r.sex_protection ?? null,
    notes: r.notes ?? null,
    lhTest: r.lh_test ?? null,
  };
}

/**
 * Spotting, basal temperature, cervical mucus and sexual activity per day, from `fromDate` on.
 * Online only for now: unlike the daily log these rows are not queued in the offline store.
 */
export function useCycleSigns(fromDate: string) {
  const [signs, setSigns] = useState<CycleSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data, error: err } = await supabase
        .from('cycle_signs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .order('date', { ascending: true });
      if (err) throw err;
      setSigns((data ?? []).map(fromRow));
      setError(null);
    } catch (err: any) {
      console.error('Error loading cycle signs:', err);
      // Most likely the migration has not been applied yet.
      setError(err?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [fromDate]);

  useEffect(() => { load(); }, [load]);

  const signFor = useCallback(
    (date: string) => signs.find((s) => s.date === date) ?? emptySign(date),
    [signs],
  );

  /** Saves the whole day. An empty day is deleted so the table only holds real entries. */
  const saveSign = useCallback(async (sign: CycleSign): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return false;
    const previous = signs;
    // Optimistic update so calendar taps feel instant.
    setSigns((prev) => {
      const rest = prev.filter((s) => s.date !== sign.date);
      return isEmptySign(sign) ? rest : [...rest, sign].sort((a, b) => a.date.localeCompare(b.date));
    });
    const row = {
      user_id: user.id,
      date: sign.date,
      spotting: sign.spotting,
      bbt_celsius: sign.bbtCelsius,
      bbt_disturbed: sign.bbtDisturbed,
      cervical_mucus: sign.cervicalMucus,
      sex_count: sign.sexCount,
      sex_protection: sign.sexCount > 0 ? sign.sexProtection : null,
      notes: sign.notes,
      updated_at: new Date().toISOString(),
    };
    let res = isEmptySign(sign)
      ? await supabase.from('cycle_signs').delete().eq('user_id', user.id).eq('date', sign.date)
      : await supabase.from('cycle_signs').upsert({ ...row, lh_test: sign.lhTest ?? null }, { onConflict: 'user_id,date' });
    // lh_test comes from a later migration; save the rest if it is not applied yet.
    if (res.error && /lh_test/.test(res.error.message ?? '') && !isEmptySign(sign)) {
      res = await supabase.from('cycle_signs').upsert(row, { onConflict: 'user_id,date' });
    }
    if (res.error) {
      console.error('Error saving cycle sign:', res.error);
      setSigns(previous);
      setError(res.error.message);
      return false;
    }
    setError(null);
    return true;
  }, [signs]);

  return { signs, loading, error, signFor, saveSign, reload: load };
}
