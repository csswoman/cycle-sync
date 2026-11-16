import { describe, it, expect } from 'vitest';
import { heavyAfterGap, heavyBleedingDays, heavyPeriods, isHeavyDay, periodBleedingDays, type BleedingSign } from './bleeding';
const sign = (date: string, flow: BleedingSign['flow'], clots = false, pain: number | null = null): BleedingSign => ({ date, flow, clots, pain });
describe('isHeavyDay', () => {
  it('counts very heavy, and heavy only with clots', () => {
    expect(isHeavyDay(sign('2026-01-01', 'very_heavy'))).toBe(true);
    expect(isHeavyDay(sign('2026-01-01', 'heavy', true))).toBe(true);
    expect(isHeavyDay(sign('2026-01-01', 'heavy'))).toBe(false);
    expect(isHeavyDay(sign('2026-01-01', 'medium', true))).toBe(false);
    expect(isHeavyDay(sign('2026-01-01', null))).toBe(false);
  });
});
describe('heavyBleedingDays', () => {
  const period = { start_date: '2026-03-01', end_date: '2026-03-05' };
  it('keeps only heavy days inside the period', () => {
    const signs = [sign('2026-02-28', 'very_heavy'), sign('2026-03-02', 'very_heavy'), sign('2026-03-03', 'heavy', true), sign('2026-03-04', 'heavy'), sign('2026-03-06', 'very_heavy')];
    expect(heavyBleedingDays(signs, period)).toEqual(['2026-03-02', '2026-03-03']);
  });
  it('looks 8 days from the start when the period has no end', () => {
    const signs = [sign('2026-03-08', 'very_heavy'), sign('2026-03-09', 'very_heavy')];
    expect(heavyBleedingDays(signs, { start_date: '2026-03-01' })).toEqual(['2026-03-08']);
  });
});
describe('heavyPeriods and heavyAfterGap', () => {
  const periods = [
    { start_date: '2026-01-01', end_date: '2026-01-05' },
    { start_date: '2026-04-15', end_date: '2026-04-20' }, // 100 days after the previous one ended
  ];
  it('flags two very heavy days after a 100-day gap', () => {
    const signs = [sign('2026-04-16', 'very_heavy'), sign('2026-04-17', 'very_heavy')];
    expect(heavyPeriods(periods, signs)).toHaveLength(1);
    expect(heavyAfterGap(periods, signs)).toBe(true);
  });
  it('does not flag a single heavy day', () => {
    const signs = [sign('2026-04-16', 'very_heavy')];
    expect(heavyPeriods(periods, signs)).toHaveLength(0);
    expect(heavyAfterGap(periods, signs)).toBe(false);
  });
  it('flags heavy bleeding but not the gap when the gap is short', () => {
    const short = [{ start_date: '2026-01-01', end_date: '2026-01-05' }, { start_date: '2026-02-01', end_date: '2026-02-05' }];
    const signs = [sign('2026-02-02', 'very_heavy'), sign('2026-02-03', 'very_heavy')];
    expect(heavyPeriods(short, signs)).toHaveLength(1);
    expect(heavyAfterGap(short, signs)).toBe(false);
  });
  it('is false without signs', () => {
    expect(heavyPeriods(periods, [])).toHaveLength(0);
    expect(heavyAfterGap(periods, [])).toBe(false);
  });
});
describe('periodBleedingDays', () => {
  it('lists days with flow or pain in order', () => {
    const signs = [sign('2026-03-03', 'light', false, 4), sign('2026-03-02', 'heavy'), { date: '2026-03-04', flow: null, clots: false, pain: null }];
    expect(periodBleedingDays(signs, { start_date: '2026-03-01', end_date: '2026-03-05' }).map((s) => s.date)).toEqual(['2026-03-02', '2026-03-03']);
  });
});
