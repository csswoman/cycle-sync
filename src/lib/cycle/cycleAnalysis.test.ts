import { describe, it, expect } from 'vitest';
import { analyzeCycles } from './cycleAnalysis';

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
