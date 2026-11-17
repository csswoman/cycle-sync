'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveCycleSignOffline } from '@/lib/offlineHelpers';
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
    pregnancyTest: r.pregnancy_test ?? null,
    flow: r.flow ?? null,
    clots: !!r.clots,
    pain: r.pain != null ? Number(r.pain) : null,
  };
}

function isNetworkError(err: { message?: string } | null, offline: boolean): boolean {
  return offline || /fetch|network|failed to load/i.test(err?.message ?? '');
}
/**
 * Spotting, basal temperature, cervical mucus and sexual activity per day, from `fromDate` on.
 * Saves that fail because there is no connection are queued in the offline store and synced on reconnect.
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
      flow: sign.flow ?? null,
      clots: !!sign.clots,
      pain: sign.pain ?? null,
      updated_at: new Date().toISOString(),
    };
    let res = isEmptySign(sign)
      ? await supabase.from('cycle_signs').delete().eq('user_id', user.id).eq('date', sign.date)
      : await supabase.from('cycle_signs').upsert({ ...row, lh_test: sign.lhTest ?? null, pregnancy_test: sign.pregnancyTest ?? null }, { onConflict: 'user_id,date' });
    // lh_test and the flow columns come from later migrations; save the rest if they are not applied yet.
    if (res.error && /lh_test|pregnancy_test|flow|clots|pain/.test(res.error.message ?? '') && !isEmptySign(sign)) {
      const { flow: _f, clots: _c, pain: _p, ...older } = row;
      res = await supabase.from('cycle_signs').upsert(older, { onConflict: 'user_id,date' });
    }
    if (res.error && isNetworkError(res.error, typeof navigator !== 'undefined' && !navigator.onLine)) {
      try {
        await saveCycleSignOffline({
          userId: user.id,
          date: sign.date,
          spotting: sign.spotting,
          bbtCelsius: sign.bbtCelsius,
          bbtDisturbed: sign.bbtDisturbed,
          cervicalMucus: sign.cervicalMucus,
          sexCount: sign.sexCount,
          sexProtection: sign.sexProtection,
          notes: sign.notes,
          lhTest: sign.lhTest ?? null,
          pregnancyTest: sign.pregnancyTest ?? null,
          flow: sign.flow ?? null,
          clots: !!sign.clots,
          pain: sign.pain ?? null,
          deleted: isEmptySign(sign),
        });
        setError(null);
        return true;
      } catch (e) {
        console.error('Error queuing cycle sign offline:', e);
      }
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
