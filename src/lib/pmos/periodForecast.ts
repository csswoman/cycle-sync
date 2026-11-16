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

const MAX_CYCLES_USED = 6;
const MIN_PLAUSIBLE = 15;
const MAX_PLAUSIBLE = 120;
const FALLBACK_MARGIN = 7;
const MIN_MARGIN = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses 'YYYY-MM-DD' as a local date (new Date('YYYY-MM-DD') is UTC and shifts the day west of UTC). */
function parseLocalDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * Predicts the next period as a date range. With PMOS the 28-day assumption fails, so the range
 * comes from the user's own cycle history (mean +/- one standard deviation, kept inside the
 * observed min/max). With fewer than 3 cycles it falls back to a wide margin around the known
 * (or configured) cycle length.
 */
export function forecastNextPeriod(
  periodStarts: string[],
  configCycleLength: number | null,
  configLastPeriodStart: string | null,
  now: Date = new Date(),
): PeriodForecast | null {
  const starts = Array.from(new Set(periodStarts.map((s) => s.slice(0, 10)))).sort().map(parseLocalDate);
  if (starts.length === 0 && configLastPeriodStart) starts.push(parseLocalDate(configLastPeriodStart));
  if (starts.length === 0) return null;

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i - 1], starts[i]);
    if (len >= MIN_PLAUSIBLE && len <= MAX_PLAUSIBLE) lengths.push(len);
  }
  const recent = lengths.slice(-MAX_CYCLES_USED);
  const last = starts[starts.length - 1];

  let low: number;
  let high: number;
  let confidence: PeriodForecast['confidence'];
  const min = recent.length ? Math.min(...recent) : 0;
  const max = recent.length ? Math.max(...recent) : 0;

  if (recent.length >= 3) {
    const mean = recent.reduce((s, v) => s + v, 0) / recent.length;
    const sd = Math.sqrt(recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length);
    low = Math.max(min, Math.round(mean - sd));
    high = Math.min(max, Math.round(mean + sd));
    // Keep a minimum window around the mean so a very regular history still shows a range.
    low = Math.min(low, Math.round(mean) - MIN_MARGIN);
    high = Math.max(high, Math.round(mean) + MIN_MARGIN);
    confidence = recent.length >= MAX_CYCLES_USED ? 'high' : 'medium';
  } else {
    const base = recent.length
      ? Math.round(recent.reduce((s, v) => s + v, 0) / recent.length)
      : configCycleLength || 28;
    const spread = Math.max(FALLBACK_MARGIN, Math.ceil((max - min) / 2));
    low = base - spread;
    high = base + spread;
    confidence = 'low';
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const latest = addDays(last, high);
  return {
    earliest: addDays(last, low),
    latest,
    cycleLengths: recent,
    confidence,
    irregular: recent.length > 0 && max - min > 7,
    overdueDays: Math.max(0, daysBetween(latest, today)),
  };
}
