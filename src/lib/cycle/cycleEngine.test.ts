import { describe, it, expect } from 'vitest';
import { groupDaysIntoPeriods, cycleLengthsFromStarts, estimateCycle, projectCycles, toISODate } from './cycleEngine';

describe('groupDaysIntoPeriods', () => {
  it('groups consecutive days and tolerates a one-day gap', () => {
    const runs = groupDaysIntoPeriods(['2025-01-01', '2025-01-02', '2025-01-04', '2025-01-05', '2025-01-29', '2025-01-30']);
    expect(runs).toEqual([
      { start: '2025-01-01', end: '2025-01-05' },
      { start: '2025-01-29', end: '2025-01-30' },
    ]);
  });
  it('handles unsorted and duplicate input', () => {
    expect(groupDaysIntoPeriods(['2025-02-02', '2025-02-01', '2025-02-01'])).toEqual([{ start: '2025-02-01', end: '2025-02-02' }]);
  });
});

describe('cycleLengthsFromStarts', () => {
  it('ignores gaps that are not a plausible cycle', () => {
    expect(cycleLengthsFromStarts(['2025-01-01', '2025-01-29', '2025-06-30'])).toEqual([28]);
  });
});

describe('estimateCycle', () => {
  const periods = [
    { start_date: '2025-01-01', end_date: '2025-01-05' },
    { start_date: '2025-01-30', end_date: '2025-02-03' },
    { start_date: '2025-02-27', end_date: '2025-03-03' },
    { start_date: '2025-03-28', end_date: null },
  ];
  it('averages history and places ovulation 14 days before the next period', () => {
    const e = estimateCycle(periods, 28);
    expect(e.lengths).toEqual([29, 28, 29]);
    expect(e.cycleLength).toBe(29);
    expect(e.ovulationDay).toBe(15);
    expect(e.fertileStartDay).toBe(10);
    expect(e.fertileEndDay).toBe(16);
    expect(e.periodLength).toBe(5);
    expect(e.irregular).toBe(false);
    expect(e.confidence).toBe('medium');
  });
  it('flags irregular history and has low confidence with no history', () => {
    const irregular = estimateCycle([
      { start_date: '2025-01-01' }, { start_date: '2025-02-01' }, { start_date: '2025-04-10' },
    ], 28);
    expect(irregular.irregular).toBe(true);
    const none = estimateCycle([], 30);
    expect(none.cycleLength).toBe(30);
    expect(none.confidence).toBe('low');
  });
});

describe('projectCycles', () => {
  it('projects next periods, ovulation and fertile window', () => {
    const e = estimateCycle([{ start_date: '2025-01-01' }], 28);
    const [first] = projectCycles('2025-01-01', e, 2);
    expect(toISODate(first.periodStart)).toBe('2025-01-29');
    expect(toISODate(first.ovulation)).toBe('2025-01-15');
    expect(toISODate(first.fertileStart)).toBe('2025-01-10');
    expect(toISODate(first.fertileEnd)).toBe('2025-01-16');
  });
});
