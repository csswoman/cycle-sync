import { describe, it, expect } from 'vitest';
import { screeningPlan } from './screening';
import { derivedSeries, freeAndrogenIndex } from './metrics';

describe('screeningPlan', () => {
  it('marks never / due / ok and adds B12 only with metformin', () => {
    const plan = screeningPlan({
      labs: [{ date: '2025-06-01', marker: 'hba1c' }, { date: '2026-01-10', marker: 'ldl' }],
      fastingGlucoseDates: ['2025-09-01'],
      bloodPressureDates: [],
      onMetformin: false,
    }, '2026-11-16');
    expect(plan.map((p) => [p.key, p.status])).toEqual([
      ['glucose', 'due'], ['lipids', 'ok'], ['blood_pressure', 'never'],
    ]);
    expect(plan[0]).toMatchObject({ last: '2025-09-01', due: '2026-09-01' });
    const withMet = screeningPlan({ labs: [], fastingGlucoseDates: [], bloodPressureDates: [], onMetformin: true }, '2026-11-16');
    expect(withMet.at(-1)?.key).toBe('vitamin_b12');
  });
});

describe('free androgen index', () => {
  it('converts ng/dL and divides by SHBG', () => {
    expect(freeAndrogenIndex(60, 30)).toBeCloseTo(6.94, 2);
    expect(freeAndrogenIndex(null, 30)).toBeNull();
  });
  it('pairs same-day results', () => {
    const series = derivedSeries([
      { date: '2026-01-01', marker: 'testosterone', value: 60 },
      { date: '2026-01-01', marker: 'shbg', value: 30 },
      { date: '2026-02-01', marker: 'testosterone', value: 50 },
    ], 'testosterone', 'shbg', freeAndrogenIndex);
    expect(series).toEqual([{ date: '2026-01-01', value: 6.94 }]);
  });
});
