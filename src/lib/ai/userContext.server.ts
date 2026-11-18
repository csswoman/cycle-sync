import { cycleProfile, type CycleProfile, type OnboardingAnswers } from '@/features/setup/onboarding';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cycleHealthFlags } from '@/lib/cycle/cycleAnalysis';
import { activePregnancy, gestationalAge, predictionsPaused, type Pregnancy } from '@/lib/cycle/pregnancy';
import { heavyBleedingDays, periodBleedingDays, type BleedingSign } from '@/lib/cycle/bleeding';
import { cycleLengthsFromStarts, daysBetween, parseLocalDate } from '@/lib/cycle/cycleEngine';
import {
  FAI_HIGH, LAB_MARKERS, bloodPressureCategory, derivedSeries, freeAndrogenIndex, homaIr, markerInfo, markerStatus,
  type LabMarker,
} from '@/lib/pmos/metrics';
import { adherence, medicationStart, toLocalISO, type DoseLog, type SchedulableMedication } from '@/lib/medications/schedule';

// Server-only: reads the signed-in user's own rows (RLS applies) to give the chat assistant context.

export interface UserContextData {
  phase?: string;
  cycleDay?: number;
  dietary: string[];
  logs: { date: string; mood?: string | null; energy?: number | null; sleepHours?: number | null; symptoms: string[] }[];
  pcos: { date: string; symptoms: Record<string, number> } | null;
  medications: { name: string; dose?: string | null; times: string[] }[];
  pantry: string[];
  today?: string;
  plannedMeals: { slot: string; title: string; done: boolean }[];
  plannedWorkout: { title: string; kind: string; done: boolean } | null;
  cycle?: CycleContext | null;
  labs?: LabContext[];
  measures?: MeasuresContext | null;
  wellbeing?: WellbeingContext | null;
  treatment?: TreatmentContext[];
  profile?: { goal?: string; contraception?: string; cycleProfile?: CycleProfile; diagnosis?: string } | null;
  /** Pregnancy mode: predictions are paused (active) or waiting for the next period (after). */
  pregnancy?: { state: 'active' | 'after'; weeks: number | null } | null;
  /** No-numbers mode: the assistant must not talk about weight, waist or calories. */
  hideNumbers?: boolean;
}
export interface CycleContext {
  lengths: number[];
  daysSinceLastPeriod: number | null;
  flags: string[];
  /** Last periods with logged flow or pain (never sexual activity). */
  bleeding?: { start: string; flow: string | null; heavyDays: number; maxPain: number | null }[];
}
export interface LabContext { label: string; value: number; unit: string; date: string; status: 'low' | 'high' | 'ok' | 'none' }
export interface MeasuresContext {
  fastingGlucoseAvg30: { avg: number; n: number } | null;
  bloodPressure: { systolic: number; diastolic: number; category: string; date: string } | null;
  weight90: Trend | null;
  waist90: Trend | null;
}
export interface Trend { from: number; to: number; fromDate: string; toDate: string }
export interface WellbeingContext {
  check: { date: string; phq2: number; gad2: number; apneaSigns: number } | null;
  ferriman: { date: string; total: number; previous: number | null } | null;
}
export interface TreatmentContext { name: string; startDate: string | null; adherence30: number | null }

const PHASES = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const validPhase = (v: unknown): string | undefined => (PHASES.includes(v as string) ? (v as string) : undefined);
export const validCycleDay = (v: unknown): number | undefined =>
  Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 120 ? (v as number) : undefined;
export const validDate = (v: unknown): string | undefined => (typeof v === 'string' && DATE_RE.test(v) ? v : undefined);

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

