import { describe, it, expect } from 'vitest';
import { CATALOG_RECIPES } from './seedRecipes';

describe('catalog recipes', () => {
  it('has no detox wording in titles, tags or descriptions', () => {
    const text = CATALOG_RECIPES.flatMap((r) => [r.title, r.description, ...r.tags]).join(' ').toLowerCase();
    expect(text).not.toMatch(/detox|desintox/);
  });
  it('keeps the ids that favorites were saved with', () => {
    const ids = CATALOG_RECIPES.map((r) => r.id);
    expect(ids.some((i) => /^catalog-zumo-detox-de-pepino-y-limon-\d+$/.test(i))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('tags juices so the planner does not treat them as meals', () => {
    const juice = CATALOG_RECIPES.find((r) => r.title === 'Zumo Tropical');
    expect(juice?.tags).toContain('Jugos');
  });
});
