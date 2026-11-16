import type { MealSlot } from '@/lib/planner/week';

/** mg/dL; applied to the average of the 120-minute readings of a group. */
export const SPIKE_THRESHOLD_MG_DL = 140;
export const MIN_READINGS_PER_MEAL = 2;

/** The only fields this module reads. */
export interface MealGlucoseReading {
  glucose: number;
  mealLabel: string | null;
  mealSlot: MealSlot | null;
  minutesAfterMeal: 60 | 120 | null;
}

export interface MealGlucoseGroup {
  /** Normalized label. */
  key: string;
  /** First trimmed original label seen for this key. */
  label: string;
  averageMgDl: number;
  count: number;
  /** True only when the group has 120-minute readings and their mean is above the threshold. */
  aboveThreshold: boolean;
}

/** Trim, strip accents, lowercase, collapse whitespace. */
export function normalizeMealLabel(label: string | null | undefined): string {
  if (!label) return '';
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function groupMealGlucose(readings: readonly MealGlucoseReading[]): MealGlucoseGroup[] {
  const buckets = new Map<string, { label: string; all: number[]; at120: number[] }>();
  for (const r of readings) {
    if (!Number.isFinite(r.glucose)) continue;
    const key = normalizeMealLabel(r.mealLabel);
    if (!key) continue;
    let b = buckets.get(key);
    if (!b) {
      b = { label: (r.mealLabel ?? '').trim(), all: [], at120: [] };
      buckets.set(key, b);
    }
    b.all.push(r.glucose);
    if (r.minutesAfterMeal === 120) b.at120.push(r.glucose);
  }

  const groups: MealGlucoseGroup[] = [];
  for (const [key, b] of buckets) {
    if (b.all.length < MIN_READINGS_PER_MEAL) continue;
    groups.push({
      key,
      label: b.label,
      averageMgDl: mean(b.all),
      count: b.all.length,
      aboveThreshold: b.at120.length > 0 && mean(b.at120) > SPIKE_THRESHOLD_MG_DL,
    });
  }
  return groups.sort((a, b) =>
    b.averageMgDl - a.averageMgDl || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/** The card shows from 2 meals with data. */
export function hasEnoughMealData(groups: readonly MealGlucoseGroup[]): boolean {
  return groups.length >= 2;
}
