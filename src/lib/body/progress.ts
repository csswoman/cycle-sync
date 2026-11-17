// Body progress: weight and measurements over time. Pure functions so they can be tested.
import type { PMOSMetricEntry } from '@/lib/pmos/metrics';

export type MeasureKey = 'weight_kg' | 'waist_cm' | 'abdomen_cm' | 'hip_cm' | 'chest_cm' | 'arm_cm' | 'thigh_cm';

export interface MeasureInfo {
  key: MeasureKey;
  label: string;
  unit: 'kg' | 'cm';
  /** How to measure it the same way every time. */
  how: string;
}

export const MEASURES: MeasureInfo[] = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', how: 'Por la mañana, después de ir al baño y antes de desayunar, con poca ropa.' },
  { key: 'waist_cm', label: 'Cintura', unit: 'cm', how: 'En la parte más estrecha, entre la última costilla y el hueso de la cadera, al final de una exhalación normal.' },
  { key: 'abdomen_cm', label: 'Abdomen', unit: 'cm', how: 'A la altura del ombligo, de pie y relajada, sin meter el estómago.' },
  { key: 'hip_cm', label: 'Cadera', unit: 'cm', how: 'En la parte más ancha de los glúteos, con los pies juntos.' },
  { key: 'chest_cm', label: 'Busto', unit: 'cm', how: 'En la parte más saliente del busto, con un sostén sin relleno.' },
  { key: 'arm_cm', label: 'Brazo', unit: 'cm', how: 'A mitad del brazo, entre el hombro y el codo, con el brazo relajado.' },
  { key: 'thigh_cm', label: 'Muslo', unit: 'cm', how: 'En la parte más ancha del muslo, justo debajo del glúteo.' },
];

export interface ProgressPoint {
  date: string;
  value: number;
}

/** Values of one measure, oldest first; several on one day keep the last. */
export function measureSeries(entries: PMOSMetricEntry[], key: MeasureKey): ProgressPoint[] {
  const byDate = new Map<string, number>();
  for (const e of entries) {
    const raw = e[key];
    if (raw == null) continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) byDate.set(e.date, value);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export interface ProgressSummary {
  start: ProgressPoint;
  latest: ProgressPoint;
  /** latest - start, rounded to 0.1. Negative means it went down. */
  change: number;
  /** Change as a percent of the start value. */
  changePercent: number;
  days: number;
}

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/**
 * Start vs latest. `start` overrides the first entry (the starting weight saved
 * in the profile), as long as it is not after the latest entry.
 */
export function progressSummary(series: ProgressPoint[], start?: ProgressPoint | null): ProgressSummary | null {
  if (series.length === 0) return null;
  const latest = series[series.length - 1];
  const first = start && start.value > 0 && start.date <= latest.date ? start : series[0];
  const change = Math.round((latest.value - first.value) * 10) / 10;
  return {
    start: first,
    latest,
    change,
    changePercent: first.value > 0 ? Math.round((change / first.value) * 1000) / 10 : 0,
    days: Math.max(0, daysBetween(first.date, latest.date)),
  };
}

export type RatePace = 'gain' | 'stable' | 'steady' | 'fast';

export interface WeightRate {
  /** kg per week, negative when losing. */
  kgPerWeek: number;
  /** Percent of body weight per week. */
  percentPerWeek: number;
  pace: RatePace;
}

/**
 * Average weekly change over the last `windowDays` (default 28), from the
 * first and last weight in that window. Needs at least 2 weights 7+ days apart.
 * Losing more than 1% of body weight per week tends to cost muscle.
 */
export function weightRate(series: ProgressPoint[], windowDays = 28): WeightRate | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const inWindow = series.filter((p) => daysBetween(p.date, last.date) <= windowDays);
  const first = inWindow[0];
  const days = daysBetween(first.date, last.date);
  if (days < 7) return null;
  const kgPerWeek = Math.round(((last.value - first.value) / days) * 7 * 100) / 100;
  const percentPerWeek = Math.round((kgPerWeek / first.value) * 1000) / 10;
  let pace: RatePace;
  if (percentPerWeek > 0.25) pace = 'gain';
  else if (percentPerWeek >= -0.25) pace = 'stable';
  else if (percentPerWeek >= -1) pace = 'steady';
  else pace = 'fast';
  return { kgPerWeek, percentPerWeek, pace };
}

/** Latest weight logged, for prefilling the calculator. */
export function latestWeight(entries: PMOSMetricEntry[]): ProgressPoint | null {
  const s = measureSeries(entries, 'weight_kg');
  return s.length ? s[s.length - 1] : null;
}
