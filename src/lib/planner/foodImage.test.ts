import { describe, expect, it } from 'vitest';
import { foodImageFor } from './foodImage';

describe('foodImageFor', () => {
  it('matches plural and alias names', () => {
    expect(foodImageFor('Huevos')).toBe('/foods/huevo-cocido.webp');
    expect(foodImageFor('Avena')).toBe('/foods/avena.webp');
    expect(foodImageFor('Espinacas')).toBe('/foods/espinaca-cruda.webp');
    expect(foodImageFor('Semillas de chía')).toBe('/foods/semillas-chia.webp');
    expect(foodImageFor('Aceite de oliva')).toBe('/foods/aceite-oliva.webp');
    expect(foodImageFor('Arroz integral')).toBe('/foods/arroz-blanco.webp');
    expect(foodImageFor('Tomate')).toBe('/foods/tomate.webp');
    expect(foodImageFor('Tomates')).toBe('/foods/tomate.webp');
    expect(foodImageFor('Queso')).toBe('/foods/queso-cottage.webp');
    expect(foodImageFor('Limón')).toBe('/foods/limon.webp');
    expect(foodImageFor('Canela')).toBe('/foods/canela.webp');
    expect(foodImageFor('Miel')).toBe('/foods/miel.webp');
    expect(foodImageFor('Cilantro')).toBe('/foods/cilantro.webp');
    expect(foodImageFor('Remolacha')).toBe('/foods/remolacha.webp');
  });
  it('returns null for unknown foods', () => {
    expect(foodImageFor('Harina de almendra extrafina xyz')).toBe(null);
    expect(foodImageFor('')).toBe(null);
  });
});
