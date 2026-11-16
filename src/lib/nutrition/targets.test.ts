import { describe, it, expect } from 'vitest';
import { calculateNutritionTargets, calculatePlateTotals } from './targets';
import { FOOD_DATABASE } from '@/data/nutritionFoods';

describe('calculateNutritionTargets', () => {
  it('calculates expected targets for a 60kg person', () => {
    const targets = calculateNutritionTargets(60);
    expect(targets.weightKg).toBe(60);
    // 60 * 2.0 = 120g protein
    expect(targets.proteinGrams).toBe(120);
    // Range 1.6 to 2.2 => 96g to 132g
    expect(targets.proteinRange).toEqual([96, 132]);
    // Water 35ml to 40ml => 2.1L to 2.4L
    expect(targets.waterRangeLiters).toEqual([2.1, 2.4]);
    expect(targets.waterLiters).toBe(2.3);
    expect(targets.waterGlasses).toBeGreaterThanOrEqual(8);
  });

  it('clamps invalid or extreme weights safely', () => {
    const negative = calculateNutritionTargets(-10);
    expect(negative.weightKg).toBe(30);

    const zero = calculateNutritionTargets(0);
    expect(zero.weightKg).toBe(60); // fallback default

    const huge = calculateNutritionTargets(500);
    expect(huge.weightKg).toBe(250);
  });
});

describe('calculatePlateTotals', () => {
  it('correctly calculates plate macros from foods', () => {
    const chicken = FOOD_DATABASE.find((f) => f.id === 'pechuga-pollo')!;
    const rice = FOOD_DATABASE.find((f) => f.id === 'arroz-blanco')!;
    const broccoli = FOOD_DATABASE.find((f) => f.id === 'brocoli-cocido')!;

    const plate = [
      { food: chicken, grams: 150 }, // 165*1.5=247.5 kcal, 31*1.5=46.5g prot
      { food: rice, grams: 100 },    // 130 kcal, 2.7g prot
      { food: broccoli, grams: 100 },// 34 kcal, 3g prot
    ];

    const targets = calculateNutritionTargets(65); // 130g protein target
    const totals = calculatePlateTotals(plate, targets);

    expect(totals.totalWeightGrams).toBe(350);
    expect(totals.protein).toBeCloseTo(46.5 + 2.7 + 3, 1);
    expect(totals.calories).toBe(Math.round(247.5 + 130 + 34));
    expect(totals.proteinPercentOfDaily).toBeGreaterThan(30);
  });

  it('handles empty plate gracefully', () => {
    const totals = calculatePlateTotals([]);
    expect(totals.calories).toBe(0);
    expect(totals.protein).toBe(0);
    expect(totals.totalWeightGrams).toBe(0);
  });
});
