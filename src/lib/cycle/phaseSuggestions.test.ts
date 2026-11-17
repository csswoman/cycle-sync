import { describe, it, expect } from 'vitest';
import catalog from '@/data/catalogRecipes.json';
import { toPhaseKey, rankRecipesForPhase, scoreRecipeForPhase, pendingPhaseHabits, PHASE_HABITS } from './phaseSuggestions';

const recipe = (title: string, ingredients: string[], tags: string[] = []) => ({ title, ingredients, tags });

describe('toPhaseKey', () => {
  it('maps enum values and Spanish names', () => {
    expect(toPhaseKey('Luteal')).toBe('luteal');
    expect(toPhaseKey('Ovulation')).toBe('ovulation');
    expect(toPhaseKey('Fase Lútea')).toBe('luteal');
    expect(toPhaseKey('Folicular')).toBe('follicular');
    expect(toPhaseKey(undefined)).toBe('follicular');
  });
});

describe('scoreRecipeForPhase', () => {
  it('favors iron-rich recipes in the menstrual phase', () => {
    const lentils = scoreRecipeForPhase(recipe('Sopa de lentejas', ['1 taza de lentejas', 'espinaca']), 'menstrual', 'es');
    const salad = scoreRecipeForPhase(recipe('Ensalada de pepino', ['pepino', 'menta']), 'menstrual', 'es');
    expect(lentils.score).toBeGreaterThan(salad.score);
    expect(lentils.reasons).toContain('lentejas');
  });

  it('does not match stems inside other words', () => {
    // "res" (beef) must not hit "fresas"
    const m = scoreRecipeForPhase(recipe('Batido', ['fresas']), 'menstrual', 'es');
    expect(m.reasons).not.toContain('carne de res');
  });

  it('penalizes recipes tagged for another phase', () => {
    const tagged = scoreRecipeForPhase(recipe('Bowl', ['avena'], ['Fase Folicular']), 'luteal', 'es');
    const plain = scoreRecipeForPhase(recipe('Bowl', ['avena']), 'luteal', 'es');
    expect(tagged.score).toBeLessThan(plain.score);
  });
});

describe('rankRecipesForPhase on the real catalog', () => {
  const recipes = catalog as { title: string; ingredients: string[]; tags: string[] }[];
  it.each(['menstrual', 'follicular', 'ovulation', 'luteal'] as const)('finds suggestions for %s', (phase) => {
    const ranked = rankRecipesForPhase(recipes, phase, 'es', 6);
    expect(ranked.length).toBe(6);
    expect(ranked.every((m) => m.reasons.length > 0)).toBe(true);
  });

  it('gives different top picks per phase', () => {
    const tops = (['menstrual', 'follicular', 'ovulation', 'luteal'] as const).map(
      (p) => rankRecipesForPhase(recipes, p, 'es', 3).map((m) => m.recipe.title).join('|'),
    );
    expect(new Set(tops).size).toBe(4);
  });
});

describe('pendingPhaseHabits', () => {
  it('hides habits already added in either language', () => {
    const [first] = PHASE_HABITS.luteal;
    const pending = pendingPhaseHabits('luteal', [first.name.en.toUpperCase()]);
    expect(pending.find((p) => p.id === first.id)).toBeUndefined();
    expect(pending.length).toBe(PHASE_HABITS.luteal.length - 1);
  });
});
