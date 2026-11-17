'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface BodyProfile {
  heightCm: number | null;
  startWeightKg: number | null;
  /** YYYY-MM-DD */
  startDate: string | null;
}

const EMPTY: BodyProfile = { heightCm: null, startWeightKg: null, startDate: null };

const isMissingColumn = (err: { code?: string } | null) => err?.code === '42703' || err?.code === 'PGRST204';

const num = (v: unknown): number | null => {
  const n = Number(v);
  return v != null && Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Height and starting weight, stored on `cycle_config`.
 * `available` is false when the migration is not applied yet; the page then
 * keeps working with local values only.
 */
export function useBodyProfile() {
  const [profile, setProfile] = useState<BodyProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        if (live) setSignedIn(true);
        const { data, error } = await supabase
          .from('cycle_config')
          .select('height_cm, start_weight_kg, start_date')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (!live) return;
        if (error) { if (isMissingColumn(error)) setAvailable(false); return; }
        const row = data as { height_cm?: unknown; start_weight_kg?: unknown; start_date?: string | null } | null;
        if (row) setProfile({ heightCm: num(row.height_cm), startWeightKg: num(row.start_weight_kg), startDate: row.start_date ?? null });
      } catch {
        // Offline: keep local values.
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const save = useCallback(async (patch: Partial<BodyProfile>): Promise<boolean> => {
    setProfile((prev) => ({ ...prev, ...patch }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;
      const row: Record<string, unknown> = { user_id: session.user.id, updated_at: new Date().toISOString() };
      if ('heightCm' in patch) row.height_cm = patch.heightCm;
      if ('startWeightKg' in patch) row.start_weight_kg = patch.startWeightKg;
      if ('startDate' in patch) row.start_date = patch.startDate;
      const { error } = await supabase.from('cycle_config').upsert(row, { onConflict: 'user_id' });
      if (error) {
        if (isMissingColumn(error)) setAvailable(false);
        console.warn('body profile not saved:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { profile, loading, available, signedIn, save };
}
