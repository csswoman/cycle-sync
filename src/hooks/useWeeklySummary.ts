'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { computeCycleInfo } from '@/hooks/useCycleInfo';
import { addDays, parseISODate, toISODate } from '@/lib/planner/week';
import { buildWeeklySummary, type Adherence, type WeeklySummary } from '@/lib/summary/weekly';
import { phaseIsUnreliable } from '@/lib/today/dailyPlan';
import { usesHormonalContraception, type OnboardingAnswers } from '@/features/setup/onboarding';
import type { CycleConfig, Period } from '@/types';

/** Summary of the last 7 days built from the user's own logs. null while loading or when signed out. */
export function useWeeklySummary(language: 'en' | 'es') {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        const endDate = toISODate(new Date());
        const from = addDays(endDate, -13);
        const weekStart = addDays(endDate, -6);

        const [cfgRes, periodsRes, logsRes, mealsRes, workoutsRes, moveLogsRes, movePlanRes] = await Promise.all([
          supabase.from('cycle_config').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(30),
          // '*' so the check-in columns come along once their migration is applied.
          supabase.from('daily_logs').select('*').eq('user_id', userId).gte('date', from).lte('date', endDate),
          supabase.from('meal_plan_entries').select('done').eq('user_id', userId).gte('plan_date', weekStart).lte('plan_date', endDate),
          supabase.from('workout_plan_entries').select('done, kind').eq('user_id', userId).gte('plan_date', weekStart).lte('plan_date', endDate),
          supabase.from('workout_logs').select('date').eq('user_id', userId).gte('date', from).lte('date', endDate),
          supabase.from('workout_plan_entries').select('plan_date, kind').eq('user_id', userId).eq('done', true).gte('plan_date', from).lte('plan_date', endDate),
        ]);
        if (logsRes.error) throw logsRes.error;

        const config: CycleConfig = (cfgRes.data as CycleConfig | null) ?? {
          id: '', user_id: userId, cycle_length: 28, last_period_start: null,
          workout_prefs: [], dietary_prefs: [], archetype: null, created_at: '', updated_at: '',
        };
        const periods = (periodsRes.data ?? []) as Period[];
        const phaseOf = (date: string) => {
          const p = periods.find((x) => x.start_date.slice(0, 10) <= date);
          return computeCycleInfo(config, p ? [p] : [], parseISODate(date)).phase;
        };

        // Plan tables may not exist yet (migration not applied): then adherence is simply omitted.
        const meals = mealsRes.error ? [] : (mealsRes.data ?? []);
        const workouts = (workoutsRes.error ? [] : (workoutsRes.data ?? [])).filter((w: any) => w.kind !== 'rest');
        const adherence: Adherence = {
          mealsPlanned: meals.length,
          mealsDone: meals.filter((m: any) => m.done).length,
          workoutsPlanned: workouts.length,
          workoutsDone: workouts.filter((w: any) => w.done).length,
        };

        const moveDates = new Set<string>();
        for (const w of (moveLogsRes.error ? [] : moveLogsRes.data ?? []) as any[]) moveDates.add(String(w.date).slice(0, 10));
        for (const w of (movePlanRes.error ? [] : movePlanRes.data ?? []) as any[]) if (w.kind !== 'rest') moveDates.add(String(w.plan_date).slice(0, 10));
        const nowInfo = computeCycleInfo(config, periods, new Date());
        const answers = ((cfgRes.data as any)?.onboarding_answers ?? {}) as OnboardingAnswers;
        const phaseReliable = !phaseIsUnreliable({ ...nowInfo, hormonal: usesHormonalContraception(answers) });

        const result = buildWeeklySummary({
          logs: (logsRes.data ?? []).map((l: any) => ({
            date: String(l.date).slice(0, 10),
            energy: l.energy_level ?? null,
            sleepHours: l.sleep_hours != null ? Number(l.sleep_hours) : null,
            symptoms: l.symptoms ?? [],
            cravings: l.cravings ?? [],
          })),
          moveDates: Array.from(moveDates),
          phaseReliable,
          endDate,
          phaseOf,
          adherence,
          language,
        });
        if (!cancelled) setSummary(result);
      } catch (err) {
        console.error('Weekly summary error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return { summary, loading };
}
