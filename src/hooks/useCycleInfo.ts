'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { estimateCycle, parseLocalDate } from '@/lib/cycle/cycleEngine';
import { CyclePhase, type CycleInfo, type CycleConfig, type Period } from '@/types';

export function computeCycleInfo(config: CycleConfig, periods: Period[], now: Date = new Date()): CycleInfo {
  const estimate = estimateCycle(periods, config.cycle_length);
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

  const diffDays = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;
  const daysUntilNextPeriod = cycleLength - cycleDay + 1;

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
  };
}

export function useCycleInfo() {
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

      setCycleInfo(computeCycleInfo(config, periods));
      setLoading(false);
    }
    load();
  }, []);

  return { cycleInfo, loading };
}
