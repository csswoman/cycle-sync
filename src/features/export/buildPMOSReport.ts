import { supabase } from '@/lib/supabase';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import type { PMOSReportExtra } from '@/services/medicalReportService';
import { adherence, instructionLabel, medicationStart, toLocalISO } from '@/lib/medications/schedule';
import { ovulationHistory, periodGap } from '@/lib/pmos/cycleStatus';
import { analyzeCycles } from '@/lib/cycle/cycleAnalysis';
import {
  bloodPressureCategory, derivedSeries, FAI_HIGH, freeAndrogenIndex, homaIr, LAB_MARKERS, markerStatus, type LabMarker,
} from '@/lib/pmos/metrics';
import { scoreWellbeing, type WellbeingAnswers } from '@/lib/pmos/wellbeing';

const BP_TEXT = { normal: 'normal', elevated: 'elevated', stage1: 'high (stage 1)', stage2: 'high (stage 2)' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Collects the PMOS follow-up sections of the PDF report. Missing tables just leave sections out. */
export async function buildPMOSReport(data: PMOSOverviewData, includeWellbeing: boolean): Promise<PMOSReportExtra> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  const soft = async <T,>(q: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> => {
    if (!uid) return [];
    const { data: d, error } = await q;
    return error ? [] : ((d as T[]) ?? []);
  };
  const [hirsutism, wellbeing, questions, bp] = await Promise.all([
    soft<{ date: string; total: number }>(supabase.from('hirsutism_scores').select('date,total').eq('user_id', uid ?? '').order('date', { ascending: false }).limit(2)),
    includeWellbeing
      ? soft<WellbeingAnswers & { date: string }>(supabase.from('wellbeing_checks').select('*').eq('user_id', uid ?? '').order('date', { ascending: false }).limit(1))
      : Promise.resolve([]),
    soft<{ question: string }>(supabase.from('doctor_questions').select('question').eq('user_id', uid ?? '').eq('done', false).order('created_at')),
    soft<{ date: string; systolic: number; diastolic: number }>(
      supabase.from('pmos_metrics').select('date,systolic,diastolic').eq('user_id', uid ?? '').not('systolic', 'is', null).order('date', { ascending: false }).limit(1)),
  ]);

  const today = data.today;
  const from = new Date(); from.setDate(from.getDate() - 29);
  const analysis = analyzeCycles(data.periodStarts.map((s) => ({ start_date: s })));

  const latestLab = new Map<string, { date: string; value: number }>();
  for (const l of [...data.labs].sort((a, b) => a.date.localeCompare(b.date))) latestLab.set(l.marker, { date: l.date, value: l.value });
  const homa = derivedSeries(data.labs as { date: string; marker: LabMarker; value: number }[], 'fasting_glucose', 'fasting_insulin', homaIr).at(-1);
  const fai = derivedSeries(data.labs as { date: string; marker: LabMarker; value: number }[], 'testosterone', 'shbg', freeAndrogenIndex).at(-1);

  const labs: PMOSReportExtra['labs'] = LAB_MARKERS.flatMap((info) => {
    const l = latestLab.get(info.key);
    if (!l) return [];
    return [{ label: info.label, value: `${l.value} ${info.unit}`.trim(), date: l.date, flag: markerStatus(info, l.value) }];
  });
  if (homa && !latestLab.has('homa_ir')) labs.push({ label: 'HOMA-IR (calculated)', value: String(homa.value), date: homa.date, flag: homa.value > 2.5 ? 'high' : 'ok' });
  if (fai) labs.push({ label: 'Free androgen index (calc.)', value: String(fai.value), date: fai.date, flag: fai.value >= FAI_HIGH ? 'high' : 'ok' });

  const w = wellbeing[0];
  const ws = w ? scoreWellbeing(w) : null;

  return {
    cycleLengths: analysis.cycles,
    daysSinceLastPeriod: periodGap(data.periodStarts, today)?.days ?? null,
    ovulation: data.hormonal ? [] : ovulationHistory(data.periodStarts, data.signs, today).map((o) => ({ start: o.start, length: o.length, status: o.status })),
    medications: data.medications.filter((m) => m.active).map((m) => {
      const times = m.times.map((t) => {
        const ins = instructionLabel(m.time_instructions?.[t], 'en');
        return ins ? `${t} (${ins.toLowerCase()})` : t;
      }).join(', ');
      const days = m.pack_active_days
        ? `pack ${m.pack_active_days}+${m.pack_break_days ?? 0}`
        : m.days_of_week?.length && m.days_of_week.length < 7 ? m.days_of_week.map((d) => DAYS[d]).join('/') : 'daily';
      const a = adherence([m], data.medLogs, toLocalISO(from), today, today);
      return { name: m.name, dose: m.dose, schedule: `${days} · ${times}`, notes: m.notes, adherencePct: a.total >= 3 ? a.pct : null, since: medicationStart(m) };
    }),
    labs,
    bloodPressure: bp[0] ? { value: `${bp[0].systolic}/${bp[0].diastolic}`, date: bp[0].date, category: BP_TEXT[bloodPressureCategory(bp[0].systolic, bp[0].diastolic)] } : null,
    hirsutism: hirsutism[0] ? { ...hirsutism[0], previous: hirsutism[1] ?? null } : null,
    wellbeing: w && ws ? { date: w.date, phq2: ws.phq2, gad2: ws.gad2, sleepSigns: [w.snoring, w.daytime_tiredness, w.observed_apnea].filter(Boolean).length } : null,
    questions: questions.map((q) => q.question),
  };
}
