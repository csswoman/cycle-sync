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
  it('uses the typical length and places ovulation 14 days before the next period', () => {
    const e = estimateCycle(periods, 28);
    expect(e.lengths).toEqual([29, 28, 29]);
    expect(e.cycleLength).toBe(29);
    // Next period on cycle day 30, so 14 days before is day 16.
    expect(e.ovulationDay).toBe(16);
    expect(e.fertileStartDay).toBe(11);
    expect(e.fertileEndDay).toBe(17);
    // A regular history still gets a small range.
    expect(e.shortestExpected).toBe(27);
    expect(e.longestExpected).toBe(31);
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
    // Without history the range is a week either side of the configured length.
    expect(none.shortestExpected).toBe(23);
    expect(none.longestExpected).toBe(37);
  });
  it('is not dragged by one unusually long cycle', () => {
    // lengths 30, 31, 29, 62, 30: the mean is 36, the typical cycle is 30
    const e = estimateCycle([
      { start_date: '2025-01-01' }, { start_date: '2025-01-31' }, { start_date: '2025-03-03' },
      { start_date: '2025-04-01' }, { start_date: '2025-06-02' }, { start_date: '2025-07-02' },
    ], 28);
    expect(e.lengths).toEqual([30, 31, 29, 62, 30]);
    expect(e.cycleLength).toBe(30);
    expect(e.irregular).toBe(true);
    expect(e.longestExpected).toBeGreaterThan(e.cycleLength);
    expect(e.longestExpected).toBeLessThanOrEqual(62);
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
  it('agrees with the estimate: same ovulation day and the expected period range', () => {
    const e = estimateCycle([{ start_date: '2025-01-01' }], 28);
    const [first, second] = projectCycles('2025-01-01', e, 2);
    expect(toISODate(first.ovulation)).toBe(toISODate(new Date(2025, 0, e.ovulationDay)));
    expect(toISODate(first.periodEarliest)).toBe('2025-01-22');
    expect(toISODate(first.periodLatest)).toBe('2025-02-05');
    expect(toISODate(second.periodStart)).toBe('2025-02-26');
    expect(toISODate(second.ovulation)).toBe('2025-02-12');
  });
});
describe('pregnancy intervals', () => {
  const starts = ['2025-01-01', '2025-01-29', '2025-02-26', '2025-12-03', '2025-12-31'];
  const pregnancy = [{ start_date: '2025-02-26', end_date: '2025-11-20' }];
  it('leaves the 280-day interval out of the cycle lengths and the median', () => {
    expect(cycleLengthsFromStarts(starts, pregnancy)).toEqual([28, 28, 28]);
    expect(estimateCycle(starts.map((s) => ({ start_date: s })), 28, pregnancy).cycleLength).toBe(28);
  });
  it('does not change anything without pregnancies', () => {
    expect(cycleLengthsFromStarts(starts.slice(0, 3))).toEqual([28, 28]);
  });
});
