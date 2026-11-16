import { describe, it, expect } from 'vitest';
import { titleKey, isSimilarTitle } from './normalize';

describe('recipe title dedupe', () => {
  it('ignores case, accents, stop words and word order', () => {
    expect(titleKey('Arroz con Frijoles')).toBe(titleKey('frijoles con arroz'));
    expect(titleKey('Ensalada de Garbanzos')).toBe(titleKey('ensalada garbanzo'));
  });

  it('treats near-identical titles as duplicates', () => {
    expect(isSimilarTitle('Arroz con frijoles', 'Arroz con frijoles negros')).toBe(false);
    expect(isSimilarTitle('Bowl de quinoa, aguacate y huevo', 'Bowl de quinoa con aguacate y huevo')).toBe(true);
  });

  it('keeps different recipes apart', () => {
    expect(isSimilarTitle('Arroz con frijoles', 'Arroz con pollo')).toBe(false);
  });
});
