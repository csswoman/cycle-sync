import { describe, it, expect } from 'vitest';
import { parseMealAnalysis, buildMealAnalysisPrompt, formatRange } from './mealAnalysis';

const sample = {
  summary: 'Buena proteína, carbohidratos de alto IG.',
  foods: [{ name: 'Carne de res', portion: '150-180 g', kcal: { min: 250, max: 320 } }, { name: '' }],
  calories: { min: 820, max: 1090 },
  macros: { protein: { min: 48, max: 61 }, carbs: { min: 98, max: 117 }, fat: { min: 25, max: 55 } },
  micronutrients: [{ nutrient: 'Hierro hemo', sources: 'carne', benefit: 'Alta biodisponibilidad' }],
  score: { value: 3.4, reasons: [{ title: 'Alto IG', detail: 'Arroz blanco y papas', positive: false }] },
  protein: { status: 'ok', message: 'Encaja en una comida.' },
  suggestions: [{ title: 'Cambia el arroz', detail: 'Usa quinoa' }],
};

describe('parseMealAnalysis', () => {
  it('parses a full reply and drops invalid items', () => {
    const r = parseMealAnalysis(JSON.stringify(sample))!;
    expect(r.foods).toHaveLength(1);
    expect(r.calories).toEqual({ min: 820, max: 1090 });
    expect(r.macros?.protein).toEqual({ min: 48, max: 61 });
    expect(r.score).toEqual({ value: 3, reasons: [{ title: 'Alto IG', detail: 'Arroz blanco y papas', positive: false }] });
    expect(r.protein?.status).toBe('ok');
  });

  it('accepts code fences and surrounding text', () => {
    expect(parseMealAnalysis('```json\n' + JSON.stringify(sample) + '\n```')?.summary).toBe(sample.summary);
    expect(parseMealAnalysis('Aquí está: ' + JSON.stringify(sample))?.summary).toBe(sample.summary);
  });

  it('strips numbers in no-numbers mode', () => {
    const r = parseMealAnalysis(JSON.stringify(sample), true)!;
    expect(r.calories).toBeNull();
    expect(r.macros).toBeNull();
    expect(r.protein).toBeNull();
    expect(r.foods[0].kcal).toBeUndefined();
  });

  it('returns null for markdown or empty replies', () => {
    expect(parseMealAnalysis('## Alimentos\n* Carne')).toBeNull();
    expect(parseMealAnalysis('{}')).toBeNull();
  });

  it('clamps the score and orders ranges', () => {
    const r = parseMealAnalysis(JSON.stringify({ summary: 'x', score: { value: 14 }, calories: { min: 900, max: 800 } }))!;
    expect(r.score?.value).toBe(10);
    expect(r.calories).toEqual({ min: 800, max: 900 });
  });
});

describe('buildMealAnalysisPrompt', () => {
  it('names PMOS only when enabled and sets the language', () => {
    expect(buildMealAnalysisPrompt('es', { pmos: true, hideNumbers: false })).toMatch(/PMOS-friendly[\s\S]*Spanish/);
    expect(buildMealAnalysisPrompt('en', { pmos: false, hideNumbers: false })).toContain('Do not mention PMOS');
    expect(buildMealAnalysisPrompt('en', { pmos: true, hideNumbers: true })).toContain('"macros" and "protein" to null');
  });
});

it('formatRange', () => {
  expect(formatRange({ min: 5, max: 5 })).toBe('5');
  expect(formatRange({ min: 5, max: 8 })).toBe('5-8');
});
