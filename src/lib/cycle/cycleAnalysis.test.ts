import { describe, it, expect } from 'vitest';
import { analyzeCycles, cycleHealthFlags } from './cycleAnalysis';

describe('cycleHealthFlags', () => {
  const p = (starts: string[]) => starts.map((s) => ({ start_date: s }));

  it('returns nothing for regular cycles', () => {
    expect(cycleHealthFlags(p(['2025-01-01', '2025-01-29', '2025-02-26', '2025-03-26']), new Date(2025, 3, 1))).toEqual([]);
  });
  it('flags more than 90 days without a period', () => {
    expect(cycleHealthFlags(p(['2025-01-01']), new Date(2025, 3, 1))).toEqual([]); // day 90
    expect(cycleHealthFlags(p(['2025-01-01']), new Date(2025, 3, 5))).toEqual(['noPeriod90']);
  });
  it('flags repeated cycles longer than 35 days but not a single one', () => {
    expect(cycleHealthFlags(p(['2025-01-01', '2025-02-10', '2025-03-10']), new Date(2025, 2, 15))).toEqual([]);
    expect(cycleHealthFlags(p(['2025-01-01', '2025-02-10', '2025-03-25']), new Date(2025, 3, 1))).toEqual(['longCycles']);
  });
  it('flags fewer than 8 periods in the last year only with a year of history', () => {
    const sparse = ['2024-01-10', '2024-06-01', '2024-08-01', '2024-10-01', '2024-12-01', '2025-01-20'];
    expect(cycleHealthFlags(p(sparse), new Date(2025, 1, 1))).toContain('fewPeriodsYear');
    expect(cycleHealthFlags(p(sparse.slice(1)), new Date(2025, 1, 1))).not.toContain('fewPeriodsYear');
  });
  it('flags repeated bleeding longer than 8 days', () => {
    const periods = [
      { start_date: '2025-01-01', end_date: '2025-01-10' },
      { start_date: '2025-01-30', end_date: '2025-02-08' },
    ];
    expect(cycleHealthFlags(periods, new Date(2025, 1, 10))).toEqual(['longBleeding']);
  });
});

describe('cycleHealthFlags with bleeding intensity', () => {
  const periods = [
    { start_date: '2026-01-01', end_date: '2026-01-05' },
    { start_date: '2026-04-15', end_date: '2026-04-20' },
  ];
  const veryHeavy = (date: string) => ({ date, flow: 'very_heavy' as const });
  it('raises heavyBleeding and heavyAfterGap for two very heavy days after 100 days without a period', () => {
    const flags = cycleHealthFlags(periods, new Date(2026, 3, 25), [veryHeavy('2026-04-16'), veryHeavy('2026-04-17')]);
    expect(flags).toContain('heavyBleeding');
    expect(flags).toContain('heavyAfterGap');
  });
  it('ignores a single heavy day and works without signs', () => {
    expect(cycleHealthFlags(periods, new Date(2026, 3, 25), [veryHeavy('2026-04-16')])).not.toContain('heavyBleeding');
    expect(cycleHealthFlags(periods, new Date(2026, 3, 25))).not.toContain('heavyAfterGap');
  });
});
describe('analyzeCycles', () => {
  it('reports exact spans, range, mean and variation', () => {
    const starts = ['2025-01-01', '2025-01-29', '2025-02-26', '2025-03-26'];
    const a = analyzeCycles(starts.map((s) => ({ start_date: s, end_date: null })), new Date(2025, 2, 30));
    expect(a.cycles).toEqual([28, 28, 28]);
    expect(a.cycleRating).toBe('normal');
    expect(a.variation).toBe(0);
    expect(a.daysToNextPeriod).toBe(24);
  });
  it('rates long or widely varying cycles as abnormal and keeps exact values', () => {
    const starts = ['2025-01-01', '2025-05-07', '2025-06-13', '2025-08-28'];
    const a = analyzeCycles(starts.map((s) => ({ start_date: s })));
    expect(a.cycles).toEqual([126, 37, 76]);
    expect(a.cycleRating).toBe('abnormal');
    expect(a.variation).toBe(39);
  });
  it('analyzes period length from end dates', () => {
    const a = analyzeCycles([{ start_date: '2025-01-01', end_date: '2025-01-05' }, { start_date: '2025-01-29', end_date: '2025-02-01' }]);
    expect(a.periodLengths).toEqual([5, 4]);
    expect(a.periodRating).toBe('normal');
  });
});
