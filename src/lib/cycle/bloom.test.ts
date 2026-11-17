import { describe, expect, it } from 'vitest';
import { bloomGrowth, bloomTone } from './bloom';

describe('bloomGrowth', () => {
  it('starts as a seed on day 1', () => {
    expect(bloomGrowth(1, 14)).toBe(0.08);
  });

  it('grows steadily until ovulation', () => {
    const mid = bloomGrowth(7, 14);
    expect(mid).toBeGreaterThan(0.08);
    expect(mid).toBeLessThan(1);
    expect(bloomGrowth(8, 14)).toBeGreaterThan(mid);
  });

  it('is fully open from ovulation on and when overdue', () => {
    expect(bloomGrowth(14, 14)).toBe(1);
    expect(bloomGrowth(25, 14)).toBe(1);
    expect(bloomGrowth(3, 14, true)).toBe(1);
  });

  it('handles invalid input', () => {
    expect(bloomGrowth(0, 14)).toBe(0);
    expect(bloomGrowth(NaN, 14)).toBe(0);
    expect(bloomGrowth(5, 1)).toBe(1);
  });
});

describe('bloomTone', () => {
  it('maps phase names', () => {
    expect(bloomTone('Menstrual')).toBe('menstrual');
    expect(bloomTone('Ovulation')).toBe('ovulation');
    expect(bloomTone('Luteal')).toBe('luteal');
    expect(bloomTone('Follicular')).toBe('follicular');
    expect(bloomTone('unknown')).toBe('follicular');
  });
});
