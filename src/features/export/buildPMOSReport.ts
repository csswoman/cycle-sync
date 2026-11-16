import { supabase } from '@/lib/supabase';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import type { PMOSReportExtra } from '@/services/medicalReportService';
import { adherence, instructionLabel, medicationStart, toLocalISO } from '@/lib/medications/schedule';
import { ovulationHistory, periodGap } from '@/lib/pmos/cycleStatus';
import { analyzeCycles, cycleHealthFlags } from '@/lib/cycle/cycleAnalysis';
import { periodBleedingDays } from '@/lib/cycle/bleeding';
import { parseLocalDate } from '@/lib/cycle/cycleEngine';
import {
  bloodPressureCategory, derivedSeries, FAI_HIGH, freeAndrogenIndex, homaIr, LAB_MARKERS, markerStatus, type LabMarker,
} from '@/lib/pmos/metrics';
import { phenotype, PHENOTYPE_INFO, type DiagnosisCriteria } from '@/lib/pmos/diagnosis';
import { effectLabel, SEVERITY_LABELS } from '@/lib/pmos/sideEffects';
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
  const [hirsutism, wellbeing, questions, bp, dxRows, eventRows, effectRows] = await Promise.all([
    soft<{ date: string; total: number }>(supabase.from('hirsutism_scores').select('date,total').eq('user_id', uid ?? '').order('date', { ascending: false }).limit(2)),
    includeWellbeing
      ? soft<WellbeingAnswers & { date: string }>(supabase.from('wellbeing_checks').select('*').eq('user_id', uid ?? '').order('date', { ascending: false }).limit(1))
      : Promise.resolve([]),
    soft<{ question: string }>(supabase.from('doctor_questions').select('question').eq('user_id', uid ?? '').eq('done', false).order('created_at')),
    soft<{ date: string; systolic: number; diastolic: number }>(
      supabase.from('pmos_metrics').select('date,systolic,diastolic').eq('user_id', uid ?? '').not('systolic', 'is', null).order('date', { ascending: false }).limit(1)),
    soft<DiagnosisCriteria & { diagnosed_on: string | null; notes: string | null }>(supabase.from('pmos_diagnosis').select('*').eq('user_id', uid ?? '').limit(1)),
    soft<{ date: string; kind: string; summary: string }>(supabase.from('health_events').select('date,kind,summary').eq('user_id', uid ?? '').order('date', { ascending: false }).limit(10)),
    soft<{ medication_id: string; date: string; effect: string; severity: number }>(
      supabase.from('medication_side_effects').select('medication_id,date,effect,severity').eq('user_id', uid ?? '').order('date', { ascending: false }).limit(60)),
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
    return [{ label: info.label, value: `${l.value} ${info.unit}`.trim(), date: l.date, flag: markerStatus(info, l.value) === 'none' ? null : markerStatus(info, l.value) as 'low' | 'high' | 'ok' }];
  });
  if (homa && !latestLab.has('homa_ir')) labs.push({ label: 'HOMA-IR (calculated)', value: String(homa.value), date: homa.date, flag: homa.value > 2.5 ? 'high' : 'ok' });
  if (fai) labs.push({ label: 'Free androgen index (calc.)', value: String(fai.value), date: fai.date, flag: fai.value >= FAI_HIGH ? 'high' : 'ok' });

  // Only flow, clots and pain go into the report. Sexual activity and notes in the same table stay out.
  const bleedingPeriods = [...data.periodRuns]
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(-3)
    .map((per) => ({
      start: per.start_date,
      days: periodBleedingDays(data.signs, per).map((s) => ({ date: s.date, flow: s.flow ?? null, clots: !!s.clots, pain: s.pain ?? null })),
    }))
    .filter((per) => per.days.length > 0);
  const bleedingFlags = cycleHealthFlags(data.periodRuns, parseLocalDate(today), data.signs).filter((f) => f === 'heavyBleeding' || f === 'heavyAfterGap');
  const CRITERIA_EN: Record<keyof DiagnosisCriteria, string> = {
    irregular_cycles: 'irregular cycles or no ovulation', clinical_hyperandrogenism: 'clinical androgen excess',
    biochemical_hyperandrogenism: 'high androgens on labs', polycystic_ovaries: 'polycystic ovaries on ultrasound',
  };
  const dx = dxRows[0];
  const pheno = dx ? phenotype(dx) : null;
  const diagnosis: PMOSReportExtra['diagnosis'] = dx || eventRows.length ? {
    phenotype: pheno ? `${pheno}: ${PHENOTYPE_INFO[pheno].en}` : null,
    diagnosedOn: dx?.diagnosed_on ? dx.diagnosed_on.slice(0, 10) : null,
    criteria: dx ? (Object.keys(CRITERIA_EN) as (keyof DiagnosisCriteria)[]).filter((k) => dx[k]).map((k) => CRITERIA_EN[k]) : [],
    notes: dx?.notes ?? null,
    events: eventRows.map((e) => ({ date: e.date.slice(0, 10), kind: e.kind, summary: e.summary })),
  } : undefined;
  const sideEffects: PMOSReportExtra['sideEffects'] = data.medications.flatMap((m) => {
    const entries = effectRows.filter((e) => e.medication_id === m.id).slice(0, 8)
      .map((e) => ({ date: e.date.slice(0, 10), effect: effectLabel(e.effect, 'en'), severity: SEVERITY_LABELS[e.severity as 1 | 2 | 3]?.en ?? '' }));
    return entries.length ? [{ medication: m.name, entries }] : [];
  });
  const w = wellbeing[0];
  const ws = w ? scoreWellbeing(w) : null;

  return {
    cycleLengths: analysis.cycles,
    daysSinceLastPeriod: periodGap(data.periodStarts, today)?.days ?? null,
    ovulation: data.hormonal ? [] : ovulationHistory(data.periodStarts, data.signs, today).map((o) => ({ start: o.start, length: o.length, status: o.status })),
    bleeding: bleedingPeriods.length ? { flags: bleedingFlags, periods: bleedingPeriods } : undefined,
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
    diagnosis,
    sideEffects: sideEffects.length ? sideEffects : undefined,
  };
}
