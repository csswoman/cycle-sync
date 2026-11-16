'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toLocalISO } from '@/lib/medications/schedule';
import type { Medication, MedicationLog } from '@/hooks/useMedications';
import type { CycleSign } from '@/lib/cycle/fertilitySigns';
import { loadOnboardingAnswers, usesHormonalContraception } from '@/features/setup/onboarding';

const SYMPTOM_KEYS = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'] as const;

export interface PMOSOverviewData {
  today: string;
  periodStarts: string[];
  medications: Medication[];
  medLogs: MedicationLog[];
  symptomTotals: { date: string; total: number }[];
  fastingGlucose: { date: string; value: number }[];
  bloodPressureDates: string[];
  labs: { date: string; marker: string; value: number }[];
  dailyLogs: { date: string; sleep_hours: number | null; energy_level: number | null; symptoms: string[] | null }[];
  signs: CycleSign[];
  hormonal: boolean;
}

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toLocalISO(d); };

/**
 * Everything the PMOS overview cards need, loaded once. Each query fails soft so a missing
 * table (migration not applied yet) only hides the card that depends on it.
 */
export function usePMOSOverview() {
  const [data, setData] = useState<PMOSOverviewData | null>(null);
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
      const [periods, config, meds, logs, symptoms, metrics, labs, daily, signs] = await Promise.all([
        rows<{ start_date: string }>(supabase.from('periods').select('start_date').eq('user_id', uid).order('start_date', { ascending: false }).limit(36)),
        rows<{ last_period_start: string | null }>(supabase.from('cycle_config').select('last_period_start').eq('user_id', uid).limit(1)),
        rows<Medication>(supabase.from('medications').select('*').eq('user_id', uid).order('created_at')),
        rows<MedicationLog>(supabase.from('medication_logs').select('*').eq('user_id', uid).gte('date', daysAgo(180))),
        rows<Record<string, number | string>>(supabase.from('pcos_symptoms').select('*').eq('user_id', uid).gte('date', daysAgo(180))),
        rows<{ date: string; glucose_mg_dl: number | null; glucose_context: string | null; systolic?: number | null }>(
          supabase.from('pmos_metrics').select('*').eq('user_id', uid)),
        rows<{ date: string; marker: string; value: number }>(supabase.from('lab_results').select('date,marker,value').eq('user_id', uid)),
        rows<PMOSOverviewData['dailyLogs'][number]>(
          supabase.from('daily_logs').select('date,sleep_hours,energy_level,symptoms').eq('user_id', uid).gte('date', daysAgo(120))),
        rows<Record<string, unknown>>(supabase.from('cycle_signs').select('*').eq('user_id', uid).gte('date', daysAgo(220))),
      ]);
      const starts = periods.map((p) => p.start_date.slice(0, 10));
      const configStart = config[0]?.last_period_start?.slice(0, 10);
      if (configStart && !starts.includes(configStart)) starts.push(configStart);

      setData({
        today: toLocalISO(new Date()),
        periodStarts: starts.sort(),
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
        })),
        hormonal: usesHormonalContraception(loadOnboardingAnswers()),
      });
      setLoading(false);
    })();
  }, []);

  return { data, loading };
}
