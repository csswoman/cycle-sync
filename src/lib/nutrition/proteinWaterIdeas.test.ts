import { describe, it, expect } from 'vitest';
import { calculateNutritionTargets, buildProteinMealPlan } from './targets';
import { proteinEquivalents, waterSchedule } from './proteinWaterIdeas';

describe('proteinEquivalents', () => {
  it('lists lean foods with the grams for one meal, smallest first', () => {
    const list = proteinEquivalents(30);
    expect(list.length).toBeGreaterThan(3);
    const chicken = list.find((e) => e.food.id === 'pechuga-pollo')!;
    expect(chicken.grams).toBe(95); // 30 / 31 * 100 = 96.8 -> 95
    expect(list.every((e) => e.grams <= 350 && e.grams % 5 === 0)).toBe(true);
    for (let i = 1; i < list.length; i++) expect(list[i].grams).toBeGreaterThanOrEqual(list[i - 1].grams);
    // Fatty foods are left out even if they have protein.
    expect(list.find((e) => e.food.id === 'queso-cheddar')).toBeUndefined();
  });

  it('returns nothing without a target', () => {
    expect(proteinEquivalents(0)).toEqual([]);
  });
});

describe('waterSchedule', () => {
  it('puts one glass on waking and spreads the rest over the meals', () => {
    const t = calculateNutritionTargets(100, 165); // 12 glasses
    const plan = buildProteinMealPlan(t, 4, '08:00');
    const moments = waterSchedule(plan, t.waterGlasses);
    expect(moments[0]).toEqual({ time: '07:30', label: 'Al despertar', glasses: 1 });
    expect(moments.reduce((s, m) => s + m.glasses, 0)).toBe(t.waterGlasses);
    expect(moments).toHaveLength(5);
  });

  it('handles an early first meal across midnight', () => {
    const plan = buildProteinMealPlan(calculateNutritionTargets(60), 3, '00:10');
    expect(waterSchedule(plan, 8)[0].time).toBe('23:40');
  });
});
