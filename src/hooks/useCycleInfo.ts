'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { estimateCycle, parseLocalDate, toISODate } from '@/lib/cycle/cycleEngine';
import { predictionsPaused, type Pregnancy } from '@/lib/cycle/pregnancy';
import { usePregnancies } from '@/hooks/usePregnancies';
import { CyclePhase, type CycleInfo, type CycleConfig, type Period } from '@/types';

export function computeCycleInfo(config: CycleConfig, periods: Period[], now: Date = new Date(), pregnancies: Pregnancy[] = []): CycleInfo {
  const estimate = estimateCycle(periods, config.cycle_length, pregnancies);
  const cycleLength = estimate.cycleLength;

  let lastPeriodStart: Date | null = null;
  if (periods.length > 0) {
    // periods may arrive in any order; the latest start is the reference
    const latest = periods.map((p) => p.start_date.slice(0, 10)).sort().pop() as string;
    lastPeriodStart = parseLocalDate(latest);
  } else if (config.last_period_start) {
    lastPeriodStart = parseLocalDate(config.last_period_start);
  }

  if (!lastPeriodStart) {
    return { phase: CyclePhase.FOLLICULAR, cycleDay: 1, daysUntilNextPeriod: cycleLength, cycleLength };
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  lastPeriodStart.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  // A cycle only restarts when a new period is logged. Past the expected length the count keeps
  // growing and the period is late: with PMOS that is common, and restarting on our own would show
  // a menstrual phase with no bleeding. Dates before the reference period are projected backwards.
  const cycleDay = diffDays >= 0 ? diffDays + 1 : (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;
  const daysUntilNextPeriod = Math.max(0, cycleLength - cycleDay + 1);
  const paused = predictionsPaused(toISODate(lastPeriodStart), pregnancies, toISODate(today));
  const daysLate = paused ? 0 : Math.max(0, cycleDay - 1 - estimate.longestExpected);

  let phase: CyclePhase;
  if (cycleDay <= estimate.periodLength) {
    phase = CyclePhase.MENSTRUAL;
  } else if (cycleDay < estimate.ovulationDay) {
    phase = CyclePhase.FOLLICULAR;
  } else if (cycleDay <= estimate.ovulationDay + 1) {
    phase = CyclePhase.OVULATION;
  } else {
    phase = CyclePhase.LUTEAL;
  }

  return {
    phase,
    cycleDay,
    daysUntilNextPeriod,
    cycleLength,
    ovulationDay: estimate.ovulationDay,
    fertileStartDay: estimate.fertileStartDay,
    fertileEndDay: estimate.fertileEndDay,
    irregular: estimate.irregular,
    confidence: estimate.confidence,
    overdue: !paused && cycleDay > cycleLength,
    daysLate,
    paused,
  };
}

export function useCycleInfo() {
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { pregnancies, loading: pregLoading } = usePregnancies();
  const [base, setBase] = useState<{ config: CycleConfig; periods: Period[] } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [configRes, periodsRes] = await Promise.all([
        supabase.from('cycle_config').select('*').eq('user_id', user.id).single(),
        supabase.from('periods').select('*').eq('user_id', user.id).order('start_date', { ascending: false }).limit(12),
      ]);

      const config: CycleConfig = configRes.data ?? {
        id: '', user_id: user.id, cycle_length: 28, last_period_start: null,
        workout_prefs: [], dietary_prefs: [], archetype: null, created_at: '', updated_at: '',
      };
      const periods: Period[] = periodsRes.data ?? [];

      setBase({ config, periods });
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (base && !pregLoading) setCycleInfo(computeCycleInfo(base.config, base.periods, new Date(), pregnancies));
  }, [base, pregnancies, pregLoading]);

  return { cycleInfo, loading: loading || pregLoading };
}
