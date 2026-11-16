import { describe, it, expect } from 'vitest';
import { matchMarker, normalizeExtractedLabs, parseLabValue } from './labExtract';

const TODAY = '2026-11-18';

describe('matchMarker', () => {
  it('reads Spanish and English labels', () => {
    expect(matchMarker('Colesterol Total')?.marker).toBe('total_cholesterol');
    expect(matchMarker('Colesterol LDL')?.marker).toBe('ldl');
    expect(matchMarker('HDL cholesterol')?.marker).toBe('hdl');
    expect(matchMarker('Triglicéridos')?.marker).toBe('triglycerides');
    expect(matchMarker('Hemoglobina glicosilada (HbA1c)')?.marker).toBe('hba1c');
    expect(matchMarker('Testosterona libre')?.marker).toBe('free_testosterone');
    expect(matchMarker('Testosterone, Total')?.marker).toBe('testosterone');
    expect(matchMarker('17-OH Progesterona')?.marker).toBe('ohp17');
    expect(matchMarker('Progesterone')?.marker).toBe('progesterone');
    expect(matchMarker('Glucosa 2 horas post carga')?.marker).toBe('glucose_2h');
    expect(matchMarker('Vitamina D 25-OH')?.marker).toBe('vitamin_d');
    expect(matchMarker('ALT (TGP)')?.marker).toBe('alt');
  });
  it('marks a bare glucose as assumed fasting', () => {
    expect(matchMarker('Glucosa')).toEqual({ marker: 'fasting_glucose', assumed: true });
    expect(matchMarker('Glucosa en ayunas')).toEqual({ marker: 'fasting_glucose', assumed: false });
  });
  it('ignores tests the app does not track', () => {
    expect(matchMarker('Hemoglobina')).toBeNull();
    expect(matchMarker('Creatinina')).toBeNull();
  });
});

describe('parseLabValue', () => {
  it('accepts decimal commas and rejects bounds', () => {
    expect(parseLabValue('5,4')).toBe(5.4);
    expect(parseLabValue(' 12 ')).toBe(12);
    expect(parseLabValue('<0.5')).toBeNull();
    expect(parseLabValue('negativo')).toBeNull();
  });
});

describe('normalizeExtractedLabs', () => {
  it('turns a lipid panel in mmol/L into four mg/dL rows', () => {
    const rows = normalizeExtractedLabs([
      { label: 'Colesterol total', value: '5.2', unit: 'mmol/L', date: '2026-11-10' },
      { label: 'Colesterol LDL', value: '3.1', unit: 'mmol/L', date: '2026-11-10' },
      { label: 'Colesterol HDL', value: '1.4', unit: 'mmol/L', date: '2026-11-10' },
      { label: 'Triglicéridos', value: '1,2', unit: 'mmol/L', date: '2026-11-10' },
    ], TODAY);
    expect(rows.map((r) => [r.marker, r.value, r.unit, r.doubtful])).toEqual([
      ['total_cholesterol', 201.08, 'mg/dL', false],
      ['ldl', 119.88, 'mg/dL', false],
      ['hdl', 54.14, 'mg/dL', false],
      ['triglycerides', 106.28, 'mg/dL', false],
    ]);
    expect(rows[0].rawLabel).toBe('Colesterol total');
  });
  it('handles mixed units on one report', () => {
    const rows = normalizeExtractedLabs([
      { label: 'Glucosa en ayunas', value: '5.0', unit: 'mmol/L', date: '2026-11-10' },
      { label: 'Insulina basal', value: '69.45', unit: 'pmol/L', date: '2026-11-10' },
      { label: 'TSH', value: '2.1', unit: 'µIU/mL', date: '2026-11-10' },
    ], TODAY);
    expect(rows.map((r) => [r.marker, r.value])).toEqual([
      ['fasting_glucose', 90.08], ['fasting_insulin', 10], ['tsh', 2.1],
    ]);
  });
  it('drops impossible values and unknown labels', () => {
    const rows = normalizeExtractedLabs([
      { label: 'Colesterol LDL', value: '9000', unit: 'mg/dL', date: '2026-11-10' },
      { label: 'Creatinina', value: '0.9', unit: 'mg/dL', date: '2026-11-10' },
      { label: 'HbA1c', value: '5.4', unit: '%', date: '2026-11-10' },
      { label: 'HDL', value: '-3', unit: 'mg/dL', date: '2026-11-10' },
    ], TODAY);
    expect(rows).toHaveLength(1);
    expect(rows[0].marker).toBe('hba1c');
  });
  it('flags doubtful rows: missing unit, unknown unit, bad or future date, assumed marker', () => {
    const rows = normalizeExtractedLabs([
      { label: 'LDL', value: '110', unit: '', date: '2026-11-10' },
      { label: 'HDL', value: '55', unit: 'mg/dL', date: '2030-01-01' },
      { label: 'Triglicéridos', value: '120', unit: 'mg/dL', date: 'ayer' },
      { label: 'Glucosa', value: '90', unit: 'mg/dL', date: '2026-11-10' },
      { label: 'Ferritina', value: '40', unit: 'furlongs', date: '2026-11-10' },
    ], TODAY, '2026-11-17');
    expect(rows.map((r) => r.doubtful)).toEqual([true, true, true, true, true]);
    expect(rows[1].date).toBe('2026-11-17');
  });
  it('removes duplicates and tolerates garbage input', () => {
    const dup = { label: 'TSH', value: 2, unit: 'mIU/L', date: '2026-11-10' };
    expect(normalizeExtractedLabs([dup, dup], TODAY)).toHaveLength(1);
    expect(normalizeExtractedLabs(null, TODAY)).toEqual([]);
    expect(normalizeExtractedLabs({ rows: [dup] }, TODAY)).toHaveLength(1);
    expect(normalizeExtractedLabs(['x', 4, null], TODAY)).toEqual([]);
  });
});
