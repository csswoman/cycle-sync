import { describe, it, expect } from 'vitest';
import { bingeInsight, type InsightInput } from './insights';
import { EATING_SYMPTOMS, isScoffDue, scoreScoff } from './wellbeing';

const base: InsightInput = {
  today: '2026-11-18', periodStarts: [], medications: [], medLogs: [], symptomTotals: [], fastingGlucose: [], dailyLogs: [],
};
const log = (i: number, sleep: number | null, symptoms: string[]) => ({
  date: `2026-10-${String(i + 1).padStart(2, '0')}`, sleep_hours: sleep, energy_level: null, symptoms,
});

describe('scoreScoff', () => {
  it('is positive from two yes answers', () => {
    expect(scoreScoff({ sick: true })).toEqual({ score: 1, positive: false });
    expect(scoreScoff({ sick: true, food: true })).toEqual({ score: 2, positive: true });
    expect(scoreScoff({})).toEqual({ score: 0, positive: false });
    expect(scoreScoff({ sick: true, control: true, weight: true, fat: true, food: true }).score).toBe(5);
  });
});

describe('isScoffDue', () => {
  it('asks again after 90 days', () => {
    expect(isScoffDue(null, '2026-11-18')).toBe(true);
    expect(isScoffDue('2026-09-01', '2026-11-18')).toBe(false);
    expect(isScoffDue('2026-08-10', '2026-11-18')).toBe(true);
  });
});

describe('bingeInsight', () => {
  it('reports binge days after short sleep (positive case)', () => {
    const short = Array.from({ length: 5 }, (_, i) => log(i, 5, i < 3 ? [EATING_SYMPTOMS.binge] : []));
    const rested = Array.from({ length: 5 }, (_, i) => log(i + 5, 8, []));
    const out = bingeInsight({ ...base, dailyLogs: [...short, ...rested] });
    expect(out?.id).toBe('binge-pattern');
    expect(out?.es).toContain('60%');
    expect(out?.es).toContain('0%');
  });
  it('reports binge days on skipped-meal days', () => {
    const skipped = Array.from({ length: 4 }, (_, i) => log(i, null, [EATING_SYMPTOMS.skipped, EATING_SYMPTOMS.binge]));
    const other = Array.from({ length: 4 }, (_, i) => log(i + 4, null, []));
    expect(bingeInsight({ ...base, dailyLogs: [...skipped, ...other] })?.en).toContain('skipped meals');
  });
  it('stays quiet when the rates are alike (neutral case)', () => {
    const logs = Array.from({ length: 10 }, (_, i) => log(i, i < 5 ? 5 : 8, i % 2 ? [EATING_SYMPTOMS.binge] : []));
    expect(bingeInsight({ ...base, dailyLogs: logs })).toBeNull();
  });
  it('needs enough days', () => {
    expect(bingeInsight(base)).toBeNull();
    expect(bingeInsight({ ...base, dailyLogs: [log(0, 5, [EATING_SYMPTOMS.binge])] })).toBeNull();
  });
});
