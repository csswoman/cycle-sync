/**
 * Links between data the user already logs (treatments, cycles, glucose, symptoms, sleep).
 * Each insight needs a minimum amount of data and is phrased as an observation, not a cause.
 */
import { EATING_SYMPTOMS } from './wellbeing';
import { ovulationHistory } from './cycleStatus';
import { effectLabel } from './sideEffects';
import type { CycleSign } from '@/lib/cycle/fertilitySigns';
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
  /** Dates with at least one logged workout (`workout_logs`). */
  workoutDates?: string[];
  /** Daily wearable totals (`health_data`); steps 0 or null count as no data. */
  healthData?: { date: string; steps: number | null; sleep_duration_seconds: number | null }[];
  /** Daily acne score (0-3) from the symptom log. */
  acne?: { date: string; value: number }[];
  /** Modified Ferriman-Gallwey totals. */
  hirsutism?: { date: string; total: number }[];
  waist?: { date: string; value: number }[];
  signs?: CycleSign[];
  /** Uses hormonal contraception: phase patterns are not shown then. */
  hormonal?: boolean;
  /** "No numbers" mode: measurements such as waist are not shown. */
  hideNumbers?: boolean;
  /** Dose changes entered by hand; each opens a new side-effect window of `weeks` weeks. */
  doseChanges?: { medication_id: string; date: string; dose: string; weeks: number }[];
  sideEffects?: { medication_id: string; date: string; effect: string; severity: number }[];
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

/**
 * Days with binge eating or loss of control compared with short-sleep days and skipped-meal days.
 * Phrased as a pattern in her own log, never as a cause.
 */
