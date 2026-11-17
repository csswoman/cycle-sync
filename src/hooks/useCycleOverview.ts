'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { computeCycleInfo } from '@/hooks/useCycleInfo';
import {
  estimateCycle, projectCycles, parseLocalDate, daysBetween, addDays, toISODate,
  type CycleEstimate, type CycleProjection,
} from '@/lib/cycle/cycleEngine';
import { cycleHealthFlags, type CycleFlag } from '@/lib/cycle/cycleAnalysis';
import { predictionsPaused, type Pregnancy } from '@/lib/cycle/pregnancy';
import { usePregnancies } from '@/hooks/usePregnancies';
import type { OnboardingAnswers } from '@/features/setup/onboarding';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
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
  /** Active pregnancy, if any. */
  pregnancy: Pregnancy | null;
  /** True during a pregnancy and until a period is logged after it: no predictions or phase advice. */
  paused: boolean;
  /** Date of the last period start (YYYY-MM-DD), used as the default start of a pregnancy. */
  lastPeriodStart: string | null;
  /** Leaves pregnancy mode (sets the end date) and refreshes the overview. */
  endPregnancy: (endDate: string) => Promise<boolean>;
  answers: OnboardingAnswers;
  loading: boolean;
}

/** Single source for the dashboard: cycle phase, countdowns and the user's questionnaire answers. */
export function useCycleOverview(): CycleOverview {
  const [config, setConfig] = useState<CycleConfig | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const answers = useOnboardingAnswers();
  const { pregnancies, active: pregnancy, loading: pregLoading, end: endPregnancy } = usePregnancies();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      setLoading(false);
    })();
  }, []);

  return useMemo(() => {
    const hasHistory = periods.length > 0 || !!config?.last_period_start;
    if (!hasHistory) {
      return { info: null, estimate: null, next: null, daysToPeriod: null, daysLate: 0, flags: [], daysToOvulation: null, hasHistory, pregnancy, paused: !!pregnancy, lastPeriodStart: null, endPregnancy, answers, loading: loading || pregLoading };
    }
    const cfg: CycleConfig = config ?? {
      id: '', user_id: '', cycle_length: 28, last_period_start: null,
      workout_prefs: [], dietary_prefs: [], archetype: null, created_at: '', updated_at: '',
    };
    const info = computeCycleInfo(cfg, periods, new Date(), pregnancies);
    const estimate = estimateCycle(periods, cfg.cycle_length, pregnancies);
    const lastStart = periods.length
      ? periods.map((p) => p.start_date.slice(0, 10)).sort().pop() as string
      : (cfg.last_period_start as string);
    const next = projectCycles(lastStart, estimate, 1)[0] ?? null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysToPeriod = next ? daysBetween(today, next.periodStart) : null;
    const ovulationThisCycle = addDays(parseLocalDate(lastStart), estimate.ovulationDay - 1);
    const daysToOvulation = daysBetween(today, ovulationThisCycle);
    const flags = cycleHealthFlags(periods.length ? periods : [{ start_date: lastStart }], now, [], pregnancies);
    const paused = predictionsPaused(lastStart, pregnancies, toISODate(today));
    return {
      info, estimate, next: paused ? null : next, daysToPeriod: paused ? null : daysToPeriod, daysLate: info.daysLate ?? 0, flags,
      daysToOvulation: paused ? null : daysToOvulation, hasHistory, pregnancy, paused, lastPeriodStart: lastStart, endPregnancy, answers, loading: loading || pregLoading,
    };
  }, [config, periods, answers, loading, pregnancies, pregnancy, pregLoading, endPregnancy]);
}
