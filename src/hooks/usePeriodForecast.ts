'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePregnancies } from '@/hooks/usePregnancies';
import { forecastNextPeriod, type PeriodForecast } from '@/lib/pmos/periodForecast';
export function usePeriodForecast() {
  const [forecast, setForecast] = useState<PeriodForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const { pregnancies, loading: pregLoading } = usePregnancies();
  const [base, setBase] = useState<{ starts: string[]; length: number | null; last: string | null } | null>(null);
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
      setBase({ starts, length: configRes.data?.cycle_length ?? null, last: configRes.data?.last_period_start ?? null });
      setLoading(false);
    }
    load();
  }, []);
  useEffect(() => {
    if (base && !pregLoading) setForecast(forecastNextPeriod(base.starts, base.length, base.last, new Date(), pregnancies));
  }, [base, pregnancies, pregLoading]);
  return { forecast, loading: loading || pregLoading };
}
