import { daysBetween, estimateCycle, projectCycles } from '@/lib/cycle/cycleEngine';

export interface PeriodForecast {
  /** Earliest and latest likely start dates (local midnight). */
  earliest: Date;
  latest: Date;
  /** Cycle lengths (days) between consecutive logged period starts used for the estimate. */
  cycleLengths: number[];
  confidence: 'low' | 'medium' | 'high';
  /** True when the observed cycles vary by more than a week. */
  irregular: boolean;
  /** Days past the latest expected date without a new period; 0 when not overdue. */
  overdueDays: number;
}

/**
 * Predicts the next period as a date range. With PMOS the 28-day assumption fails, so the range
 * comes from the user's own cycle history. This is a view over the shared cycle engine, so the
 * PMOS card, the dashboard and the period history always agree on the dates.
 */
export function forecastNextPeriod(
  periodStarts: string[],
  configCycleLength: number | null,
  configLastPeriodStart: string | null,
  now: Date = new Date(),
): PeriodForecast | null {
  const starts = Array.from(new Set(periodStarts.map((s) => s.slice(0, 10)))).sort();
  const last = starts.length ? starts[starts.length - 1] : configLastPeriodStart?.slice(0, 10) ?? null;
  if (!last) return null;

  const estimate = estimateCycle(starts.map((s) => ({ start_date: s })), configCycleLength);
  const [next] = projectCycles(last, estimate, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    earliest: next.periodEarliest,
    latest: next.periodLatest,
    cycleLengths: estimate.lengths,
    confidence: estimate.confidence,
    irregular: estimate.irregular,
    overdueDays: Math.max(0, daysBetween(next.periodLatest, today)),
  };
}
