/**
 * Cycle estimates from logged period history. Everything here is an approximation:
 * ovulation is placed a fixed luteal length (14 days) before the next period, which is the
 * standard calendar-method assumption. Irregular cycles widen the margins and lower confidence.
 */

export interface PeriodRun {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD (inclusive)
}

export interface CycleEstimate {
  /** Mean cycle length in days (history if available, otherwise the configured length). */
  cycleLength: number;
  /** Standard deviation of observed cycle lengths (0 with fewer than 2 cycles). */
  variability: number;
  /** Observed cycle lengths (most recent last, up to MAX_CYCLES_USED). */
  lengths: number[];
  /** Average bleeding days per period. */
  periodLength: number;
  /** Cycle day (1 = first day of period) on which ovulation is expected. */
  ovulationDay: number;
  fertileStartDay: number;
  fertileEndDay: number;
  irregular: boolean;
  confidence: 'low' | 'medium' | 'high';
}

export interface CycleProjection {
  periodStart: Date;
  /** Range for the period start (only wider than a day when the history is variable). */
  periodEarliest: Date;
  periodLatest: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
}

export const LUTEAL_LENGTH = 14;
const MAX_CYCLES_USED = 6;
const MIN_PLAUSIBLE = 15;
const MAX_PLAUSIBLE = 120;
const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * Groups individually marked bleeding days into periods. Days at most 2 apart (one skipped day)
 * belong to the same period, since bleeding often pauses for a day.
 */
export function groupDaysIntoPeriods(days: string[]): PeriodRun[] {
  const sorted = Array.from(new Set(days.map((d) => d.slice(0, 10)))).sort();
  const runs: PeriodRun[] = [];
  for (const day of sorted) {
    const last = runs[runs.length - 1];
    if (last && daysBetween(parseLocalDate(last.end), parseLocalDate(day)) <= 2) {
      last.end = day;
    } else {
      runs.push({ start: day, end: day });
    }
  }
  return runs;
}

/** Days between consecutive period starts, ignoring implausible gaps (missing months, typos). */
export function cycleLengthsFromStarts(starts: string[]): number[] {
  const dates = Array.from(new Set(starts.map((s) => s.slice(0, 10)))).sort().map(parseLocalDate);
  const lengths: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const len = daysBetween(dates[i - 1], dates[i]);
    if (len >= MIN_PLAUSIBLE && len <= MAX_PLAUSIBLE) lengths.push(len);
  }
  return lengths;
}

export interface PeriodInput {
  start_date: string;
  end_date?: string | null;
}

export function estimateCycle(periods: PeriodInput[], configCycleLength?: number | null): CycleEstimate {
  const lengths = cycleLengthsFromStarts(periods.map((p) => p.start_date)).slice(-MAX_CYCLES_USED);
  const fallback = configCycleLength && configCycleLength > 0 ? configCycleLength : DEFAULT_CYCLE;

  const mean = lengths.length ? lengths.reduce((s, v) => s + v, 0) / lengths.length : fallback;
  const variability = lengths.length >= 2
    ? Math.sqrt(lengths.reduce((s, v) => s + (v - mean) ** 2, 0) / lengths.length)
    : 0;
  const cycleLength = Math.round(mean);

  const bleed = periods
    .filter((p) => p.end_date)
    .map((p) => daysBetween(parseLocalDate(p.start_date), parseLocalDate(p.end_date as string)) + 1)
    .filter((n) => n >= 1 && n <= 14);
  const periodLength = bleed.length ? Math.round(bleed.reduce((s, v) => s + v, 0) / bleed.length) : DEFAULT_PERIOD;

  const ovulationDay = Math.max(periodLength + 3, cycleLength - LUTEAL_LENGTH);
  const irregular = lengths.length >= 2 && Math.max(...lengths) - Math.min(...lengths) > 7;
  const confidence: CycleEstimate['confidence'] =
    lengths.length >= 6 ? 'high' : lengths.length >= 3 ? 'medium' : 'low';

  return {
    cycleLength,
    variability,
    lengths,
    periodLength,
    ovulationDay,
    fertileStartDay: Math.max(1, ovulationDay - 5),
    fertileEndDay: ovulationDay + 1,
    irregular,
    confidence: irregular && confidence === 'high' ? 'medium' : confidence,
  };
}

/**
 * Upcoming cycles starting from the last logged period. Each projection moves forward by the
 * mean cycle length. The period range widens by the observed variability.
 */
export function projectCycles(lastPeriodStart: string, estimate: CycleEstimate, count = 3): CycleProjection[] {
  const base = parseLocalDate(lastPeriodStart);
  const margin = Math.max(estimate.lengths.length >= 2 ? Math.round(estimate.variability) : 0, 0);
  const out: CycleProjection[] = [];
  for (let i = 1; i <= count; i++) {
    const periodStart = addDays(base, estimate.cycleLength * i);
    const ovulation = addDays(periodStart, -LUTEAL_LENGTH);
    out.push({
      periodStart,
      periodEarliest: addDays(periodStart, -margin),
      periodLatest: addDays(periodStart, margin),
      ovulation,
      fertileStart: addDays(ovulation, -5),
      fertileEnd: addDays(ovulation, 1),
    });
  }
  return out;
}
