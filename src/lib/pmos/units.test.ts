import { describe, it, expect } from 'vitest';
import { convertToCanonical, findUnit, normalizeUnit } from './units';

describe('convertToCanonical', () => {
  it('converts mmol/L values to mg/dL', () => {
    expect(convertToCanonical('fasting_glucose', 5, 'mmol/L')).toBeCloseTo(90.08, 2);
    expect(convertToCanonical('total_cholesterol', 5, 'mmol/L')).toBeCloseTo(193.35, 2);
    expect(convertToCanonical('ldl', 3, 'mmol/L')).toBeCloseTo(116.01, 2);
    expect(convertToCanonical('triglycerides', 1.7, 'mmol/L')).toBeCloseTo(150.57, 2);
  });
  it('converts testosterone, vitamin D, B12 and insulin', () => {
    expect(convertToCanonical('testosterone', 1.5, 'nmol/L')).toBeCloseTo(43.23, 2);
    expect(convertToCanonical('vitamin_d', 75, 'nmol/L')).toBeCloseTo(30.05, 2);
    expect(convertToCanonical('vitamin_b12', 300, 'pmol/L')).toBeCloseTo(406.5, 1);
    expect(convertToCanonical('fasting_insulin', 69.45, 'pmol/L')).toBeCloseTo(10, 2);
  });
  it('keeps the canonical unit unchanged and accepts spelling variants', () => {
    expect(convertToCanonical('fasting_glucose', 92, 'mg/dl')).toBe(92);
    expect(convertToCanonical('fasting_insulin', 8, 'µUI/mL')).toBe(8);
    expect(convertToCanonical('fasting_insulin', 8, 'mIU/L')).toBe(8);
    expect(convertToCanonical('vitamin_d', 30, 'µg/L')).toBe(30);
  });
  it('returns null for a unit that does not fit the marker', () => {
    expect(convertToCanonical('tsh', 2, 'mmol/L')).toBeNull();
    expect(convertToCanonical('ldl', 100, '')).toBeNull();
  });
});

describe('unit helpers', () => {
  it('normalizes spacing, case and the micro sign', () => {
    expect(normalizeUnit(' µIU / mL ')).toBe('uiu/ml');
  });
  it('finds options by label', () => {
    expect(findUnit('ldl', 'mmol/L')?.label).toBe('mmol/L');
  });
});
