import { describe, expect, it } from 'vitest';
import { groupMealGlucose, hasEnoughMealData, normalizeMealLabel, type MealGlucoseReading } from './mealGlucose';

const r = (label: string | null, glucose: number, minutes: 60 | 120 | null = 120): MealGlucoseReading => ({
  glucose, mealLabel: label, mealSlot: 'lunch', minutesAfterMeal: minutes,
});

describe('groupMealGlucose', () => {
  it('orders meals by average with their reading counts', () => {
    const groups = groupMealGlucose([
      r('Arepa con queso', 150), r('arepa con queso', 160), r('Arepa con Queso', 140),
      r('Avena', 110), r('avena', 120),
    ]);
    expect(groups.map((g) => [g.key, g.count, Math.round(g.averageMgDl)])).toEqual([
      ['arepa con queso', 3, 150], ['avena', 2, 115],
    ]);
    expect(groups[0].aboveThreshold).toBe(true);
    expect(groups[1].aboveThreshold).toBe(false);
    expect(hasEnoughMealData(groups)).toBe(true);
  });

  it('needs 2 readings, ignores blank labels and 60-minute readings for the flag', () => {
    expect(groupMealGlucose([r('Pan', 200), r(null, 200), r('  ', 200)])).toEqual([]);
    const [g] = groupMealGlucose([r('Pan', 200, 60), r('Pan', 190, 60)]);
    expect(g.aboveThreshold).toBe(false);
  });

  it('flags only averages strictly above 140 at 2 h', () => {
    expect(groupMealGlucose([r('A', 140), r('A', 140)])[0].aboveThreshold).toBe(false);
    expect(groupMealGlucose([r('A', 141), r('A', 141)])[0].aboveThreshold).toBe(true);
  });

  it('normalizes case, accents and spacing', () => {
    expect(normalizeMealLabel('  Ñoquis   de CALABAZA ')).toBe('noquis de calabaza');
  });
});
