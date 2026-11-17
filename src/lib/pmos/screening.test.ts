import { describe, it, expect } from 'vitest';
import { screeningPlan, gestationalGlucosePlan } from './screening';
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
describe('gestationalGlucosePlan', () => {
  const base = { glucoseDates: [] as string[], pregnancyStart: null as string | null, today: '2026-11-16' };
  it('asks for a preconception glucose check when trying to conceive', () => {
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null })).toEqual([{ key: 'preconception_glucose', done: false }]);
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null, glucoseDates: ['2026-05-01'] })[0].done).toBe(true);
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null, glucoseDates: ['2025-05-01'] })[0].done).toBe(false);
    expect(gestationalGlucosePlan({ ...base, goal: 'wellness', gestationalWeeks: null })).toEqual([]);
  });
  it('adds the first-visit curve, and the 24-28 week one from week 20', () => {
    const p = { ...base, goal: 'fertility', pregnancyStart: '2026-06-01' };
    expect(gestationalGlucosePlan({ ...p, gestationalWeeks: 8 }).map((i) => i.key)).toEqual(['early_ogtt']);
    const late = gestationalGlucosePlan({ ...p, gestationalWeeks: 22, glucoseDates: ['2026-07-01'] });
    expect(late).toEqual([{ key: 'early_ogtt', done: true }, { key: 'ogtt_24_28', done: false }]);
  });
});
