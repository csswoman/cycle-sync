import { describe, it, expect } from 'vitest';
import {
  EMPTY_FOOD_PREFERENCES,
  avoidedIn,
  likedIn,
  nextFoodState,
  parseFoodPreferences,
  recipeHasFood,
  setFoodState,
} from './foodPreferences';
import { getSupplementSuggestions } from './supplementSuggestions';

const salmon = {
  title: 'Salmón al horno con espárragos',
  ingredients: ['200 g de salmón', '1 manojo de espárragos'],
  steps: ['Hornea el salmón 15 minutos.'],
};
const boiledFish = {
  title: 'Sopa de pescado',
  ingredients: ['300 g de merluza', '2 tomates'],
  steps: ['Hierve el pescado con las verduras.'],
};
const lentils = { title: 'Lentejas con arroz', ingredients: ['1 taza de lentejas', '2 tazas de arroz'], steps: [] };

describe('recipeHasFood', () => {
  it('matches catalog foods through any keyword, ignoring accents and plurals', () => {
    expect(recipeHasFood(salmon, 'pescado')).toBe(true);
    expect(recipeHasFood(boiledFish, 'pescado')).toBe(true);
    expect(recipeHasFood(lentils, 'lentejas')).toBe(true);
    expect(recipeHasFood(boiledFish, 'tomate')).toBe(true);
    expect(recipeHasFood(lentils, 'pescado')).toBe(false);
  });

  it('does not match partial words', () => {
    expect(recipeHasFood({ title: 'Panela', ingredients: ['panela'] }, 'pan')).toBe(false);
    expect(recipeHasFood({ title: 'Ensalada', ingredients: ['cebollino'] }, 'cebolla')).toBe(false);
  });

  it('matches multi-word free text against the steps too', () => {
    expect(recipeHasFood(boiledFish, 'pescado hervido')).toBe(false); // "hierve", not "hervido"
    expect(recipeHasFood({ ...boiledFish, steps: ['El pescado hervido se sirve caliente.'] }, 'pescado hervido')).toBe(true);
    expect(recipeHasFood(salmon, 'pescado hervido')).toBe(false);
  });

  it('matches single free-text words against title and ingredients only', () => {
    expect(recipeHasFood(salmon, 'espárragos')).toBe(true);
    expect(recipeHasFood(salmon, 'minutos')).toBe(false);
  });
});

describe('avoidedIn / likedIn', () => {
  it('lists the matching entries', () => {
    expect(avoidedIn(salmon, ['pescado', 'queso'])).toEqual(['pescado']);
    expect(likedIn(lentils, ['lentejas', 'arroz', 'pollo'])).toEqual(['lentejas', 'arroz']);
  });
});

describe('state helpers', () => {
  it('cycles none -> like -> avoid -> none', () => {
    expect(nextFoodState('none')).toBe('like');
    expect(nextFoodState('like')).toBe('avoid');
    expect(nextFoodState('avoid')).toBe('none');
  });

  it('keeps an entry in exactly one list', () => {
    let p = setFoodState(EMPTY_FOOD_PREFERENCES, 'pescado', 'like');
    p = setFoodState(p, 'pescado', 'avoid');
    expect(p.likes).toEqual([]);
    expect(p.avoid).toEqual(['pescado']);
    p = setFoodState(p, 'pescado', 'none');
    expect(p.avoid).toEqual([]);
  });
});

describe('parseFoodPreferences', () => {
  it('rejects garbage and drops entries that are both liked and avoided', () => {
    expect(parseFoodPreferences(null)).toEqual(EMPTY_FOOD_PREFERENCES);
    const p = parseFoodPreferences({ likes: ['pollo', 5, ' '], avoid: ['pollo', 'pescado'], sun: 'moon', activity: 'light' });
    expect(p.likes).toEqual(['pollo']);
    expect(p.avoid).toEqual(['pescado']);
    expect(p.sun).toBeNull();
    expect(p.activity).toBe('light');
  });
});

describe('getSupplementSuggestions', () => {
  const ids = (p: Parameters<typeof getSupplementSuggestions>[0]) => getSupplementSuggestions(p, 'es').map((s) => s.id);

  it('says nothing when there is no data', () => {
    expect(ids(EMPTY_FOOD_PREFERENCES)).toEqual([]);
  });

  it('suggests omega-3 alternatives right away when she avoids fish', () => {
    const s = getSupplementSuggestions({ ...EMPTY_FOOD_PREFERENCES, avoid: ['pescado'] }, 'es');
    const omega = s.find((x) => x.id === 'omega3')!;
    expect(omega.priority).toBe('high');
    expect(omega.foods.map((f) => f.name)).toEqual(['Chía', 'Linaza', 'Nueces']);
    expect(omega.foods[0].amount).toMatch(/12 g/);
    expect(omega.replaces).toMatch(/285 mg/);
    expect(omega.equivalence).toMatch(/5 a 10%/);
    expect(omega.supplement).toMatch(/algas/i);
  });

  it('does not flag omega-3 when she likes chia', () => {
    expect(ids({ ...EMPTY_FOOD_PREFERENCES, avoid: ['pescado'], likes: ['chia'] })).not.toContain('omega3');
  });

  it('never suggests foods she avoids', () => {
    const s = getSupplementSuggestions({ ...EMPTY_FOOD_PREFERENCES, avoid: ['pescado', 'nueces', 'linaza'] }, 'es');
    expect(s.find((x) => x.id === 'omega3')!.foods.map((f) => f.name)).toEqual(['Chía']);
  });

  it('flags vitamin D when she rarely gets sun', () => {
    const s = getSupplementSuggestions({ ...EMPTY_FOOD_PREFERENCES, sun: 'rarely' }, 'en');
    expect(s[0].id).toBe('vitaminD');
    expect(s[0].priority).toBe('high');
  });

  it('flags vitamin D for sometimes-sun plus sedentary, but not for daily sun and active', () => {
    expect(ids({ ...EMPTY_FOOD_PREFERENCES, sun: 'sometimes', activity: 'sedentary' })).toContain('vitaminD');
    expect(ids({ ...EMPTY_FOOD_PREFERENCES, sun: 'daily', activity: 'active' })).not.toContain('vitaminD');
  });

  it('judges diet gaps only after enough foods are picked', () => {
    expect(ids({ ...EMPTY_FOOD_PREFERENCES, likes: ['arroz', 'banano'] })).toEqual([]);
    const withManyFoods = ids({ ...EMPTY_FOOD_PREFERENCES, likes: ['arroz', 'banano', 'manzana'] });
    expect(withManyFoods).toContain('b12');
    expect(withManyFoods).toContain('omega3');
  });

  it('recognizes free-text foods as sources', () => {
    const s = ids({ ...EMPTY_FOOD_PREFERENCES, likes: ['salmón', 'arroz', 'banano'] });
    expect(s).not.toContain('omega3');
    expect(s).not.toContain('b12');
  });
});