export function bingeInsight(input: InsightInput): Insight | null {
  const logs = input.dailyLogs;
  const has = (l: (typeof logs)[number], key: string) => !!l.symptoms?.includes(key);
  const rate = (ls: typeof logs) => Math.round((ls.filter((l) => has(l, EATING_SYMPTOMS.binge)).length / ls.length) * 100);
  const parts: { es: string; en: string }[] = [];

  const withSleep = logs.filter((l) => l.sleep_hours != null);
  const short = withSleep.filter((l) => (l.sleep_hours as number) < 6);
  const rested = withSleep.filter((l) => (l.sleep_hours as number) >= 7);
  if (short.length >= MIN_GROUP && rested.length >= MIN_GROUP && rate(short) - rate(rested) >= 15) {
    parts.push({
      es: `en el ${rate(short)}% de los días con menos de 6 h de sueño, frente al ${rate(rested)}% con 7 h o más`,
      en: `on ${rate(short)}% of days with under 6 h of sleep, versus ${rate(rested)}% with 7 h or more`,
    });
  }
  const skipped = logs.filter((l) => has(l, EATING_SYMPTOMS.skipped));
  const ate = logs.filter((l) => !has(l, EATING_SYMPTOMS.skipped));
  if (skipped.length >= MIN_GROUP && ate.length >= MIN_GROUP && rate(skipped) - rate(ate) >= 15) {
    parts.push({
      es: `en el ${rate(skipped)}% de los días en que te saltaste comidas, frente al ${rate(ate)}% los demás`,
      en: `on ${rate(skipped)}% of days when you skipped meals, versus ${rate(ate)}% on other days`,
    });
  }
  if (parts.length === 0) return null;
  return {
    id: 'binge-pattern', tone: 'neutral', icon: 'restaurant',
    es: `Registraste atracón o pérdida de control ${parts.map((p) => p.es).join(' y ')}. Es un patrón de tu registro, no una causa. Si te pesa, puedes comentarlo con una profesional.`,
    en: `You logged binge eating or loss of control ${parts.map((p) => p.en).join(' and ')}. This is a pattern in your log, not a cause. If it weighs on you, you can talk it over with a professional.`,
  };
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


const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/** Average of two groups when both are big enough and differ by at least `minDiff`. */
function compareGroups(a: number[], b: number[], minDiff = 1): { a: number; b: number } | null {
  if (a.length < MIN_GROUP || b.length < MIN_GROUP) return null;
  const x = r1(avg(a)), y = r1(avg(b));
  return Math.abs(x - y) >= minDiff ? { a: x, b: y } : null;
}
/** Energy and symptom score the day after a workout vs the day after a rest day. */
export function exerciseInsight(input: InsightInput): Insight | null {
  const trained = new Set(input.workoutDates ?? []);
  if (trained.size === 0) return null;
  const after = (date: string) => trained.has(addDays(date, -1));
  const parts: { es: string; en: string }[] = [];
  let good = false;
  const energy = input.dailyLogs.filter((l) => l.energy_level != null && l.date < input.today);
  const e = compareGroups(
    energy.filter((l) => after(l.date)).map((l) => l.energy_level as number),
    energy.filter((l) => !after(l.date)).map((l) => l.energy_level as number));
  if (e) {
    good ||= e.a > e.b;
    parts.push({
      es: `tu energía promedia ${e.a}/10 el día después de entrenar y ${e.b}/10 los demás días`,
      en: `your energy averages ${e.a}/10 the day after a workout and ${e.b}/10 on other days`,
    });
  }
  const sym = input.symptomTotals.filter((s) => s.date < input.today);
  const s = compareGroups(sym.filter((x) => after(x.date)).map((x) => x.total), sym.filter((x) => !after(x.date)).map((x) => x.total));
  if (s) {
    good ||= s.a < s.b;
    parts.push({
      es: `tu puntaje de síntomas PMOS promedia ${s.a} el día después de entrenar y ${s.b} los demás`,
      en: `your PMOS symptom score averages ${s.a} the day after a workout and ${s.b} on other days`,
    });
  }
  if (parts.length === 0) return null;
  return { id: 'exercise-next-day', tone: good ? 'positive' : 'neutral', icon: 'fitness_center',
    es: `En tu registro, ${parts.map((p) => p.es).join('; ')}.`,
    en: `In your log, ${parts.map((p) => p.en).join('; ')}.` };
}
/** Steps and sleep from the wearable vs the same day's symptom score. */
export function activitySleepInsight(input: InsightInput): Insight | null {
  const health = (input.healthData ?? []).filter((h) => h.date < input.today);
  if (health.length === 0) return null;
  const sym = new Map(input.symptomTotals.map((s) => [s.date, s.total]));
  const totals = (pred: (h: (typeof health)[number]) => boolean) =>
    health.filter(pred).map((h) => sym.get(h.date)).filter((v): v is number => v != null);
  const steps = (h: (typeof health)[number]) => h.steps ?? 0;
  const hours = (h: (typeof health)[number]) => (h.sleep_duration_seconds ?? 0) / 3600;
  const parts: { es: string; en: string }[] = [];
  let good = false;
  const st = compareGroups(totals((h) => steps(h) >= 7000), totals((h) => steps(h) > 0 && steps(h) < 4000));
  if (st) {
    good ||= st.a < st.b;
    parts.push({
      es: `${st.a} los días con 7.000 pasos o más y ${st.b} los de menos de 4.000`,
      en: `${st.a} on days with 7,000 steps or more and ${st.b} on days under 4,000`,
    });
  }
  const sl = compareGroups(totals((h) => hours(h) >= 7), totals((h) => hours(h) > 0 && hours(h) < 6));
  if (sl) {
    good ||= sl.a < sl.b;
    parts.push({
      es: `${sl.a} los días con 7 h de sueño o más y ${sl.b} los de menos de 6 h`,
      en: `${sl.a} on days with 7 h of sleep or more and ${sl.b} on days under 6 h`,
    });
  }
  if (parts.length === 0) return null;
  return { id: 'activity-sleep', tone: good ? 'positive' : 'neutral', icon: 'directions_walk',
    es: `Según tu reloj o app de salud, tu puntaje de síntomas PMOS promedia ${parts.map((p) => p.es).join(' y ')}.`,
    en: `According to your watch or health app, your PMOS symptom score averages ${parts.map((p) => p.en).join(' and ')}.` };
}
const SLOW_TREATMENT = /espironolact|spironolact|anticonceptiv|contracept|p[ií]ldora|\bpill\b/i;
/** At 3 and 6 months on a treatment: the 30 days before it started vs the last 30 days. */
export function treatmentCheckpoint(input: InsightInput): Insight[] {
  const out: Insight[] = [];
  const recentFrom = addDays(input.today, -29);
  for (const med of input.medications) {
    if (!med.start || !med.active) continue;
    const since = diff(med.start, input.today);
    const months = since >= 183 && since <= 365 ? 6 : since >= 91 && since < 183 ? 3 : 0;
    if (!months) continue;
    const beforeFrom = addDays(med.start, -30);
    const inBefore = (d: string) => d >= beforeFrom && d < med.start!;
    const inRecent = (d: string) => d >= recentFrom && d <= input.today;
    const lines: { es: string; en: string; delta: number }[] = [];
    const series = (rows: { date: string; v: number }[], label: { es: string; en: string }) => {
      const c = compareGroups(rows.filter((r) => inBefore(r.date)).map((r) => r.v), rows.filter((r) => inRecent(r.date)).map((r) => r.v), 0.5);
      if (!c) return;
      lines.push({ es: `${label.es}: ${c.a} antes, ${c.b} ahora`, en: `${label.en}: ${c.a} before, ${c.b} now`, delta: c.b - c.a });
    };
    series(input.symptomTotals.map((x) => ({ date: x.date, v: x.total })), { es: 'puntaje de síntomas PMOS', en: 'PMOS symptom score' });
    series((input.acne ?? []).map((x) => ({ date: x.date, v: x.value })), { es: 'acné (0 a 3)', en: 'acne (0 to 3)' });
    const fg = [...(input.hirsutism ?? [])].sort((x, y) => x.date.localeCompare(y.date));
    const fgBefore = fg.filter((x) => x.date < med.start!).slice(-1)[0];
    const fgNow = fg.filter((x) => inRecent(x.date)).slice(-1)[0];
    if (fgBefore && fgNow && fgBefore.date !== fgNow.date) {
      lines.push({ es: `Ferriman-Gallwey: ${fgBefore.total} antes, ${fgNow.total} ahora`, en: `Ferriman-Gallwey: ${fgBefore.total} before, ${fgNow.total} now`, delta: fgNow.total - fgBefore.total });
    }
    if (lines.length === 0) continue;
    const net = lines.reduce((sum, l) => sum + Math.sign(l.delta), 0);
    const slow = SLOW_TREATMENT.test(med.name);
    out.push({ id: `checkpoint-${med.id}-${months}`, tone: net < 0 ? 'positive' : 'neutral', icon: 'event_available',
      es: `Llevas ${months} meses con ${med.name} (desde ${fmt(med.start, 'es')}). Antes y ahora, ${lines.map((l) => l.es).join('; ')}.${slow ? ' Este tipo de tratamiento tarda en notarse: los cambios en acné y vello suelen verse entre los 3 y 6 meses o más.' : ''} Es una observación de tu registro; coméntala en tu consulta.`,
      en: `You have been on ${med.name} for ${months} months (since ${fmt(med.start, 'en')}). Before and now, ${lines.map((l) => l.en).join('; ')}.${slow ? ' This kind of treatment takes time to show: changes in acne and hair growth are often seen between 3 and 6 months or later.' : ''} This is an observation from your log; bring it to your appointment.` });
  }
  return out;
}
/** Symptoms before vs after confirmed ovulation, only without hormonal contraception. */
export function phaseSymptomInsight(input: InsightInput): Insight | null {
  if (input.hormonal || !input.signs?.length) return null;
  const cyc = ovulationHistory(input.periodStarts, input.signs, input.today, 12)
    .filter((c) => c.status === 'confirmed' && c.ovulationDate && c.end);
  if (cyc.length < 2) return null;
  const before: number[] = [], after: number[] = [];
  for (const s of input.symptomTotals) {
    const c = cyc.find((x) => s.date >= x.start && s.date < x.end!);
    if (!c) continue;
    (s.date <= c.ovulationDate! ? before : after).push(s.total);
  }
  const g = compareGroups(after, before);
  if (!g) return null;
  const higher = g.a > g.b;
  return { id: 'phase-symptoms', tone: higher ? 'attention' : 'neutral', icon: 'moon_stars',
    es: `En ${cyc.length} ciclos con ovulación confirmada por temperatura, tu puntaje de síntomas PMOS promedia ${g.a} después de ovular y ${g.b} antes. Es un patrón de tu registro, no una causa.`,
    en: `Across ${cyc.length} cycles with temperature-confirmed ovulation, your PMOS symptom score averages ${g.a} after ovulation and ${g.b} before. This is a pattern in your log, not a cause.` };
}
/** Waist trend vs cycle length. Hidden in "no numbers" mode. */
export function waistCycleInsight(input: InsightInput): Insight | null {
  if (input.hideNumbers) return null;
  const w = [...(input.waist ?? [])].sort((x, y) => x.date.localeCompare(y.date));
  if (w.length < MIN_GROUP || diff(w[0].date, w[w.length - 1].date) < 60) return null;
  const half = Math.floor(w.length / 2);
  const wa = Math.round(avg(w.slice(0, half).map((x) => x.value)));
  const wb = Math.round(avg(w.slice(-half).map((x) => x.value)));
  if (Math.abs(wb - wa) < 2) return null;
  const mid = w[half].date;
  const all = cycles(input.periodStarts);
  const first = all.filter((c) => c.start < mid).map((c) => c.length);
  const last = all.filter((c) => c.start >= mid).map((c) => c.length);
  if (first.length < 2 || last.length < 2) return null;
  const ca = Math.round(avg(first)), cb = Math.round(avg(last));
  if (Math.abs(cb - ca) < 3) return null;
  const good = wb < wa && Math.abs(cb - 28) < Math.abs(ca - 28);
  return { id: 'waist-cycle', tone: good ? 'positive' : 'neutral', icon: 'straighten',
    es: `Tu cintura pasó de ${wa} a ${wb} cm y tus ciclos de ${ca} a ${cb} días en promedio. Son dos tendencias de tu registro que coinciden en el tiempo; no prueban que una cause la otra.`,
    en: `Your waist went from ${wa} to ${wb} cm and your cycles from ${ca} to ${cb} days on average. These are two trends in your log that coincide in time; they do not show that one causes the other.` };
}
/** Default number of weeks to watch for side effects after starting a treatment. */
export const SIDE_EFFECT_WEEKS = 8;
/**
 * Side effects logged in the weeks after starting a treatment and after each dose change the
 * user entered (new dose, date, and how many weeks to watch). Windows never overlap: each one
 * ends when the next change begins.
 */
export function sideEffectInsights(input: InsightInput): Insight[] {
  const out: Insight[] = [];
  for (const med of input.medications) {
    const changes = (input.doseChanges ?? []).filter((c) => c.medication_id === med.id).sort((a, b) => a.date.localeCompare(b.date));
    const windows: { from: string; weeks: number; dose: string | null }[] = [];
    if (med.start) windows.push({ from: med.start, weeks: SIDE_EFFECT_WEEKS, dose: null });
    for (const c of changes) windows.push({ from: c.date, weeks: c.weeks, dose: c.dose });
    windows.sort((a, b) => a.from.localeCompare(b.from));
    windows.forEach((w, i) => {
      const nextFrom = windows[i + 1]?.from;
      const naturalEnd = addDays(w.from, w.weeks * 7);
      const end = nextFrom && nextFrom < naturalEnd ? nextFrom : naturalEnd;
      const list = (input.sideEffects ?? []).filter((e) => e.medication_id === med.id && e.date >= w.from && e.date < end);
      if (list.length < 2) return;
      const counts = new Map<string, number>();
      for (const e of list) counts.set(e.effect, (counts.get(e.effect) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
      const half = addDays(w.from, Math.round((w.weeks * 7) / 2));
      const early = list.filter((e) => e.date < half).length;
      const easing = early >= 2 && list.length - early < early;
      const strong = list.some((e) => e.severity >= 3);
      const names = (lang: 'es' | 'en') => top.map(([k, n]) => `${effectLabel(k, lang).toLowerCase()} (${n})`).join(', ');
      const label = {
        es: w.dose ? `las ${w.weeks} semanas desde que cambiaste ${med.name} a ${w.dose} (${fmt(w.from, 'es')})` : `las primeras ${w.weeks} semanas con ${med.name}`,
        en: w.dose ? `the ${w.weeks} weeks since you changed ${med.name} to ${w.dose} (${fmt(w.from, 'en')})` : `the first ${w.weeks} weeks on ${med.name}`,
      };
      out.push({ id: `side-effects-${med.id}-${w.from}`, tone: strong ? 'attention' : 'neutral', icon: 'healing',
        es: `En ${label.es} registraste ${list.length} molestias: ${names('es')}.${easing ? ' Aparecen menos en la segunda mitad.' : ''} Coméntalo en tu consulta; no cambies la dosis por tu cuenta.`,
        en: `In ${label.en} you logged ${list.length} side effects: ${names('en')}.${easing ? ' They show up less in the second half.' : ''} Bring it to your appointment; do not change the dose on your own.` });
    });
  }
  return out;
}
export function buildInsights(input: InsightInput): Insight[] {
  const list = [
    ...cycleChangeInsights(input),
    glucoseInsight(input),
    adherenceSymptomInsight(input),
    ...sleepInsights(input),
    bingeInsight(input),
    ...adherenceInsights(input),
    exerciseInsight(input),
    activitySleepInsight(input),
    ...treatmentCheckpoint(input),
    phaseSymptomInsight(input),
    ...sideEffectInsights(input),
    waistCycleInsight(input),
  ].filter((x): x is Insight => !!x);
  const order: Record<InsightTone, number> = { attention: 0, positive: 1, neutral: 2 };
  return list.sort((a, b) => order[a.tone] - order[b.tone]);
}
