'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { computeCycleInfo } from '@/hooks/useCycleInfo';
import {
  estimateCycle, projectCycles, parseLocalDate, daysBetween, addDays,
  type CycleEstimate, type CycleProjection,
} from '@/lib/cycle/cycleEngine';
import { cycleHealthFlags, type CycleFlag } from '@/lib/cycle/cycleAnalysis';
import { loadOnboardingAnswers, type OnboardingAnswers } from '@/features/setup/onboarding';
import type { CycleConfig, CycleInfo, Period } from '@/types';

export interface CycleOverview {
  info: CycleInfo | null;
  estimate: CycleEstimate | null;
  /** Next cycle: expected period, ovulation and fertile window. */
  next: CycleProjection | null;
  /** Whole days until the most likely period date (negative once that date has passed). */
  daysToPeriod: number | null;
  /** Days past the end of the expected range without a new period; 0 while inside it. */
  daysLate: number;
  /** Patterns in the period log worth raising with a clinician. */
  flags: CycleFlag[];
  /** Whole days until ovulation (negative once passed in this cycle), null without data. */
  daysToOvulation: number | null;
  hasHistory: boolean;
  answers: OnboardingAnswers;
  loading: boolean;
}

/** Single source for the dashboard: cycle phase, countdowns and the user's questionnaire answers. */
export function useCycleOverview(): CycleOverview {
  const [config, setConfig] = useState<CycleConfig | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAnswers(loadOnboardingAnswers());
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      const [configRes, periodsRes] = await Promise.all([
        supabase.from('cycle_config').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('periods').select('*').eq('user_id', user.id).order('start_date', { ascending: false }).limit(12),
      ]);
      setConfig(configRes.data as CycleConfig | null);
      setPeriods((periodsRes.data as Period[]) ?? []);
      const remote = (configRes.data as { onboarding_answers?: OnboardingAnswers } | null)?.onboarding_answers;
      if (remote) setAnswers(remote);
      setLoading(false);
    })();
  }, []);

  return useMemo(() => {
    const hasHistory = periods.length > 0 || !!config?.last_period_start;
    if (!hasHistory) {
      return { info: null, estimate: null, next: null, daysToPeriod: null, daysLate: 0, flags: [], daysToOvulation: null, hasHistory, answers, loading };
    }
    const cfg: CycleConfig = config ?? {
      id: '', user_id: '', cycle_length: 28, last_period_start: null,
      workout_prefs: [], dietary_prefs: [], archetype: null, created_at: '', updated_at: '',
    };
    const info = computeCycleInfo(cfg, periods);
    const estimate = estimateCycle(periods, cfg.cycle_length);
    const lastStart = periods.length
      ? periods.map((p) => p.start_date.slice(0, 10)).sort().pop() as string
      : (cfg.last_period_start as string);
    const next = projectCycles(lastStart, estimate, 1)[0] ?? null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysToPeriod = next ? daysBetween(today, next.periodStart) : null;
    const ovulationThisCycle = addDays(parseLocalDate(lastStart), estimate.ovulationDay - 1);
    const daysToOvulation = daysBetween(today, ovulationThisCycle);
    const flags = cycleHealthFlags(periods.length ? periods : [{ start_date: lastStart }], now);
    return { info, estimate, next, daysToPeriod, daysLate: info.daysLate ?? 0, flags, daysToOvulation, hasHistory, answers, loading };
  }, [config, periods, answers, loading]);
}
