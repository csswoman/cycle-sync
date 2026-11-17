'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toLocalISO } from '@/lib/medications/schedule';
import type { Medication, MedicationLog } from '@/hooks/useMedications';
import type { CycleSign } from '@/lib/cycle/fertilitySigns';
import { usesHormonalContraception } from '@/features/setup/onboarding';
import { useOnboardingAnswers } from '@/hooks/useOnboardingAnswers';
import type { Pregnancy } from '@/lib/cycle/pregnancy';
import type { MealGlucoseReading } from '@/lib/pmos/mealGlucose';

const SYMPTOM_KEYS = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'] as const;

export interface PMOSOverviewData {
  today: string;
  periodStarts: string[];
  /** Periods with their end date, for bleeding-intensity checks. */
  periodRuns: { start_date: string; end_date: string | null }[];
  medications: Medication[];
  medLogs: MedicationLog[];
  symptomTotals: { date: string; total: number }[];
  fastingGlucose: { date: string; value: number }[];
  bloodPressureDates: string[];
  labs: { date: string; marker: string; value: number }[];
  dailyLogs: { date: string; sleep_hours: number | null; energy_level: number | null; symptoms: string[] | null }[];
  signs: CycleSign[];
  /** Post-meal readings with their meal; [] when the meal columns do not exist yet. */
  mealReadings: MealGlucoseReading[];
  /** Dates with a logged workout (last 120 days). */
  workoutDates: string[];
  healthData: { date: string; steps: number | null; sleep_duration_seconds: number | null }[];
  acne: { date: string; value: number }[];
  hirsutism: { date: string; total: number }[];
  waist: { date: string; value: number }[];
  doseChanges: { medication_id: string; date: string; dose: string; weeks: number }[];
  sideEffects: { medication_id: string; date: string; effect: string; severity: number }[];
  hormonal: boolean;
  /** Pregnancy intervals ([] when the table does not exist yet). */
  pregnancies: Pregnancy[];
  /** Questionnaire goal; 'fertility' is the "trying to conceive" mode. */
  goal: string | null;
}
type LoadedData = Omit<PMOSOverviewData, 'hormonal' | 'goal'>;

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toLocalISO(d); };

/**
 * Everything the PMOS overview cards need, loaded once. Each query fails soft so a missing
 * table (migration not applied yet) only hides the card that depends on it.
 */
