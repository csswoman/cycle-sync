'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { forecastNextPeriod, type PeriodForecast } from '@/lib/pmos/periodForecast';

export function usePeriodForecast() {
  const [forecast, setForecast] = useState<PeriodForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      const [periodsRes, configRes] = await Promise.all([
        supabase.from('periods').select('start_date').eq('user_id', user.id).order('start_date', { ascending: false }).limit(12),
        supabase.from('cycle_config').select('cycle_length,last_period_start').eq('user_id', user.id).maybeSingle(),
      ]);
      const starts = ((periodsRes.data as { start_date: string }[] | null) ?? []).map((p) => p.start_date);
      setForecast(forecastNextPeriod(starts, configRes.data?.cycle_length ?? null, configRes.data?.last_period_start ?? null));
      setLoading(false);
    }
    load();
  }, []);

  return { forecast, loading };
}
