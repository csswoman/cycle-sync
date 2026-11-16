import { describe, it, expect } from 'vitest';
import { forecastNextPeriod } from './periodForecast';

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('forecastNextPeriod', () => {
  it('returns null without any data', () => {
    expect(forecastNextPeriod([], null, null)).toBeNull();
  });

  it('uses a wide margin around the configured length when there is no history', () => {
    const f = forecastNextPeriod([], 35, '2026-01-01', new Date(2026, 0, 10))!;
    expect(fmt(f.earliest)).toBe('2026-01-29');
    expect(fmt(f.latest)).toBe('2026-02-12');
    expect(f.confidence).toBe('low');
  });

  it('builds the range from irregular history and stays inside the observed min/max', () => {
    // cycle lengths: 30, 45, 38, 60
    const starts = ['2025-01-01', '2025-01-31', '2025-03-17', '2025-04-24', '2025-06-23'];
    const f = forecastNextPeriod(starts, 28, null, new Date(2025, 6, 1))!;
    expect(f.cycleLengths).toEqual([30, 45, 38, 60]);
    expect(f.confidence).toBe('medium');
    expect(f.irregular).toBe(true);
    const lenLow = (f.earliest.getTime() - new Date(2025, 5, 23).getTime()) / 86400000;
    const lenHigh = (f.latest.getTime() - new Date(2025, 5, 23).getTime()) / 86400000;
    expect(Math.round(lenLow)).toBeGreaterThanOrEqual(30);
    expect(Math.round(lenHigh)).toBeLessThanOrEqual(60);
    expect(lenHigh).toBeGreaterThan(lenLow);
  });

  it('reports overdue days after the latest expected date', () => {
    const f = forecastNextPeriod(['2026-01-01'], 28, null, new Date(2026, 1, 20))!;
    // latest = Jan 1 + 35 = Feb 5; Feb 20 is 15 days later
    expect(f.overdueDays).toBe(15);
  });

  it('ignores implausible gaps', () => {
    const f = forecastNextPeriod(['2024-01-01', '2026-01-01'], 28, null, new Date(2026, 0, 5))!;
    expect(f.cycleLengths).toEqual([]);
  });
});
