import { describe, it, expect } from 'vitest';
import { inductionCycleRows } from './induction';
import { emptySign } from './fertilitySigns';
describe('inductionCycleRows', () => {
  it('joins drug days, temperature, LH and pregnancy test by cycle day', () => {
    const signs = [
      { ...emptySign('2026-05-03'), bbtCelsius: 36.4 },
      { ...emptySign('2026-05-14'), lhTest: 'positive' as const, bbtCelsius: 36.7, bbtDisturbed: true },
      { ...emptySign('2026-05-28'), pregnancyTest: 'negative' as const },
    ];
    const rows = inductionCycleRows('2026-05-01', '2026-05-30', [3, 4, 5], signs, ['2026-05-03']);
    expect(rows.map((r) => r.cycleDay)).toEqual([3, 4, 5, 14, 28]);
    expect(rows[0]).toMatchObject({ scheduled: true, taken: true, bbtCelsius: 36.4 });
    expect(rows[1]).toMatchObject({ scheduled: true, taken: false });
    expect(rows[3]).toMatchObject({ lhTest: 'positive', bbtCelsius: null });
    expect(rows[4].pregnancyTest).toBe('negative');
  });
  it('stops at today', () => {
    expect(inductionCycleRows('2026-05-01', '2026-05-04', [3, 4, 5, 6], [], []).map((r) => r.cycleDay)).toEqual([3, 4]);
  });
});
