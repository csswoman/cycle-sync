import { addDays, daysBetween, parseLocalDate, toISODate as toIso, type PeriodInput } from './cycleEngine';
import { activePregnancy, cyclePairs, predictionsPaused, type Pregnancy } from './pregnancy';
import { heavyAfterGap, heavyPeriods, type BleedingSign } from './bleeding';

export type Rating = 'normal' | 'abnormal';

export interface CycleAnalysis {
  /** Last cycle lengths, oldest first (max 6): exact days between consecutive period starts. */
  cycles: number[];
  lastCycle: number | null;
  min: number;
  max: number;
  mean: number;
  /** Last cycle minus the one before it; null with fewer than 2 cycles. */
  variation: number | null;
  cycleRating: Rating;
  /** Bleeding days of the last 6 periods that have an end date, oldest first. */
  periodLengths: number[];
  lastPeriodLength: number | null;
  periodMean: number;
  periodRating: Rating;
  /** Days until the expected next period (negative when late), from the mean of the last cycles. */
  daysToNextPeriod: number | null;
}

export const NORMAL_CYCLE_MIN = 21;
export const NORMAL_CYCLE_MAX = 35;
export const MAX_REGULAR_DIFFERENCE = 7;
export const NORMAL_PERIOD_MIN = 2;
export const NORMAL_PERIOD_MAX = 7;

export function analyzeCycles(periods: PeriodInput[], now: Date = new Date(), pregnancies: Pregnancy[] = []): CycleAnalysis {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const starts = Array.from(new Set(sorted.map((p) => p.start_date.slice(0, 10))));

  const all: number[] = [];
  for (const [a, b] of cyclePairs(starts, pregnancies)) {
    all.push(daysBetween(parseLocalDate(a), parseLocalDate(b)));
  }
  const cycles = all.slice(-6);
  const min = cycles.length ? Math.min(...cycles) : 0;
  const max = cycles.length ? Math.max(...cycles) : 0;
  const mean = cycles.length ? Math.round(cycles.reduce((s, v) => s + v, 0) / cycles.length) : 0;
  const cycleRating: Rating =
    cycles.length > 0 && cycles.every((c) => c >= NORMAL_CYCLE_MIN && c <= NORMAL_CYCLE_MAX) && max - min <= MAX_REGULAR_DIFFERENCE
      ? 'normal' : 'abnormal';

  const periodLengths = sorted
    .filter((p) => p.end_date)
    .map((p) => daysBetween(parseLocalDate(p.start_date), parseLocalDate(p.end_date as string)) + 1)
    .filter((n) => n >= 1)
    .slice(-6);
  const periodMean = periodLengths.length ? Math.round(periodLengths.reduce((s, v) => s + v, 0) / periodLengths.length) : 0;
  const periodRating: Rating =
    periodLengths.length > 0 && periodLengths.every((n) => n >= NORMAL_PERIOD_MIN && n <= NORMAL_PERIOD_MAX) ? 'normal' : 'abnormal';

  let daysToNextPeriod: number | null = null;
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (starts.length && mean > 0 && !predictionsPaused(starts[starts.length - 1], pregnancies, todayIso)) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    daysToNextPeriod = daysBetween(today, addDays(parseLocalDate(starts[starts.length - 1]), mean));
  }

  return {
    cycles,
    lastCycle: cycles.length ? cycles[cycles.length - 1] : null,
    min,
    max,
    mean,
    variation: cycles.length >= 2 ? cycles[cycles.length - 1] - cycles[cycles.length - 2] : null,
    cycleRating,
    periodLengths,
    lastPeriodLength: periodLengths.length ? periodLengths[periodLengths.length - 1] : null,
    periodMean,
    periodRating,
    daysToNextPeriod,
  };
}

/**
 * Patterns worth raising with a clinician. Thresholds follow the 2023 International Evidence-based
 * Guideline for PCOS (irregular cycles in adults: shorter than 21 or longer than 35 days, fewer
 * than 8 cycles a year, or any single cycle longer than 90 days) and FIGO (bleeding longer than
 * 8 days is prolonged). They describe the log, they are not a diagnosis.
 */
export type CycleFlag = 'noPeriod90' | 'longCycles' | 'shortCycles' | 'fewPeriodsYear' | 'longBleeding' | 'heavyBleeding' | 'heavyAfterGap';

export const NO_PERIOD_DAYS = 90;
export const MIN_CYCLES_PER_YEAR = 8;
export const PROLONGED_BLEEDING_DAYS = 8;

/** `signs` (optional) adds the heavy-bleeding flags from the per-day flow log. */
export function cycleHealthFlags(periods: PeriodInput[], now: Date = new Date(), signs: BleedingSign[] = [], pregnancies: Pregnancy[] = []): CycleFlag[] {
  const starts = Array.from(new Set(periods.map((p) => p.start_date.slice(0, 10)))).sort().map(parseLocalDate);
  if (starts.length === 0) return [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const flags: CycleFlag[] = [];

  // During a pregnancy nothing in the period log is a warning. After it, days without a period
  // count from the end of the pregnancy, not from the last period before it.
  const todayIso = toIso(today);
  if (activePregnancy(pregnancies, todayIso)) return [];
  const lastStartIso = toIso(starts[starts.length - 1]);
  const lastEnded = pregnancies
    .filter((p) => p.end_date && p.start_date.slice(0, 10) >= lastStartIso)
    .map((p) => (p.end_date as string).slice(0, 10))
    .sort()
    .pop();
  const reference = lastEnded ? parseLocalDate(lastEnded) : starts[starts.length - 1];
  if (daysBetween(reference, today) > NO_PERIOD_DAYS) flags.push('noPeriod90');

  const cycles: number[] = cyclePairs(starts.map((d) => toIso(d)), pregnancies)
    .map(([a, b]) => daysBetween(parseLocalDate(a), parseLocalDate(b)));
  const recent = cycles.slice(-6);
  // Two cycles outside the range make it a pattern; a single one can be a one-off.
  if (recent.filter((c) => c > NORMAL_CYCLE_MAX).length >= 2) flags.push('longCycles');
  if (recent.filter((c) => c < NORMAL_CYCLE_MIN).length >= 2) flags.push('shortCycles');

  // Only meaningful with a full year of tracking behind the user.
  const yearAgo = addDays(today, -365);
  const pregnantLastYear = pregnancies.some((p) => !p.end_date || parseLocalDate(p.end_date) > yearAgo);
  if (!pregnantLastYear && starts[0] <= yearAgo && starts.filter((s) => s > yearAgo).length < MIN_CYCLES_PER_YEAR) flags.push('fewPeriodsYear');

  const bleeds = [...periods]
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .filter((p) => p.end_date)
    .map((p) => daysBetween(parseLocalDate(p.start_date), parseLocalDate(p.end_date as string)) + 1)
    .slice(-3);
  if (bleeds.filter((n) => n > PROLONGED_BLEEDING_DAYS).length >= 2) flags.push('longBleeding');
  if (heavyPeriods(periods, signs).length > 0) flags.push('heavyBleeding');
  if (heavyAfterGap(periods, signs)) flags.push('heavyAfterGap');

  return flags;
}
