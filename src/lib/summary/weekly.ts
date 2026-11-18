import { addDays } from '@/lib/planner/week';

export interface SummaryLog {
  date: string; // YYYY-MM-DD
  energy: number | null;
  sleepHours: number | null;
  symptoms: string[];
  /** Quick check-in cravings ('sweet' | 'salty' | 'carbs'). */
  cravings?: string[];
}

export interface Adherence {
  mealsDone: number;
  mealsPlanned: number;
  workoutsDone: number;
  workoutsPlanned: number;
}

export interface WeeklySummary {
  /** Days with a log in the last 7 days. */
  loggedDays: number;
  avgEnergy: number | null;
  avgSleep: number | null;
  insights: string[];
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (n: number) => Math.round(n * 10) / 10;
const nums = (xs: (number | null)[]) => xs.filter((x): x is number => x != null);

const PHASE_ES: Record<string, string> = { Menstrual: 'menstrual', Follicular: 'folicular', Ovulation: 'ovulatoria', Luteal: 'lútea' };
const PHASE_EN: Record<string, string> = { Menstrual: 'menstrual', Follicular: 'follicular', Ovulation: 'ovulation', Luteal: 'luteal' };

/** Minimum gap (energy points out of 10) before a difference is worth mentioning. */
const MIN_ENERGY_GAP = 1;
const SHORT_SLEEP_HOURS = 6.5;

/**
 * Compares the last 7 days ending at `endDate` against the 7 before, computed from the user's own logs.
 * Wording says "coincided", not "caused": these are patterns in a few days of data.
 */
export function buildWeeklySummary(params: {
  logs: SummaryLog[];
  endDate: string;
  phaseOf: (date: string) => string;
  adherence?: Adherence;
  /** Dates with any movement (logged workouts or completed planned ones). */
  moveDates?: string[];
  /** False with irregular cycles, hormonal contraception or low confidence: no phase patterns then. */
  phaseReliable?: boolean;
  language: 'en' | 'es';
}): WeeklySummary {
  const { logs, endDate, phaseOf, adherence, moveDates, phaseReliable = true, language } = params;
  const es = language === 'es';
  const phaseName = (p: string) => (es ? PHASE_ES : PHASE_EN)[p] ?? p;

  const weekStart = addDays(endDate, -6);
  const prevStart = addDays(endDate, -13);
  const prevEnd = addDays(endDate, -7);
  const thisWeek = logs.filter((l) => l.date >= weekStart && l.date <= endDate);
  const prevWeek = logs.filter((l) => l.date >= prevStart && l.date <= prevEnd);

  const insights: string[] = [];

  // 1. Energy vs previous week
  const e1 = avg(nums(thisWeek.map((l) => l.energy)));
  const e0 = avg(nums(prevWeek.map((l) => l.energy)));
  if (e1 != null && e0 != null && Math.abs(e1 - e0) >= MIN_ENERGY_GAP) {
    const up = e1 > e0;
    insights.push(
      es
        ? `Tu energía promedio ${up ? 'subió' : 'bajó'} de ${r1(e0)} a ${r1(e1)} sobre 10 respecto a la semana anterior.`
        : `Your average energy ${up ? 'rose' : 'dropped'} from ${r1(e0)} to ${r1(e1)} out of 10 compared with last week.`,
    );
  }

  // 2. Energy by cycle phase (only when the week spans phases and the phase is trustworthy)
  const byPhase = new Map<string, number[]>();
  for (const l of thisWeek) {
    if (l.energy == null) continue;
    const p = phaseOf(l.date);
    byPhase.set(p, [...(byPhase.get(p) ?? []), l.energy]);
  }
  if (phaseReliable && byPhase.size >= 2) {
    const rows = Array.from(byPhase.entries()).map(([p, v]) => ({ p, a: avg(v)!, n: v.length }));
    const low = rows.reduce((m, r) => (r.a < m.a ? r : m));
    const rest = avg(rows.filter((r) => r !== low).flatMap((r) => byPhase.get(r.p)!))!;
    if (rest - low.a >= MIN_ENERGY_GAP) {
      insights.push(
        es
          ? `Tu energía fue más baja en la fase ${phaseName(low.p)} (${r1(low.a)}) que en el resto de la semana (${r1(rest)}).`
          : `Your energy was lowest in the ${phaseName(low.p)} phase (${r1(low.a)}) versus the rest of the week (${r1(rest)}).`,
      );
    }
  }

  // 3. Sleep vs energy (same day)
  const paired = thisWeek.filter((l) => l.energy != null && l.sleepHours != null);
  const short = paired.filter((l) => l.sleepHours! < SHORT_SLEEP_HOURS);
  const enough = paired.filter((l) => l.sleepHours! >= SHORT_SLEEP_HOURS);
  if (short.length >= 2 && enough.length >= 2) {
    const es1 = avg(short.map((l) => l.energy!))!;
    const es2 = avg(enough.map((l) => l.energy!))!;
    if (es2 - es1 >= MIN_ENERGY_GAP) {
      insights.push(
        es
          ? `Los días que dormiste menos de ${SHORT_SLEEP_HOURS} h tu energía fue ${r1(es1)}, frente a ${r1(es2)} cuando dormiste más. Coincidió con dormir menos.`
          : `On days you slept under ${SHORT_SLEEP_HOURS} h your energy was ${r1(es1)}, versus ${r1(es2)} on longer nights. It coincided with sleeping less.`,
      );
    }
  }

  // 4. Repeated symptoms
  const counts = new Map<string, number>();
  for (const l of thisWeek) for (const s of new Set(l.symptoms.map((x) => x.trim().toLowerCase()).filter(Boolean))) counts.set(s, (counts.get(s) ?? 0) + 1);
  const repeated = Array.from(counts.entries()).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (repeated.length) {
    const list = repeated.map(([s, n]) => `${s} (${n} ${es ? 'días' : 'days'})`).join(', ');
    insights.push(es ? `Síntomas que se repitieron: ${list}.` : `Symptoms that repeated: ${list}.`);
  }

  // 5. Cravings: phase concentration and short sleep, over both weeks for enough days
  const cravingDay = (l: SummaryLog) => (l.cravings?.length ?? 0) > 0 || l.symptoms.includes('Sugar Cravings');
  const twoWeeks = logs.filter((l) => l.date >= prevStart && l.date <= endDate);
  const cravingDays = twoWeeks.filter(cravingDay);
  if (phaseReliable && cravingDays.length >= 3) {
    const perPhase = new Map<string, number>();
    for (const l of cravingDays) { const p = phaseOf(l.date); perPhase.set(p, (perPhase.get(p) ?? 0) + 1); }
    const [topPhase, topCount] = Array.from(perPhase.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topCount >= 2 && topCount / cravingDays.length >= 0.6) {
      insights.push(
        es
          ? `De tus ${cravingDays.length} días con antojos en las últimas dos semanas, ${topCount} fueron en la fase ${phaseName(topPhase)}. Saberlo ayuda a tener a mano opciones con proteína y fibra esos días.`
          : `Of your ${cravingDays.length} days with cravings in the last two weeks, ${topCount} were in the ${phaseName(topPhase)} phase. Knowing it helps to keep protein and fiber options at hand on those days.`,
      );
    }
  }
  const withSleep = twoWeeks.filter((l) => l.sleepHours != null);
  const shortNights = withSleep.filter((l) => l.sleepHours! < SHORT_SLEEP_HOURS);
  const longNights = withSleep.filter((l) => l.sleepHours! >= SHORT_SLEEP_HOURS);
  const rate = (ls: SummaryLog[]) => Math.round((ls.filter(cravingDay).length / ls.length) * 100);
  if (shortNights.length >= 2 && longNights.length >= 2 && rate(shortNights) - rate(longNights) >= 30) {
    insights.push(
      es
        ? `Tuviste antojos el ${rate(shortNights)}% de los días con menos de ${SHORT_SLEEP_HOURS} h de sueño, frente al ${rate(longNights)}% cuando dormiste más. Dormir poco sube los antojos: no es falta de voluntad.`
        : `You had cravings on ${rate(shortNights)}% of days after under ${SHORT_SLEEP_HOURS} h of sleep, versus ${rate(longNights)}% after longer nights. Short sleep raises cravings: it isn't a lack of willpower.`,
    );
  }

  // 6. Movement: days moved this week and next-day energy
  if (moveDates) {
    const moved = new Set(moveDates);
    const movedThisWeek = Array.from(moved).filter((d) => d >= weekStart && d <= endDate).length;
    if (movedThisWeek > 0) {
      insights.push(
        es
          ? `Te moviste ${movedThisWeek} de 7 días${movedThisWeek >= 3 ? '. Esa constancia es lo que más ayuda con la insulina.' : '. Cada sesión, aunque sea de 10 minutos, cuenta.'}`
          : `You moved on ${movedThisWeek} of 7 days${movedThisWeek >= 3 ? '. That consistency is what helps insulin most.' : '. Every session, even 10 minutes, counts.'}`,
      );
    }
    const energyLogs = twoWeeks.filter((l) => l.energy != null);
    const after = energyLogs.filter((l) => moved.has(addDays(l.date, -1))).map((l) => l.energy!);
    const notAfter = energyLogs.filter((l) => !moved.has(addDays(l.date, -1))).map((l) => l.energy!);
    if (after.length >= 2 && notAfter.length >= 2) {
      const a = avg(after)!, b = avg(notAfter)!;
      if (a - b >= MIN_ENERGY_GAP) {
        insights.push(
          es
            ? `El día después de moverte tu energía fue ${r1(a)} sobre 10, frente a ${r1(b)} los demás días.`
            : `The day after moving, your energy was ${r1(a)} out of 10, versus ${r1(b)} on other days.`,
        );
      }
    }
  }

  // 7. Plan adherence
  if (adherence && (adherence.mealsPlanned > 0 || adherence.workoutsPlanned > 0)) {
    const parts: string[] = [];
    if (adherence.mealsPlanned > 0) parts.push(es ? `${adherence.mealsDone}/${adherence.mealsPlanned} comidas` : `${adherence.mealsDone}/${adherence.mealsPlanned} meals`);
    if (adherence.workoutsPlanned > 0) parts.push(es ? `${adherence.workoutsDone}/${adherence.workoutsPlanned} entrenos` : `${adherence.workoutsDone}/${adherence.workoutsPlanned} workouts`);
    insights.push(es ? `Cumpliste ${parts.join(' y ')} de tu plan.` : `You completed ${parts.join(' and ')} of your plan.`);
  }

  return {
    loggedDays: thisWeek.length,
    avgEnergy: e1 != null ? r1(e1) : null,
    avgSleep: avg(nums(thisWeek.map((l) => l.sleepHours))) != null ? r1(avg(nums(thisWeek.map((l) => l.sleepHours)))!) : null,
    insights,
  };
}