export function usePMOSOverview() {
  const [loaded, setLoaded] = useState<LoadedData | null>(null);
  const answers = useOnboardingAnswers();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      const uid = user.id;
      const rows = async <T,>(q: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> => {
        const { data: d, error } = await q;
        return error ? [] : ((d as T[]) ?? []);
      };
      const [periods, config, meds, logs, symptoms, metrics, labs, daily, signs, mealRows, workouts, health, hirsutism, sideEffects, doseChanges, pregnancies] = await Promise.all([
        rows<{ start_date: string; end_date?: string | null }>(supabase.from('periods').select('start_date,end_date').eq('user_id', uid).order('start_date', { ascending: false }).limit(36)),
        rows<{ last_period_start: string | null }>(supabase.from('cycle_config').select('last_period_start').eq('user_id', uid).limit(1)),
        rows<Medication>(supabase.from('medications').select('*').eq('user_id', uid).order('created_at')),
        rows<MedicationLog>(supabase.from('medication_logs').select('*').eq('user_id', uid).gte('date', daysAgo(180))),
        rows<Record<string, number | string>>(supabase.from('pcos_symptoms').select('*').eq('user_id', uid).gte('date', daysAgo(400))),
        rows<{ date: string; glucose_mg_dl: number | null; glucose_context: string | null; systolic?: number | null; waist_cm?: number | null }>(
          supabase.from('pmos_metrics').select('*').eq('user_id', uid)),
        rows<{ date: string; marker: string; value: number }>(supabase.from('lab_results').select('date,marker,value').eq('user_id', uid)),
        rows<PMOSOverviewData['dailyLogs'][number]>(
          supabase.from('daily_logs').select('date,sleep_hours,energy_level,symptoms').eq('user_id', uid).gte('date', daysAgo(120))),
        rows<Record<string, unknown>>(supabase.from('cycle_signs').select('*').eq('user_id', uid).gte('date', daysAgo(220))),
        // Names the new columns on purpose: if the migration is missing this errors and rows() returns [].
        rows<{ glucose_mg_dl: number | null; meal_label: string | null; meal_slot: MealGlucoseReading['mealSlot']; minutes_after_meal: 60 | 120 | null }>(
          supabase.from('pmos_metrics').select('glucose_mg_dl,meal_label,meal_slot,minutes_after_meal')
            .eq('user_id', uid).eq('glucose_context', 'post_meal').not('glucose_mg_dl', 'is', null)),
        rows<{ date: string }>(supabase.from('workout_logs').select('date').eq('user_id', uid).gte('date', daysAgo(120))),
        rows<PMOSOverviewData['healthData'][number]>(
          supabase.from('health_data').select('date,steps,sleep_duration_seconds').eq('user_id', uid).gte('date', daysAgo(120))),
        rows<{ date: string; total: number }>(supabase.from('hirsutism_scores').select('date,total').eq('user_id', uid)),
        rows<PMOSOverviewData['sideEffects'][number]>(supabase.from('medication_side_effects').select('medication_id,date,effect,severity').eq('user_id', uid)),
        rows<PMOSOverviewData['doseChanges'][number]>(supabase.from('medication_dose_changes').select('medication_id,date,dose,weeks').eq('user_id', uid)),
        rows<{ id: string; start_date: string; positive_test_date: string | null; end_date: string | null }>(
          supabase.from('pregnancies').select('id,start_date,positive_test_date,end_date').eq('user_id', uid)),
      ]);
      const starts = periods.map((p) => p.start_date.slice(0, 10));
      const configStart = config[0]?.last_period_start?.slice(0, 10);
      if (configStart && !starts.includes(configStart)) starts.push(configStart);

      setLoaded({
        today: toLocalISO(new Date()),
        periodStarts: starts.sort(),
        periodRuns: periods.map((p) => ({ start_date: p.start_date.slice(0, 10), end_date: p.end_date ? p.end_date.slice(0, 10) : null })),
        pregnancies: pregnancies.map((p) => ({
          id: p.id, start_date: String(p.start_date).slice(0, 10),
          positive_test_date: p.positive_test_date ? String(p.positive_test_date).slice(0, 10) : null,
          end_date: p.end_date ? String(p.end_date).slice(0, 10) : null,
        })),
        medications: meds,
        medLogs: logs,
        symptomTotals: symptoms.map((s) => ({
          date: String(s.date).slice(0, 10),
          total: SYMPTOM_KEYS.reduce((sum, k) => sum + (Number(s[k]) || 0), 0),
        })),
        fastingGlucose: metrics
          .filter((m) => m.glucose_context === 'fasting' && m.glucose_mg_dl != null)
          .map((m) => ({ date: m.date, value: Number(m.glucose_mg_dl) }))
          .concat(labs.filter((l) => l.marker === 'fasting_glucose').map((l) => ({ date: l.date, value: Number(l.value) }))),
        bloodPressureDates: metrics.filter((m) => m.systolic != null).map((m) => m.date),
        labs: labs.map((l) => ({ ...l, value: Number(l.value) })),
        dailyLogs: daily,
        doseChanges: doseChanges.map((c) => ({ ...c, date: String(c.date).slice(0, 10), weeks: Number(c.weeks) })),
        sideEffects: sideEffects.map((e) => ({ ...e, date: String(e.date).slice(0, 10) })),
        workoutDates: [...new Set(workouts.map((w) => String(w.date).slice(0, 10)))],
        healthData: health.map((h) => ({ ...h, date: String(h.date).slice(0, 10) })),
        acne: symptoms.map((x) => ({ date: String(x.date).slice(0, 10), value: Number(x.acne) || 0 })),
        hirsutism: hirsutism.map((h) => ({ date: String(h.date).slice(0, 10), total: Number(h.total) })),
        waist: metrics.filter((m) => m.waist_cm != null).map((m) => ({ date: String(m.date).slice(0, 10), value: Number(m.waist_cm) })),
        mealReadings: mealRows.map((m) => ({
          glucose: Number(m.glucose_mg_dl),
          mealLabel: m.meal_label,
          mealSlot: m.meal_slot,
          minutesAfterMeal: m.minutes_after_meal,
        })),
        signs: signs.map((r) => ({
          date: String(r.date).slice(0, 10),
          spotting: !!r.spotting,
          bbtCelsius: r.bbt_celsius != null ? Number(r.bbt_celsius) : null,
          bbtDisturbed: !!r.bbt_disturbed,
          cervicalMucus: (r.cervical_mucus as CycleSign['cervicalMucus']) ?? null,
          sexCount: 0,
          sexProtection: null,
          notes: null,
          lhTest: (r.lh_test as CycleSign['lhTest']) ?? null,
          pregnancyTest: (r.pregnancy_test as CycleSign['pregnancyTest']) ?? null,
          flow: (r.flow as CycleSign['flow']) ?? null,
          clots: !!r.clots,
          pain: r.pain != null ? Number(r.pain) : null,
        })),
      });
      setLoading(false);
    })();
  }, []);

  const data = useMemo<PMOSOverviewData | null>(
    () => (loaded ? { ...loaded, hormonal: usesHormonalContraception(answers), goal: answers.goal ?? null } : null),
    [loaded, answers],
  );
  return { data, loading };
}
