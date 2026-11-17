import { describe, it, expect } from 'vitest';
import {
  calculateNutritionTargets,
  calculatePlateTotals,
  buildProteinMealPlan,
  evaluatePlateProtein,
  fitPlateProtein,
} from './targets';
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
    // Fats minimum 1.0 g/kg for hormonal health => 60g
    expect(targets.fatGrams).toBe(60);
    expect(targets.fatRange).toEqual([60, 72]);
    // Caloric breakdown & deficit
    expect(targets.calorieBreakdown.deficitRange).toEqual([300, 500]);
    expect(targets.calorieBreakdown.safeDeficitCalories).toBeLessThan(targets.maintenanceCalories);
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

describe('buildProteinMealPlan', () => {
  it('splits 65 kg into 4 meals every 4 h within the per-meal range', () => {
    const plan = buildProteinMealPlan(calculateNutritionTargets(65), 4, '07:30');
    expect(plan.perMealGrams).toBe(33); // 130 / 4 = 32.5
    expect(plan.perMealRange).toEqual([26, 36]); // 0.4 and 0.55 g/kg
    expect(plan.highThresholdGrams).toBe(52);
    expect(plan.slots.map((s) => s.time)).toEqual(['07:30', '11:30', '15:30', '19:30']);
    expect(plan.slots.map((s) => s.label)).toEqual(['Desayuno', 'Comida', 'Merienda', 'Cena']);
  });

  it('uses 5 h spacing for 3 meals and wraps past midnight', () => {
    const plan = buildProteinMealPlan(calculateNutritionTargets(60), 3, '15:00');
    expect(plan.perMealGrams).toBe(40);
    expect(plan.spacingHours).toBe(5);
    expect(plan.slots.map((s) => s.time)).toEqual(['15:00', '20:00', '01:00']);
  });

  it('falls back to 08:00 with a bad time', () => {
    const plan = buildProteinMealPlan(calculateNutritionTargets(60), 4, 'nope');
    expect(plan.slots[0].time).toBe('08:00');
  });
});

describe('evaluatePlateProtein', () => {
  const plan = buildProteinMealPlan(calculateNutritionTargets(65), 4); // range 26-36, high 52

  it('rates empty, low, good and high plates', () => {
    expect(evaluatePlateProtein(0, plan).status).toBe('empty');
    const low = evaluatePlateProtein(15, plan);
    expect(low.status).toBe('low');
    expect(low.missingGrams).toBe(11);
    expect(evaluatePlateProtein(30, plan).status).toBe('good');
    expect(evaluatePlateProtein(52, plan).status).toBe('good');
    const high = evaluatePlateProtein(80, plan);
    expect(high.status).toBe('high');
    expect(high.extraGrams).toBe(28);
    expect(high.mealsCovered).toBeCloseTo(2.4, 1);
  });
});

describe('fitPlateProtein', () => {
  const chicken = FOOD_DATABASE.find((f) => f.id === 'pechuga-pollo')!;
  const rice = FOOD_DATABASE.find((f) => f.id === 'arroz-blanco')!;

  it('scales only the protein foods to reach the target', () => {
    const fitted = fitPlateProtein([{ food: chicken, grams: 300 }, { food: rice, grams: 100 }], 33);
    const totals = calculatePlateTotals(fitted);
    expect(fitted[1].grams).toBe(100);
    expect(fitted[0].grams % 5).toBe(0);
    expect(Math.abs(totals.protein - 33)).toBeLessThan(2);
  });

  it('leaves a plate without protein foods unchanged', () => {
    const plate = [{ food: rice, grams: 100 }];
    expect(fitPlateProtein(plate, 33)).toBe(plate);
  });
});

describe('calculateNutritionTargets with height (larger bodies)', () => {
  it('keeps body weight when BMI is 25 or less', () => {
    const t = calculateNutritionTargets(60, 165); // BMI 22
    expect(t.usesAdjustedWeight).toBe(false);
    expect(t.proteinGrams).toBe(120);
    expect(t.proteinReferenceKg).toBe(60);
  });

  it('uses a reference weight for 100 kg at 165 cm', () => {
    const t = calculateNutritionTargets(100, 165);
    expect(t.bmi).toBeCloseTo(36.7, 1);
    expect(t.usesAdjustedWeight).toBe(true);
    expect(t.proteinReferenceKg).toBeCloseTo(68.1, 1); // 25 * 1.65^2
    expect(t.proteinGrams).toBe(136); // not 200
    expect(t.proteinRange).toEqual([109, 150]);
    // Adjusted weight 68.1 + 0.4 * 31.9 = 80.9 kg -> ~3 L, not 3.75 L
    expect(t.adjustedWeightKg).toBeCloseTo(80.9, 1);
    expect(t.waterLiters).toBe(3);
    expect(t.maintenanceCalories).toBe(Math.round(80.9 * 31));
  });

  it('never drops protein below ~1 g/kg of total weight', () => {
    const t = calculateNutritionTargets(150, 165);
    expect(t.proteinGrams).toBe(150);
    expect(t.proteinRange[0]).toBeLessThanOrEqual(t.proteinGrams);
    expect(t.proteinRange[1]).toBe(180);
  });

  it('ignores an implausible height', () => {
    const t = calculateNutritionTargets(100, 40);
    expect(t.heightCm).toBeUndefined();
    expect(t.proteinGrams).toBe(200);
  });

  it('bases the per-meal range on the reference weight', () => {
    const plan = buildProteinMealPlan(calculateNutritionTargets(100, 165), 4);
    expect(plan.perMealRange).toEqual([27, 37]);
    expect(plan.perMealGrams).toBe(34);
  });
});
