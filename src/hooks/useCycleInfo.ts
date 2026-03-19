'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CyclePhase, type CycleInfo, type CycleConfig, type Period } from '@/types';

function computeCycleInfo(config: CycleConfig, periods: Period[]): CycleInfo {
  const cycleLength = config.cycle_length || 28;

  let lastPeriodStart: Date | null = null;
  if (periods.length > 0) {
    lastPeriodStart = new Date(periods[0].start_date);
  } else if (config.last_period_start) {
    lastPeriodStart = new Date(config.last_period_start);
  }

  if (!lastPeriodStart) {
    return { phase: CyclePhase.FOLLICULAR, cycleDay: 1, daysUntilNextPeriod: cycleLength, cycleLength };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastPeriodStart.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - lastPeriodStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const cycleDay = (diffDays % cycleLength) + 1;
  const daysUntilNextPeriod = cycleLength - cycleDay + 1;

  let phase: CyclePhase;
  if (cycleDay <= 5) {
    phase = CyclePhase.MENSTRUAL;
  } else if (cycleDay <= Math.floor(cycleLength * 0.5) - 1) {
    phase = CyclePhase.FOLLICULAR;
  } else if (cycleDay <= Math.floor(cycleLength * 0.5) + 1) {
    phase = CyclePhase.OVULATION;
  } else {
    phase = CyclePhase.LUTEAL;
  }

  return { phase, cycleDay, daysUntilNextPeriod, cycleLength };
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
        supabase.from('periods').select('*').eq('user_id', user.id).order('start_date', { ascending: false }).limit(1),
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
