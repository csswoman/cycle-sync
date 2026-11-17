import { describe, it, expect } from 'vitest';
import type { PMOSMetricEntry } from '@/lib/pmos/metrics';
import { measureSeries, progressSummary, weightRate, latestWeight } from './progress';

const row = (date: string, values: Partial<PMOSMetricEntry>): PMOSMetricEntry => ({
  id: date + JSON.stringify(values),
  user_id: 'u',
  date,
  glucose_mg_dl: null,
  glucose_context: null,
  insulin_uiu_ml: null,
  weight_kg: null,
  waist_cm: null,
  hip_cm: null,
  ...values,
});

const entries = [
  row('2026-10-01', { weight_kg: 100, abdomen_cm: 110 }),
  row('2026-10-01', { glucose_mg_dl: 95 }),
  row('2026-10-15', { weight_kg: 99 }),
  row('2026-10-29', { weight_kg: 98, abdomen_cm: 106 }),
  row('2026-10-29', { weight_kg: 97.6 }), // same day: last wins
];

describe('measureSeries', () => {
  it('keeps one value per day, oldest first, skipping empty rows', () => {
    expect(measureSeries(entries, 'weight_kg')).toEqual([
      { date: '2026-10-01', value: 100 },
      { date: '2026-10-15', value: 99 },
      { date: '2026-10-29', value: 97.6 },
    ]);
    expect(measureSeries(entries, 'abdomen_cm')).toHaveLength(2);
    expect(measureSeries(entries, 'chest_cm')).toEqual([]);
  });
});

describe('progressSummary', () => {
  it('compares first and latest', () => {
    const s = progressSummary(measureSeries(entries, 'abdomen_cm'))!;
    expect(s.change).toBe(-4);
    expect(s.changePercent).toBeCloseTo(-3.6, 1);
    expect(s.days).toBe(28);
  });

  it('uses the profile start weight when given', () => {
    const s = progressSummary(measureSeries(entries, 'weight_kg'), { date: '2026-09-01', value: 104 })!;
    expect(s.start.value).toBe(104);
    expect(s.change).toBe(-6.4);
  });

  it('ignores a start dated after the latest entry', () => {
    const s = progressSummary(measureSeries(entries, 'weight_kg'), { date: '2027-01-01', value: 90 })!;
    expect(s.start.value).toBe(100);
  });

  it('returns null without data', () => {
    expect(progressSummary([])).toBeNull();
  });
});

describe('weightRate', () => {
  it('measures a steady loss', () => {
    const r = weightRate(measureSeries(entries, 'weight_kg'))!;
    expect(r.kgPerWeek).toBeCloseTo(-0.6, 2); // -2.4 kg in 4 weeks
    expect(r.pace).toBe('steady');
  });

  it('flags a loss faster than 1% a week', () => {
    const r = weightRate([{ date: '2026-10-01', value: 100 }, { date: '2026-10-15', value: 96 }])!;
    expect(r.pace).toBe('fast');
  });

  it('needs at least a week of data', () => {
    expect(weightRate([{ date: '2026-10-01', value: 100 }, { date: '2026-10-04', value: 99 }])).toBeNull();
  });
});

describe('latestWeight', () => {
  it('returns the last logged weight', () => {
    expect(latestWeight(entries)).toEqual({ date: '2026-10-29', value: 97.6 });
  });
});
