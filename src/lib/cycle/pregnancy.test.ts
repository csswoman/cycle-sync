import { describe, it, expect } from 'vitest';
import { activePregnancy, cyclePairs, excludePregnancyGaps, gestationalAge } from './pregnancy';
const preg = { start_date: '2026-03-01', end_date: null as string | null };
describe('activePregnancy', () => {
  it('is active from start until the end date', () => {
    expect(activePregnancy([preg], '2026-06-01')).toBe(preg);
    expect(activePregnancy([preg], '2026-02-20')).toBeNull();
    expect(activePregnancy([{ ...preg, end_date: '2026-05-01' }], '2026-06-01')).toBeNull();
  });
});
describe('excludePregnancyGaps', () => {
  const starts = ['2026-01-01', '2026-01-30', '2026-03-01', '2026-12-10', '2027-01-08'];
  it('breaks the run across the pregnancy', () => {
    const runs = excludePregnancyGaps(starts, [{ start_date: '2026-03-01', end_date: '2026-11-20' }]);
    expect(runs).toEqual([['2026-01-01', '2026-01-30', '2026-03-01'], ['2026-12-10', '2027-01-08']]);
  });
  it('keeps one run without pregnancies', () => {
    expect(excludePregnancyGaps(starts, [])).toHaveLength(1);
  });
  it('drops the 280-day interval from the cycle pairs', () => {
    const pairs = cyclePairs(starts, [{ start_date: '2026-03-01', end_date: '2026-11-20' }]);
    expect(pairs).toEqual([['2026-01-01', '2026-01-30'], ['2026-01-30', '2026-03-01'], ['2026-12-10', '2027-01-08']]);
  });
});
describe('gestationalAge', () => {
  it('counts weeks and days', () => {
    expect(gestationalAge(preg, '2026-03-17')).toEqual({ weeks: 2, days: 2 });
    expect(gestationalAge(preg, '2026-02-01')).toBeNull();
  });
});
