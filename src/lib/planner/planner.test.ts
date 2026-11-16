import { describe, it, expect } from 'vitest';
import { addDays, weekDays, weekStartOf } from './week';
import { buildGroceryList } from './grocery';
import { parsePlanJson } from './plan';

describe('week helpers', () => {
  it('uses Monday as the start of the week', () => {
    expect(weekStartOf(new Date(2026, 3, 26))).toBe('2026-04-20'); // Sunday
    expect(weekStartOf(new Date(2026, 3, 20))).toBe('2026-04-20'); // Monday
  });
  it('crosses month boundaries', () => {
    expect(addDays('2026-04-28', 5)).toBe('2026-05-03');
    expect(weekDays('2026-04-27')).toHaveLength(7);
  });
});

describe('buildGroceryList', () => {
  it('merges repeated items ignoring case and accents, and skips pantry items', () => {
    const list = buildGroceryList(
      [['Huevos', 'Arroz integral', 'Espinaca'], ['huevos', 'Limón']],
      ['arroz'],
    );
    expect(list.map((i) => i.label)).toEqual(['Espinaca', 'Huevos', 'Limón']);
    expect(list.find((i) => i.key === 'huevos')?.count).toBe(2);
  });
});

describe('parsePlanJson', () => {
  const ids = new Set(['v1']);
  it('keeps valid rows and drops invalid ones', () => {
    const plan = parsePlanJson(
      JSON.stringify({
        meals: [
          { day: 0, slot: 'lunch', title: 'Ensalada', ingredients: ['lechuga', ''] },
          { day: 9, slot: 'lunch', title: 'x', ingredients: [] },
          { day: 1, slot: 'brunch', title: 'x', ingredients: [] },
          { day: 0, slot: 'lunch', title: 'duplicado', ingredients: [] },
        ],
        workouts: [
          { day: 0, kind: 'video', videoId: 'v1', title: 'Yoga', durationMinutes: 20 },
          { day: 1, kind: 'video', videoId: 'unknown', title: 'Falso', durationMinutes: 20 },
          { day: 2, kind: 'rest', videoId: null, title: 'Descanso', durationMinutes: 30 },
        ],
      }),
      ids,
    );
    expect(plan.meals).toEqual([{ day: 0, slot: 'lunch', title: 'Ensalada', ingredients: ['lechuga'] }]);
    expect(plan.workouts.map((w) => [w.day, w.kind, w.durationMinutes])).toEqual([[0, 'video', 20], [2, 'rest', null]]);
  });
  it('returns an empty plan for invalid JSON', () => {
    expect(parsePlanJson('nope', ids)).toEqual({ meals: [], workouts: [] });
  });
});

import { buildPlanFromRecipes, ingredientName } from './fromRecipes';

describe('ingredientName', () => {
  it('drops quantities, units and "de"', () => {
    expect(ingredientName('200 g de lentejas')).toBe('lentejas');
    expect(ingredientName('2 huevos')).toBe('huevos');
    expect(ingredientName('1 cup oats (rolled)')).toBe('oats');
    expect(ingredientName('Huevos')).toBe('Huevos');
  });
});

describe('buildPlanFromRecipes', () => {
  const mk = (id: string, tag: string, ing: string[] = ['2 huevos']) => ({ id, title: id, ingredients: ing, tags: [tag] });
  const base = { pantry: [], avoid: [], likes: [], random: () => 0.5 };

  it('fills every slot, avoids repeats while candidates remain and reports gaps', () => {
    const recipes = [mk('a', 'Desayuno'), mk('b', 'Desayuno'), mk('c', 'Almuerzo'), mk('d', 'Cena')];
    const r = buildPlanFromRecipes(recipes, base);
    expect(r.meals.filter((m) => m.slot === 'breakfast')).toHaveLength(7);
    expect(r.meals.slice(0, 0)).toEqual([]);
    const firstTwo = r.meals.filter((m) => m.slot === 'breakfast').slice(0, 2).map((m) => m.title);
    expect(new Set(firstTwo).size).toBe(2);
    expect(r.missing.filter((m) => m.slot === 'snack')).toHaveLength(7);
  });

  it('skips avoided foods and slots already taken', () => {
    const r = buildPlanFromRecipes([mk('a', 'Almuerzo', ['pollo asado']), mk('b', 'Almuerzo', ['lentejas'])], {
      ...base,
      avoid: ['pollo'],
      taken: new Set(['0-lunch']),
    });
    expect(r.meals.some((m) => m.title === 'a')).toBe(false);
    expect(r.meals.some((m) => m.day === 0 && m.slot === 'lunch')).toBe(false);
  });
});
