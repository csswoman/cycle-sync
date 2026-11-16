/**
 * Cycle estimates from logged period history. Everything here is an approximation:
 * ovulation is placed a fixed luteal length (14 days) before the next period, which is the
 * standard calendar-method assumption. Irregular cycles widen the margins and lower confidence.
 *
 * Choices made for PMOS / PCOS, where long and variable cycles are the norm:
 * - The typical length is the median of the recent cycles, so one 60-day cycle does not drag
 *   every later prediction the way a mean does.
 * - The next period is a range (shortestExpected..longestExpected), not a single date.
 * - A cycle never restarts by itself: until a new period is logged the day count keeps growing
 *   and the period is reported as late (see computeCycleInfo).
 */

export interface PeriodRun {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD (inclusive)
}

export interface CycleEstimate {
  /** Typical cycle length in days: median of the recent cycles, otherwise the configured length. */
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
  /** Shortest and longest length expected for the current cycle (days from its start to the next period). */
  shortestExpected: number;
  longestExpected: number;
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
/** Margin around the typical length while there are fewer than MIN_CYCLES_FOR_RANGE cycles. */
const FALLBACK_MARGIN = 7;
/** A very regular history still gets this margin: nobody is regular to the day. */
const MIN_MARGIN = 2;
const MIN_CYCLES_FOR_RANGE = 3;
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

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function estimateCycle(periods: PeriodInput[], configCycleLength?: number | null): CycleEstimate {
  const lengths = cycleLengthsFromStarts(periods.map((p) => p.start_date)).slice(-MAX_CYCLES_USED);
  const fallback = configCycleLength && configCycleLength > 0 ? configCycleLength : DEFAULT_CYCLE;

  const mean = lengths.length ? lengths.reduce((s, v) => s + v, 0) / lengths.length : fallback;
  const variability = lengths.length >= 2
    ? Math.sqrt(lengths.reduce((s, v) => s + (v - mean) ** 2, 0) / lengths.length)
    : 0;
  const cycleLength = Math.round(lengths.length ? median(lengths) : fallback);
  const min = lengths.length ? Math.min(...lengths) : cycleLength;
  const max = lengths.length ? Math.max(...lengths) : cycleLength;

  let shortestExpected: number;
  let longestExpected: number;
  if (lengths.length >= MIN_CYCLES_FOR_RANGE) {
    // One standard deviation around the typical length, kept inside what was actually observed.
    shortestExpected = Math.min(Math.max(min, Math.round(cycleLength - variability)), cycleLength - MIN_MARGIN);
    longestExpected = Math.max(Math.min(max, Math.round(cycleLength + variability)), cycleLength + MIN_MARGIN);
  } else {
    const spread = Math.max(FALLBACK_MARGIN, Math.ceil((max - min) / 2));
    shortestExpected = cycleLength - spread;
    longestExpected = cycleLength + spread;
  }

  const bleed = periods
    .filter((p) => p.end_date)
    .map((p) => daysBetween(parseLocalDate(p.start_date), parseLocalDate(p.end_date as string)) + 1)
    .filter((n) => n >= 1 && n <= 14);
  const periodLength = bleed.length ? Math.round(bleed.reduce((s, v) => s + v, 0) / bleed.length) : DEFAULT_PERIOD;

  // Cycle day that falls LUTEAL_LENGTH days before the next expected period (day 15 of a 28-day cycle).
  const ovulationDay = Math.max(periodLength + 3, cycleLength - LUTEAL_LENGTH + 1);
  const irregular = lengths.length >= 2 && max - min > 7;
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
    shortestExpected,
    longestExpected,
    irregular,
    confidence: irregular && confidence === 'high' ? 'medium' : confidence,
  };
}

/**
 * Upcoming cycles starting from the last logged period. Each projection moves forward by the
 * typical cycle length; the period range and the ovulation dates come from the same estimate
 * that drives the cycle day and phase, so every screen shows the same dates.
 */
export function projectCycles(lastPeriodStart: string, estimate: CycleEstimate, count = 3): CycleProjection[] {
  const base = parseLocalDate(lastPeriodStart);
  const out: CycleProjection[] = [];
  for (let i = 1; i <= count; i++) {
    const cycleStart = addDays(base, estimate.cycleLength * (i - 1));
    out.push({
      periodStart: addDays(cycleStart, estimate.cycleLength),
      periodEarliest: addDays(cycleStart, estimate.shortestExpected),
      periodLatest: addDays(cycleStart, estimate.longestExpected),
      ovulation: addDays(cycleStart, estimate.ovulationDay - 1),
      fertileStart: addDays(cycleStart, estimate.fertileStartDay - 1),
      fertileEnd: addDays(cycleStart, estimate.fertileEndDay - 1),
    });
  }
  return out;
}