/** Turns the loaded data into a compact text block appended to the system instruction. Returns '' when there is nothing to say. */
export function formatUserContext(d: UserContextData, language: 'en' | 'es'): string {
  const es = language === 'es';
  const lines: string[] = [];

  if (d.hideNumbers) {
    lines.push(es
      ? 'Importante: ella activó el modo sin números. No menciones peso, cintura, calorías ni macros, ni propongas bajar de peso. Habla de energía, sueño, síntomas y hábitos.'
      : 'Important: she turned on no-numbers mode. Do not mention weight, waist, calories or macros, and do not suggest losing weight. Talk about energy, sleep, symptoms and habits.');
  }
  if (d.pregnancy) {
    lines.push(d.pregnancy.state === 'active'
      ? (es
        ? `Modo embarazo activo${d.pregnancy.weeks != null ? ` (semana ${d.pregnancy.weeks + 1})` : ''}. No des fechas de regla, ovulación ni ventana fértil ni consejos por fase del ciclo. Para cualquier medicación, indica que lo consulte con su médica.`
        : `Pregnancy mode is on${d.pregnancy.weeks != null ? ` (week ${d.pregnancy.weeks + 1})` : ''}. Do not give period, ovulation or fertile-window dates or cycle-phase advice. For any medication, tell her to check with her doctor.`)
      : (es
        ? 'Terminó un embarazo y aún no ha registrado su siguiente regla. No des predicciones de regla ni de ovulación hasta entonces.'
        : 'A pregnancy ended and she has not logged her next period yet. Do not give period or ovulation predictions until then.'));
  }
  if (d.phase && !d.pregnancy) {
    lines.push(es
      ? `Fase actual del ciclo: ${d.phase}${d.cycleDay ? ` (día ${d.cycleDay})` : ''}.`
      : `Current cycle phase: ${d.phase}${d.cycleDay ? ` (day ${d.cycleDay})` : ''}.`);
  }
  if (d.dietary.length) lines.push((es ? 'Preferencias alimentarias: ' : 'Dietary preferences: ') + d.dietary.join(', ') + '.');

  if (d.logs.length) {
    lines.push(es ? 'Registros de los últimos días:' : 'Recent daily logs:');
    for (const l of d.logs) {
      const bits = [
        l.energy != null ? `${es ? 'energía' : 'energy'} ${l.energy}/10` : '',
        l.sleepHours != null ? `${es ? 'sueño' : 'sleep'} ${l.sleepHours}h` : '',
        l.mood ? `${es ? 'ánimo' : 'mood'} ${clip(l.mood, 30)}` : '',
        l.symptoms.length ? `${es ? 'síntomas' : 'symptoms'}: ${l.symptoms.map((s) => clip(s, 30)).join(', ')}` : '',
      ].filter(Boolean);
      if (bits.length) lines.push(`- ${l.date}: ${bits.join('; ')}`);
    }
  }
  if (d.pcos) {
    const active = Object.entries(d.pcos.symptoms).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}/3`);
    if (active.length) lines.push(`${es ? 'Síntomas SOP' : 'PCOS symptoms'} (${d.pcos.date}): ${active.join(', ')}.`);
  }
  if (d.medications.length) {
    lines.push((es ? 'Medicamentos activos: ' : 'Active medications: ') +
      d.medications.map((m) => `${clip(m.name, 60)}${m.dose ? ` ${clip(m.dose, 30)}` : ''}${m.times.length ? ` (${m.times.join(', ')})` : ''}`).join('; ') + '.');
  }
  if (d.pantry.length) lines.push((es ? 'Despensa: ' : 'Pantry: ') + d.pantry.map((p) => clip(p, 40)).join(', ') + '.');
  if (d.plannedMeals.length) {
    lines.push((es ? 'Comidas planeadas hoy: ' : 'Meals planned today: ') +
      d.plannedMeals.map((m) => `${m.slot} ${clip(m.title, 80)}${m.done ? (es ? ' (hecha)' : ' (done)') : ''}`).join('; ') + '.');
  }
  if (d.plannedWorkout) {
    lines.push(`${es ? 'Entreno planeado hoy' : 'Workout planned today'}: ${clip(d.plannedWorkout.title, 80)}${d.plannedWorkout.done ? (es ? ' (hecho)' : ' (done)') : ''}.`);
  }

  lines.push(...clinicalLines(d, es));
  if (lines.length === 0) return '';
  const header = es
    ? 'Contexto privado de la usuaria (úsalo solo cuando ayude a responder; no lo repitas entero ni lo menciones si no viene al caso). Al explicar un valor, compáralo con su rango de referencia, aclara que manda el rango de su laboratorio y cita el valor y la fecha reales. Si no hay registros de algo, dilo en vez de suponerlo. No diagnostiques ni cambies dosis de medicamentos; para eso recomienda consultar a su profesional de salud.'
    : "The user's private context (use it only when it helps the answer; do not recite it or mention it when irrelevant). When explaining a value, compare it with its reference range, note that her lab's own range takes priority, and quote the real value and date. If there are no records for something, say so instead of guessing. Do not diagnose or change medication doses; refer her to her healthcare professional for that.";
  return `${header}\n${lines.join('\n')}`;
}

const MAX_LAB_LINES = 14;
const FLAG_TEXT: Record<string, { es: string; en: string }> = {
  noPeriod90: { es: 'más de 90 días sin regla', en: 'over 90 days without a period' },
  longCycles: { es: 'ciclos largos repetidos', en: 'repeated long cycles' },
  shortCycles: { es: 'ciclos cortos repetidos', en: 'repeated short cycles' },
  fewPeriodsYear: { es: 'menos de 8 reglas al año', en: 'fewer than 8 periods a year' },
  longBleeding: { es: 'sangrados de más de 8 días', en: 'bleeding longer than 8 days' },
  heavyBleeding: { es: 'sangrado muy abundante (2 o más días en una regla)', en: 'very heavy bleeding (2 or more days in one period)' },
  heavyAfterGap: { es: 'regla abundante tras 90 días o más sin sangrado', en: 'heavy period after 90 or more days without bleeding' },
  severePain: { es: 'dolor menstrual fuerte (7/10 o más) en varias reglas', en: 'severe period pain (7/10 or more) in several periods' },
};
const FLOW_TEXT: Record<string, { es: string; en: string }> = {
  light: { es: 'ligero', en: 'light' }, medium: { es: 'medio', en: 'medium' },
  heavy: { es: 'abundante', en: 'heavy' }, very_heavy: { es: 'muy abundante', en: 'very heavy' },
};
const GOAL_TEXT: Record<string, { es: string; en: string }> = {
  performance: { es: 'rendimiento', en: 'performance' }, pmos: { es: 'manejar el PMOS', en: 'manage PMOS' },
  fertility: { es: 'quedar embarazada', en: 'getting pregnant' }, wellness: { es: 'bienestar general', en: 'general wellness' },
};
/** Tells the assistant whether PMOS applies, so a user without it does not get PMOS advice. */
const PROFILE_TEXT: Record<CycleProfile, { es: string; en: string }> = {
  pmos: { es: 'tiene SOP/PMOS diagnosticado o en sospecha', en: 'has diagnosed or suspected PCOS/PMOS' },
  irregular: { es: 'ciclos irregulares sin diagnóstico de SOP/PMOS (no asumas PMOS)', en: 'irregular cycles without a PCOS/PMOS diagnosis (do not assume PMOS)' },
  regular: { es: 'ciclos regulares sin SOP/PMOS (no des consejos de PMOS salvo que pregunte)', en: 'regular cycles without PCOS/PMOS (no PMOS advice unless she asks)' },
};
const CONTRACEPTION_TEXT: Record<string, { es: string; en: string }> = {
  none: { es: 'ninguno', en: 'none' }, pill: { es: 'píldora', en: 'pill' }, iud: { es: 'DIU', en: 'IUD' },
  other: { es: 'otro hormonal', en: 'other hormonal' }, nonhormonal: { es: 'no hormonal', en: 'non-hormonal' },
};
const STATUS_TEXT = { low: { es: 'bajo', en: 'low' }, high: { es: 'alto', en: 'high' }, ok: { es: 'en rango', en: 'in range' }, none: { es: 'sin rango de referencia', en: 'no reference range' } };
const BP_TEXT: Record<string, { es: string; en: string }> = {
  normal: { es: 'normal', en: 'normal' }, elevated: { es: 'elevada', en: 'elevated' },
  stage1: { es: 'hipertensión etapa 1', en: 'stage 1 hypertension range' }, stage2: { es: 'hipertensión etapa 2', en: 'stage 2 hypertension range' },
};
const fmt = (n: number) => String(Math.round(n * 100) / 100);
function pushLine(out: string[], title: string, bits: string[]) {
  if (bits.length) out.push(`${title}: ${bits.join('; ')}.`);
}
/** One line per area (cycle, labs, measures, wellbeing, treatment, profile). Areas without data are skipped. */
function clinicalLines(d: UserContextData, es: boolean): string[] {
  const out: string[] = [];
  const L = (esText: string, enText: string) => (es ? esText : enText);
  if (d.cycle && (d.cycle.lengths.length || d.cycle.daysSinceLastPeriod != null)) {
    const bits: string[] = [];
    if (d.cycle.lengths.length) bits.push(L(`últimas duraciones ${d.cycle.lengths.join(', ')} días`, `recent lengths ${d.cycle.lengths.join(', ')} days`));
    if (d.cycle.daysSinceLastPeriod != null) bits.push(L(`${d.cycle.daysSinceLastPeriod} días desde la última regla`, `${d.cycle.daysSinceLastPeriod} days since last period`));
    if (d.cycle.flags.length) bits.push(L('avisos: ', 'flags: ') + d.cycle.flags.map((f) => FLAG_TEXT[f]?.[es ? 'es' : 'en'] ?? f).join(', '));
    if (d.cycle.bleeding?.length) {
      bits.push(L('sangrado y dolor por regla: ', 'bleeding and pain per period: ') + d.cycle.bleeding.map((b) =>
        `${b.start} ${[
          b.flow ? (FLOW_TEXT[b.flow]?.[es ? 'es' : 'en'] ?? b.flow) : '',
          b.heavyDays ? L(`${b.heavyDays} días muy abundantes`, `${b.heavyDays} very heavy days`) : '',
          b.maxPain != null ? L(`dolor máx ${b.maxPain}/10`, `max pain ${b.maxPain}/10`) : '',
        ].filter(Boolean).join(', ')}`).join('; '));
    }
    pushLine(out, L('Ciclo', 'Cycle'), bits);
  }
  if (d.labs?.length) {
    const items = d.labs.slice(0, MAX_LAB_LINES).map((l) =>
      `${clip(l.label, 40)} ${fmt(l.value)}${l.unit ? ` ${l.unit}` : ''} (${l.date}, ${STATUS_TEXT[l.status][es ? 'es' : 'en']})`);
    out.push(L('Últimos análisis: ', 'Latest lab results: ') + items.join('; ') + '.');
  }
  const m = d.measures;
  if (m) {
    const bits: string[] = [];
    if (m.fastingGlucoseAvg30) bits.push(L(`glucosa en ayunas 30 d: media ${fmt(m.fastingGlucoseAvg30.avg)} mg/dL (n=${m.fastingGlucoseAvg30.n})`, `fasting glucose 30 d: mean ${fmt(m.fastingGlucoseAvg30.avg)} mg/dL (n=${m.fastingGlucoseAvg30.n})`));
    if (m.bloodPressure) bits.push(L(`presión ${m.bloodPressure.systolic}/${m.bloodPressure.diastolic} (${BP_TEXT[m.bloodPressure.category]?.es ?? m.bloodPressure.category}, ${m.bloodPressure.date})`, `blood pressure ${m.bloodPressure.systolic}/${m.bloodPressure.diastolic} (${BP_TEXT[m.bloodPressure.category]?.en ?? m.bloodPressure.category}, ${m.bloodPressure.date})`));
    if (m.weight90 && !d.hideNumbers) bits.push(L(`peso 90 d: ${fmt(m.weight90.from)} → ${fmt(m.weight90.to)} kg`, `weight 90 d: ${fmt(m.weight90.from)} → ${fmt(m.weight90.to)} kg`));
    if (m.waist90 && !d.hideNumbers) bits.push(L(`cintura 90 d: ${fmt(m.waist90.from)} → ${fmt(m.waist90.to)} cm`, `waist 90 d: ${fmt(m.waist90.from)} → ${fmt(m.waist90.to)} cm`));
    pushLine(out, L('Medidas', 'Measures'), bits);
  }
  const w = d.wellbeing;
  if (w) {
    const bits: string[] = [];
    if (w.check) bits.push(`PHQ-2 ${w.check.phq2}/6, GAD-2 ${w.check.gad2}/6, ${L(`señales de apnea ${w.check.apneaSigns}/3`, `apnea signs ${w.check.apneaSigns}/3`)} (${w.check.date})`);
    if (w.ferriman) bits.push(`Ferriman-Gallwey ${w.ferriman.total}${w.ferriman.previous != null ? L(` (antes ${w.ferriman.previous})`, ` (before ${w.ferriman.previous})`) : ''} (${w.ferriman.date})`);
    pushLine(out, L('Bienestar', 'Wellbeing'), bits);
  }
  if (d.treatment?.length) {
    const items = d.treatment.map((t) => {
      const bits = [
        t.startDate ? L(`desde ${t.startDate}`, `since ${t.startDate}`) : '',
        t.adherence30 != null ? L(`adherencia 30 d ${t.adherence30}%`, `30-day adherence ${t.adherence30}%`) : '',
      ].filter(Boolean);
      return `${clip(t.name, 60)}${bits.length ? ` (${bits.join(', ')})` : ''}`;
    });
    out.push(L('Tratamiento: ', 'Treatment: ') + items.join('; ') + '.');
  }
  if (d.profile && (d.profile.goal || d.profile.contraception || d.profile.cycleProfile)) {
    const bits: string[] = [];
    if (d.profile.cycleProfile) bits.push(PROFILE_TEXT[d.profile.cycleProfile][es ? 'es' : 'en']);
    if (d.profile.goal) bits.push(L('objetivo ', 'goal ') + (GOAL_TEXT[d.profile.goal]?.[es ? 'es' : 'en'] ?? clip(d.profile.goal, 30)));
    if (d.profile.contraception) bits.push(L('anticoncepción ', 'contraception ') + (CONTRACEPTION_TEXT[d.profile.contraception]?.[es ? 'es' : 'en'] ?? clip(d.profile.contraception, 30)));
    pushLine(out, L('Perfil', 'Profile'), bits);
  }
  return out;
}
const trend = (rows: { date: string; v: number }[]): Trend | null => {
  if (rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return { from: first.v, to: last.v, fromDate: first.date, toDate: last.date };
};
export interface ClinicalRaw {
  today: string;
  periods: { start_date: string; end_date?: string | null }[];
  /** Only date, flow, clots and pain: never the sexual-activity columns of cycle_signs. */
  bleedingSigns?: BleedingSign[];
  labs: { marker: string; value: number; date: string; ref_low?: number | null; ref_high?: number | null }[];
  metrics: {
    date: string; glucose_mg_dl: number | null; glucose_context: string | null; insulin_uiu_ml: number | null;
    weight_kg: number | null; waist_cm: number | null; systolic: number | null; diastolic: number | null;
  }[];
  wellbeing: { date: string; phq_interest: number; phq_mood: number; gad_nervous: number; gad_worry: number; snoring: boolean; daytime_tiredness: boolean; observed_apnea: boolean } | null;
  ferriman: { date: string; total: number }[];
  medications: (SchedulableMedication & { name: string })[];
  medLogs: DoseLog[];
  onboarding: OnboardingAnswers | null;
  pregnancies?: Pregnancy[];
}
/** Pure: turns raw rows into the compact clinical context. Never reads sexual activity or photos. */
export function buildClinicalContext(raw: ClinicalRaw): Pick<UserContextData, 'cycle' | 'labs' | 'measures' | 'wellbeing' | 'treatment' | 'profile' | 'pregnancy'> {
  const { today } = raw;
  const starts = Array.from(new Set(raw.periods.map((p) => p.start_date.slice(0, 10)))).sort();
  const now = parseLocalDate(today);
  const pregnancies = raw.pregnancies ?? [];
  const activePreg = activePregnancy(pregnancies, today);
  const pregnancy: UserContextData['pregnancy'] = activePreg
    ? { state: 'active', weeks: gestationalAge(activePreg, today)?.weeks ?? null }
    : predictionsPaused(starts[starts.length - 1] ?? null, pregnancies, today) ? { state: 'after', weeks: null } : null;
  const cycle: CycleContext | null = starts.length
    ? {
        lengths: cycleLengthsFromStarts(starts, pregnancies).slice(-6),
        daysSinceLastPeriod: pregnancy ? null : Math.max(0, daysBetween(parseLocalDate(starts[starts.length - 1]), now)),
        flags: cycleHealthFlags(raw.periods, now, raw.bleedingSigns ?? [], pregnancies),
        bleeding: [...raw.periods]
          .sort((a, b) => a.start_date.localeCompare(b.start_date))
          .slice(-3)
          .map((p) => {
            const days = periodBleedingDays(raw.bleedingSigns ?? [], p);
            const order = ['light', 'medium', 'heavy', 'very_heavy'];
            const top = days.reduce<string | null>((m, s) => (s.flow && order.indexOf(s.flow) > (m ? order.indexOf(m) : -1) ? s.flow : m), null);
            const pains = days.map((s) => s.pain).filter((v): v is number => v != null);
            return { start: p.start_date.slice(0, 10), flow: top, heavyDays: heavyBleedingDays(days, p).length, maxPain: pains.length ? Math.max(...pains) : null };
          })
          .filter((b) => b.flow || b.maxPain != null),
      }
    : null;
  // Latest value per known marker.
  const known = new Set<string>(LAB_MARKERS.map((m) => m.key));
  const latest = new Map<string, { value: number; date: string; low: number | null; high: number | null }>();
  const num = (x: unknown) => (x == null ? null : Number(x));
  for (const r of raw.labs) {
    if (!known.has(r.marker)) continue;
    const cur = latest.get(r.marker);
    if (!cur || r.date > cur.date) latest.set(r.marker, { value: Number(r.value), date: r.date, low: num(r.ref_low), high: num(r.ref_high) });
  }
  const labs: LabContext[] = [];
  for (const [marker, v] of latest) {
    if (marker === 'homa_ir') continue; // handled below, preferring the value derived from glucose and insulin
    const info = markerInfo(marker as LabMarker);
    labs.push({ label: info.labelEs, value: v.value, unit: info.unit, date: v.date, status: markerStatus(info, v.value, { low: v.low, high: v.high }) });
  }
  const labRows = raw.labs.filter((l) => known.has(l.marker)).map((l) => ({ date: l.date, marker: l.marker as LabMarker, value: Number(l.value) }));
  const metricLabRows = raw.metrics.flatMap((m) => [
    ...(m.glucose_context === 'fasting' && m.glucose_mg_dl != null ? [{ date: m.date, marker: 'fasting_glucose' as LabMarker, value: Number(m.glucose_mg_dl) }] : []),
    ...(m.insulin_uiu_ml != null ? [{ date: m.date, marker: 'fasting_insulin' as LabMarker, value: Number(m.insulin_uiu_ml) }] : []),
  ]);
  const homa = derivedSeries([...labRows, ...metricLabRows], 'fasting_glucose', 'fasting_insulin', homaIr).at(-1);
  const storedHoma = latest.get('homa_ir');
  const homaBest = homa && (!storedHoma || homa.date >= storedHoma.date) ? homa : storedHoma ?? null;
  if (homaBest) labs.push({ label: 'HOMA-IR', value: homaBest.value, unit: '', date: homaBest.date, status: markerStatus(markerInfo('homa_ir'), homaBest.value) });
  const fai = derivedSeries(labRows, 'testosterone', 'shbg', freeAndrogenIndex).at(-1);
  if (fai) labs.push({ label: 'Índice de andrógenos libres', value: fai.value, unit: '', date: fai.date, status: fai.value > FAI_HIGH ? 'high' : 'ok' });
  labs.sort((a, b) => b.date.localeCompare(a.date));
  const d30 = toLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30));
  const d90 = toLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90));
  const fasting = raw.metrics.filter((m) => m.glucose_context === 'fasting' && m.glucose_mg_dl != null && m.date >= d30);
  const bp = raw.metrics.filter((m) => m.systolic != null && m.diastolic != null).sort((a, b) => b.date.localeCompare(a.date))[0];
  const measures: MeasuresContext = {
    fastingGlucoseAvg30: fasting.length ? { avg: fasting.reduce((s, m) => s + Number(m.glucose_mg_dl), 0) / fasting.length, n: fasting.length } : null,
    bloodPressure: bp ? { systolic: bp.systolic!, diastolic: bp.diastolic!, category: bloodPressureCategory(bp.systolic!, bp.diastolic!), date: bp.date } : null,
    weight90: trend(raw.metrics.filter((m) => m.weight_kg != null && m.date >= d90).map((m) => ({ date: m.date, v: Number(m.weight_kg) }))),
    waist90: trend(raw.metrics.filter((m) => m.waist_cm != null && m.date >= d90).map((m) => ({ date: m.date, v: Number(m.waist_cm) }))),
  };
  const hasMeasures = measures.fastingGlucoseAvg30 || measures.bloodPressure || measures.weight90 || measures.waist90;
  const fg = [...raw.ferriman].sort((a, b) => b.date.localeCompare(a.date));
  const w = raw.wellbeing;
  const wellbeing: WellbeingContext | null = w || fg.length
    ? {
        check: w ? {
          date: w.date, phq2: w.phq_interest + w.phq_mood, gad2: w.gad_nervous + w.gad_worry,
          apneaSigns: [w.snoring, w.daytime_tiredness, w.observed_apnea].filter(Boolean).length,
        } : null,
        ferriman: fg.length ? { date: fg[0].date, total: fg[0].total, previous: fg[1]?.total ?? null } : null,
      }
    : null;
  const treatment: TreatmentContext[] = raw.medications.map((m) => ({
    name: m.name,
    startDate: medicationStart(m),
    adherence30: adherence([m], raw.medLogs.filter((l) => l.medication_id === m.id), d30, today, today).pct,
  }));
  const profile = raw.onboarding && Object.keys(raw.onboarding).length
    ? {
        goal: raw.onboarding.goal,
        contraception: raw.onboarding.contraception,
        cycleProfile: cycleProfile(raw.onboarding),
        diagnosis: raw.onboarding.diagnosis,
      }
    : null;
  return { cycle, labs, measures: hasMeasures ? measures : null, wellbeing, treatment, profile, pregnancy };
}
/** Loads the data the assistant can use. Each query fails soft: a missing table or error just leaves that part out. */
export async function loadUserContext(
  supabase: SupabaseClient,
  userId: string,
  hints: { phase?: string; cycleDay?: number; today?: string },
): Promise<UserContextData> {
  const soft = async <T>(q: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> => {
    try {
      const { data, error } = await q;
      return error ? null : data;
    } catch {
      return null;
    }
  };

  const today = hints.today;
  const clinicalToday = today ?? toLocalISO(new Date());
  const since = (days: number) => {
    const n = parseLocalDate(clinicalToday);
    return toLocalISO(new Date(n.getFullYear(), n.getMonth(), n.getDate() - days));
  };
  const [cfg, logs, pcos, meds, pantry, meals, workout, periods, bleedingRows, labRows, metricRows, wellbeingRows, fgRows, onboardingRow, medRows, medLogRows, pregnancyRows, displayRow] = await Promise.all([
    soft(supabase.from('cycle_config').select('dietary_prefs').eq('user_id', userId).maybeSingle()),
    soft(supabase.from('daily_logs').select('date, mood, energy_level, sleep_hours, symptoms').eq('user_id', userId).order('date', { ascending: false }).limit(5)),
    soft(supabase.from('pcos_symptoms').select('date, acne, fatigue, hirsutism, hair_loss, mood_swings, bloating').eq('user_id', userId).order('date', { ascending: false }).limit(1)),
    soft(supabase.from('medications').select('name, dose, times').eq('user_id', userId).eq('active', true).limit(20)),
    soft(supabase.from('pantry_items').select('name').eq('user_id', userId).order('name').limit(60)),
    today ? soft(supabase.from('meal_plan_entries').select('slot, title, done').eq('user_id', userId).eq('plan_date', today)) : Promise.resolve(null),
    today ? soft(supabase.from('workout_plan_entries').select('title, kind, done').eq('user_id', userId).eq('plan_date', today).maybeSingle()) : Promise.resolve(null),
    soft(supabase.from('periods').select('start_date, end_date').eq('user_id', userId).order('start_date', { ascending: false }).limit(13)),
    // Explicit columns on purpose: cycle_signs also holds sexual activity, which the assistant must not see.
    soft(supabase.from('cycle_signs').select('date, flow, clots, pain').eq('user_id', userId).gte('date', since(400)).or('flow.not.is.null,pain.not.is.null').limit(200)),
    // '*' so the lab's own range comes along once its migration is applied.
    soft(supabase.from('lab_results').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(300)),
    soft(supabase.from('pmos_metrics').select('date, glucose_mg_dl, glucose_context, insulin_uiu_ml, weight_kg, waist_cm, systolic, diastolic').eq('user_id', userId).gte('date', since(90)).order('date', { ascending: false }).limit(300)),
    soft(supabase.from('wellbeing_checks').select('date, phq_interest, phq_mood, gad_nervous, gad_worry, snoring, daytime_tiredness, observed_apnea').eq('user_id', userId).order('date', { ascending: false }).limit(1)),
    soft(supabase.from('hirsutism_scores').select('date, total').eq('user_id', userId).order('date', { ascending: false }).limit(2)),
    // Separate query: the column comes from a later migration and must not break the dietary one.
    soft(supabase.from('cycle_config').select('onboarding_answers').eq('user_id', userId).maybeSingle()),
    soft(supabase.from('medications').select('id, name, times, days_of_week, start_date, created_at, pack_active_days, pack_break_days, pack_start_date').eq('user_id', userId).eq('active', true).limit(20)),
    soft(supabase.from('medication_logs').select('medication_id, date, scheduled_time, taken, taken_at').eq('user_id', userId).gte('date', since(30)).limit(1500)),
    soft(supabase.from('pregnancies').select('start_date, end_date').eq('user_id', userId).limit(10)),
    // Separate query: the column comes from a later migration.
    soft(supabase.from('cycle_config').select('display_prefs').eq('user_id', userId).maybeSingle()),
  ]);

  const pcosRow: any = (pcos as any[] | null)?.[0];
  const first = <T,>(rows: unknown): T | null => ((rows as T[] | null) ?? [])[0] ?? null;
  const wb = first<any>(wellbeingRows);
  const clinical = buildClinicalContext({
    today: clinicalToday,
    periods: ((periods as any[] | null) ?? []).map((p) => ({ start_date: String(p.start_date), end_date: p.end_date ? String(p.end_date) : null })),
    bleedingSigns: ((bleedingRows as any[] | null) ?? []).map((s) => ({ date: String(s.date).slice(0, 10), flow: s.flow, clots: !!s.clots, pain: s.pain != null ? Number(s.pain) : null })),
    labs: ((labRows as any[] | null) ?? []).map((l) => ({
      marker: l.marker, value: Number(l.value), date: String(l.date).slice(0, 10),
      ref_low: l.ref_low != null ? Number(l.ref_low) : null, ref_high: l.ref_high != null ? Number(l.ref_high) : null,
    })),
    metrics: ((metricRows as any[] | null) ?? []).map((m) => ({ ...m, date: String(m.date).slice(0, 10) })),
    wellbeing: wb ? { ...wb, date: String(wb.date).slice(0, 10) } : null,
    ferriman: ((fgRows as any[] | null) ?? []).map((r) => ({ date: String(r.date).slice(0, 10), total: Number(r.total) })),
    medications: ((medRows as any[] | null) ?? []).map((m) => ({ ...m, times: m.times ?? [] })),
    medLogs: ((medLogRows as any[] | null) ?? []).map((l) => ({ ...l, date: String(l.date).slice(0, 10) })),
    onboarding: ((onboardingRow as any)?.onboarding_answers ?? null) as OnboardingAnswers | null,
    pregnancies: ((pregnancyRows as any[] | null) ?? []).map((p) => ({ start_date: String(p.start_date).slice(0, 10), end_date: p.end_date ? String(p.end_date).slice(0, 10) : null })),
  });
  const hideNumbers = (displayRow as any)?.display_prefs?.hideNumbers === true;
  return {
    ...clinical,
    hideNumbers,
    phase: hints.phase,
    cycleDay: hints.cycleDay,
    today,
    dietary: ((cfg as any)?.dietary_prefs ?? []) as string[],
    logs: ((logs as any[] | null) ?? []).map((l) => ({
      date: String(l.date).slice(0, 10),
      mood: l.mood,
      energy: l.energy_level,
      sleepHours: l.sleep_hours != null ? Number(l.sleep_hours) : null,
      symptoms: (l.symptoms ?? []) as string[],
    })),
    pcos: pcosRow
      ? {
          date: String(pcosRow.date).slice(0, 10),
          symptoms: {
            acne: pcosRow.acne, fatigue: pcosRow.fatigue, hirsutism: pcosRow.hirsutism,
            hair_loss: pcosRow.hair_loss, mood_swings: pcosRow.mood_swings, bloating: pcosRow.bloating,
          },
        }
      : null,
    medications: ((meds as any[] | null) ?? []).map((m) => ({ name: m.name, dose: m.dose, times: (m.times ?? []) as string[] })),
    pantry: ((pantry as any[] | null) ?? []).map((p) => p.name as string),
    plannedMeals: ((meals as any[] | null) ?? []).map((m) => ({ slot: m.slot, title: m.title, done: !!m.done })),
    plannedWorkout: workout ? { title: (workout as any).title, kind: (workout as any).kind, done: !!(workout as any).done } : null,
  };
}
