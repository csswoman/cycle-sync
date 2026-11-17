/**
 * Pregnancy intervals, so cycle statistics and predictions do not treat them as a cycle.
 * This is not pregnancy tracking: it only lets the app stop giving wrong information.
 */
export interface Pregnancy {
  id?: string;
  /** Estimated start (usually the last period before the positive test), YYYY-MM-DD. */
  start_date: string;
  positive_test_date?: string | null;
  /** Null while the pregnancy is active. No outcome is stored. */
  end_date: string | null;
}
const day = (s: string) => s.slice(0, 10);
/** Pregnancy that has started and not ended on `today`, or null. */
export function activePregnancy<T extends Pregnancy>(pregnancies: T[], today: string): T | null {
  const t = day(today);
  const open = pregnancies
    .filter((p) => day(p.start_date) <= t && (!p.end_date || day(p.end_date) > t))
    .sort((a, b) => day(b.start_date).localeCompare(day(a.start_date)));
  return open[0] ?? null;
}
/** True when a pregnancy overlaps the interval [from, to) between two consecutive period starts. */
export function spansPregnancy(from: string, to: string, pregnancies: Pregnancy[]): boolean {
  const a = day(from);
  const b = day(to);
  return pregnancies.some((p) => day(p.start_date) < b && (!p.end_date || day(p.end_date) >= a));
}
/**
 * Splits period starts into runs where no pregnancy sits between two consecutive starts.
 * Lengths computed inside each run are real cycles; the interval across a pregnancy is dropped.
 */
export function excludePregnancyGaps(starts: string[], pregnancies: Pregnancy[]): string[][] {
  const sorted = [...new Set(starts.map(day))].sort();
  const runs: string[][] = [];
  for (const s of sorted) {
    const run = runs[runs.length - 1];
    if (run && !spansPregnancy(run[run.length - 1], s, pregnancies)) run.push(s);
    else runs.push([s]);
  }
  return runs;
}
/** Consecutive start pairs that are real cycles (no pregnancy between them). */
export function cyclePairs(starts: string[], pregnancies: Pregnancy[] = []): [string, string][] {
  const pairs: [string, string][] = [];
  for (const run of excludePregnancyGaps(starts, pregnancies)) {
    for (let i = 1; i < run.length; i++) pairs.push([run[i - 1], run[i]]);
  }
  return pairs;
}
/** Weeks and days of gestation counted from start_date; null when not started. */
export function gestationalAge(pregnancy: Pregnancy, today: string): { weeks: number; days: number } | null {
  const [y1, m1, d1] = day(pregnancy.start_date).split('-').map(Number);
  const [y2, m2, d2] = day(today).split('-').map(Number);
  const n = Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86_400_000);
  return n < 0 ? null : { weeks: Math.floor(n / 7), days: n % 7 };
}
/**
 * Predictions (next period, fertile window, late alerts) stay off while a pregnancy is active and
 * after it ends, until a period is logged that starts after the pregnancy began.
 */
export function predictionsPaused(lastPeriodStart: string | null, pregnancies: Pregnancy[], today: string): boolean {
  if (activePregnancy(pregnancies, today)) return true;
  if (!lastPeriodStart) return false;
  const last = day(lastPeriodStart);
  return pregnancies.some((p) => day(p.start_date) <= day(today) && day(p.start_date) >= last);
}
