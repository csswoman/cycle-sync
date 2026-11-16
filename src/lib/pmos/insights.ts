/**
 * Links between data the user already logs (treatments, cycles, glucose, symptoms, sleep).
 * Each insight needs a minimum amount of data and is phrased as an observation, not a cause.
 */
import { adherence, daySummary, type DoseLog, type SchedulableMedication } from '@/lib/medications/schedule';

export type InsightTone = 'positive' | 'neutral' | 'attention';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  es: string;
  en: string;
}

export interface InsightMedication extends SchedulableMedication {
  name: string;
  start: string | null;
  active: boolean;
}

export interface InsightInput {
  today: string;
  periodStarts: string[];
  medications: InsightMedication[];
  medLogs: DoseLog[];
  /** Daily PMOS symptom total (sum of the 0-3 scores). */
  symptomTotals: { date: string; total: number }[];
  fastingGlucose: { date: string; value: number }[];
  dailyLogs: { date: string; sleep_hours: number | null; energy_level: number | null; symptoms: string[] | null }[];
}

const DAY_MS = 86_400_000;
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const diff = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / DAY_MS);
const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (iso: string, lang: 'es' | 'en') =>
  parse(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export const MIN_GROUP = 4;

function cycles(starts: string[]): { start: string; length: number }[] {
  const s = [...new Set(starts.map((x) => x.slice(0, 10)))].sort();
  const out: { start: string; length: number }[] = [];
  for (let i = 1; i < s.length; i++) {
    const length = diff(s[i - 1], s[i]);
    if (length >= 10 && length <= 180) out.push({ start: s[i - 1], length });
  }
  return out;
}

/** Cycle length before vs after starting each treatment. */
export function cycleChangeInsights(input: InsightInput): Insight[] {
  const all = cycles(input.periodStarts);
  const out: Insight[] = [];
  for (const med of input.medications) {
    if (!med.start) continue;
    const before = all.filter((c) => c.start < med.start!).slice(-6).map((c) => c.length);
    const after = all.filter((c) => c.start >= med.start!).map((c) => c.length);
    if (before.length < 1 || after.length < 1 || before.length + after.length < 3) continue;
    const b = Math.round(avg(before));
    const a = Math.round(avg(after));
    if (Math.abs(a - b) < 3) {
      out.push({ id: `cycle-${med.id}`, tone: 'neutral', icon: 'calendar_month',
        es: `Desde que empezaste ${med.name} (${fmt(med.start, 'es')}), tus ciclos se mantienen en unos ${a} días (antes ${b}).`,
        en: `Since you started ${med.name} (${fmt(med.start, 'en')}), your cycles stay around ${a} days (before: ${b}).` });
      continue;
    }
    const closer = Math.abs(a - 28) < Math.abs(b - 28);
    out.push({ id: `cycle-${med.id}`, tone: closer ? 'positive' : 'attention', icon: 'calendar_month',
      es: `Desde que empezaste ${med.name} (${fmt(med.start, 'es')}), tus ciclos pasaron de ${b} a ${a} días en promedio (${before.length} ciclo${before.length > 1 ? 's' : ''} antes, ${after.length} después).`,
      en: `Since you started ${med.name} (${fmt(med.start, 'en')}), your cycles went from ${b} to ${a} days on average (${before.length} cycle${before.length > 1 ? 's' : ''} before, ${after.length} after).` });
  }
  return out;
}

/** Fasting glucose before vs after a treatment, or early vs recent readings. */
export function glucoseInsight(input: InsightInput): Insight | null {
  const g = [...input.fastingGlucose].sort((x, y) => x.date.localeCompare(y.date));
  for (const med of input.medications) {
    if (!med.start) continue;
    const before = g.filter((p) => p.date < med.start! && diff(p.date, med.start!) <= 120).map((p) => p.value);
    const after = g.filter((p) => p.date >= med.start!).map((p) => p.value);
    if (before.length >= 2 && after.length >= 2) {
      const b = Math.round(avg(before)), a = Math.round(avg(after)), d = a - b;
      return { id: 'glucose-med', tone: d <= -3 ? 'positive' : d >= 3 ? 'attention' : 'neutral', icon: 'glucose',
        es: `Tu glucosa en ayunas promedia ${a} mg/dL desde que empezaste ${med.name}, frente a ${b} mg/dL antes.`,
        en: `Your fasting glucose averages ${a} mg/dL since you started ${med.name}, versus ${b} mg/dL before.` };
    }
  }
  if (g.length >= 4) {
    const half = Math.floor(g.length / 2);
    const b = Math.round(avg(g.slice(0, half).map((p) => p.value)));
    const a = Math.round(avg(g.slice(-half).map((p) => p.value)));
    const d = a - b;
    if (Math.abs(d) < 3) return null;
    return { id: 'glucose-trend', tone: d < 0 ? 'positive' : 'attention', icon: 'glucose',
      es: `Tus lecturas recientes de glucosa en ayunas promedian ${a} mg/dL, ${d < 0 ? 'por debajo' : 'por encima'} de las primeras (${b} mg/dL).`,
      en: `Your recent fasting glucose readings average ${a} mg/dL, ${d < 0 ? 'below' : 'above'} your first ones (${b} mg/dL).` };
  }
  return null;
}

/** Symptom load on days with every dose taken vs days with missed doses. */
export function adherenceSymptomInsight(input: InsightInput): Insight | null {
  const active = input.medications.filter((m) => m.active);
  if (!active.length) return null;
  const full: number[] = [];
  const missed: number[] = [];
  for (const s of input.symptomTotals) {
    if (s.date >= input.today) continue;
    const day = daySummary(active, input.medLogs, s.date, input.today);
    if (day.status === 'full') full.push(s.total);
    else if (day.status === 'partial' || day.status === 'missed') missed.push(s.total);
  }
  if (full.length < MIN_GROUP || missed.length < MIN_GROUP) return null;
  const f = r1(avg(full)), m = r1(avg(missed));
  if (Math.abs(f - m) < 1) return null;
  const better = f < m;
  return { id: 'adherence-symptoms', tone: better ? 'positive' : 'neutral', icon: 'medication',
    es: `Los días que tomaste todo tu tratamiento, tu puntaje de síntomas PMOS fue ${f} en promedio; los días con tomas olvidadas, ${m}.`,
    en: `On days you took all your treatment your PMOS symptom score averaged ${f}; on days with missed doses, ${m}.` };
}

/** Short sleep vs sugar cravings and energy, from the daily log. */
export function sleepInsights(input: InsightInput): Insight[] {
  const logs = input.dailyLogs.filter((l) => l.sleep_hours != null);
  const short = logs.filter((l) => (l.sleep_hours as number) < 6);
  const good = logs.filter((l) => (l.sleep_hours as number) >= 7);
  const out: Insight[] = [];
  if (short.length < MIN_GROUP || good.length < MIN_GROUP) return out;
  const craving = (ls: typeof logs) => Math.round((ls.filter((l) => l.symptoms?.includes('Sugar Cravings')).length / ls.length) * 100);
  const cs = craving(short), cg = craving(good);
  if (cs - cg >= 15) {
    out.push({ id: 'sleep-cravings', tone: 'attention', icon: 'bedtime',
      es: `Registraste antojos de azúcar en el ${cs}% de los días que dormiste menos de 6 h, frente al ${cg}% cuando dormiste 7 h o más.`,
      en: `You logged sugar cravings on ${cs}% of days after under 6 h of sleep, versus ${cg}% after 7 h or more.` });
  }
  const energy = (ls: typeof logs) => ls.filter((l) => l.energy_level != null).map((l) => l.energy_level as number);
  const es = energy(short), eg = energy(good);
  if (es.length >= MIN_GROUP && eg.length >= MIN_GROUP && avg(eg) - avg(es) >= 1) {
    out.push({ id: 'sleep-energy', tone: 'neutral', icon: 'bolt',
      es: `Tu energía promedia ${r1(avg(eg))}/10 después de dormir 7 h o más, y ${r1(avg(es))}/10 con menos de 6 h.`,
      en: `Your energy averages ${r1(avg(eg))}/10 after 7 h or more of sleep, and ${r1(avg(es))}/10 after under 6 h.` });
  }
  return out;
}

/** 30-day adherence for each active treatment. */
export function adherenceInsights(input: InsightInput): Insight[] {
  const from = new Date(parse(input.today).getTime() - 29 * DAY_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  const fromIso = `${from.getFullYear()}-${p(from.getMonth() + 1)}-${p(from.getDate())}`;
  return input.medications.filter((m) => m.active).flatMap((m) => {
    const a = adherence([m], input.medLogs, fromIso, input.today, input.today);
    if (a.pct == null || a.total < 5) return [];
    return [{ id: `adh-${m.id}`, tone: a.pct >= 90 ? 'positive' : a.pct >= 70 ? 'neutral' : 'attention', icon: 'task_alt',
      es: `Tomaste ${a.pct}% de tus dosis de ${m.name} en los últimos 30 días (${a.taken} de ${a.total}).`,
      en: `You took ${a.pct}% of your ${m.name} doses in the last 30 days (${a.taken} of ${a.total}).` } as Insight];
  });
}

export function buildInsights(input: InsightInput): Insight[] {
  const list = [
    ...cycleChangeInsights(input),
    glucoseInsight(input),
    adherenceSymptomInsight(input),
    ...sleepInsights(input),
    ...adherenceInsights(input),
  ].filter((x): x is Insight => !!x);
  const order: Record<InsightTone, number> = { attention: 0, positive: 1, neutral: 2 };
  return list.sort((a, b) => order[a.tone] - order[b.tone]);
}
