import { describe, it, expect } from 'vitest';
import { getDishTips, DISH_TIP_IDS } from './dishTips';
import { getCatalogFood } from './foodPreferences';

describe('getDishTips', () => {
  it('returns tips only for liked dishes and staples', () => {
    const tips = getDishTips(['arepa', 'pollo', 'taco'], 'es');
    expect(tips.map((t) => t.id)).toEqual(['arepa', 'taco']);
    expect(tips[0].upgrades.length).toBeGreaterThan(0);
  });

  it('gives the taco portion advice of 2 instead of 3', () => {
    const [taco] = getDishTips(['taco'], 'es');
    expect(taco.portion).toMatch(/2 tacos/);
    expect(taco.portion).toMatch(/3/);
  });

  it('recognizes free text and removes repeats', () => {
    expect(getDishTips(['arepas de maíz', 'arepa'], 'es').map((t) => t.id)).toEqual(['arepa']);
    expect(getDishTips(['espagueti'], 'en').map((t) => t.id)).toEqual(['pan']);
  });

  it('returns English text and nothing for unknown foods', () => {
    expect(getDishTips(['arepa'], 'en')[0].qualityLabel).toBe('Better with tweaks');
    expect(getDishTips(['salmón'], 'es')).toEqual([]);
  });

  it('every tip id is a catalog food', () => {
    for (const id of DISH_TIP_IDS) expect(getCatalogFood(id)).toBeDefined();
  });
});
