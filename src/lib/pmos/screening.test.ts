import { describe, it, expect } from 'vitest';
import { bmi, diabetesRiskFactors, screeningPlan, gestationalGlucosePlan } from './screening';
import { derivedSeries, freeAndrogenIndex, markerInfo, markerStatus } from './metrics';
import { isOnMetformin } from './metformin';

describe('screeningPlan', () => {
  it('marks never / due / ok and adds B12 only with metformin', () => {
    const plan = screeningPlan({
      labs: [{ date: '2025-06-01', marker: 'hba1c' }, { date: '2025-09-01', marker: 'fasting_glucose' }, { date: '2026-01-10', marker: 'ldl' }],
      bloodPressureDates: [],
      onMetformin: false,
    }, '2026-11-16');
    expect(plan.map((p) => [p.key, p.status])).toEqual([
      ['glucose', 'due'], ['lipids', 'ok'], ['blood_pressure', 'never'],
    ]);
    expect(plan[0]).toMatchObject({ last: '2025-09-01', due: '2026-09-01' });
    const withMet = screeningPlan({ labs: [], bloodPressureDates: [], onMetformin: true }, '2026-11-16');
    expect(withMet.at(-1)?.key).toBe('vitamin_b12');
  });
  it('flags a check coming up within 30 days as soon', () => {
    const plan = screeningPlan({ labs: [], bloodPressureDates: ['2025-12-01'], onMetformin: false }, '2026-11-16');
    expect(plan.find((p) => p.key === 'blood_pressure')?.status).toBe('soon');
  });
  it('spaces glucose to 3 years only without known risk factors', () => {
    const labs = [{ date: '2025-01-10', marker: 'hba1c', value: 5.2 }];
    const low = screeningPlan({ labs, bloodPressureDates: [], onMetformin: false, risk: { bmi: 22, highBloodPressure: false } }, '2026-11-16');
    expect(low[0]).toMatchObject({ due: '2028-01-10', status: 'ok', preferOgtt: false, riskFactors: [] });
    const unknown = screeningPlan({ labs, bloodPressureDates: [], onMetformin: false }, '2026-11-16');
    expect(unknown[0]).toMatchObject({ due: '2026-01-10', status: 'due', preferOgtt: false, riskFactors: ['unknown_weight'] });
    const heavy = screeningPlan({ labs, bloodPressureDates: [], onMetformin: false, risk: { bmi: 31, highBloodPressure: false } }, '2026-11-16');
    expect(heavy[0]).toMatchObject({ due: '2026-01-10', preferOgtt: true });
  });
  it('reads prediabetes from labs as a risk factor', () => {
    expect(diabetesRiskFactors([{ date: '2026-01-01', marker: 'hba1c', value: 5.9 }], { bmi: 22, highBloodPressure: false })).toEqual(['prediabetes']);
    expect(diabetesRiskFactors([], { bmi: 22, highBloodPressure: true })).toEqual(['high_blood_pressure']);
  });
  it('computes BMI', () => {
    expect(bmi(160, 64)).toBeCloseTo(25, 1);
    expect(bmi(null, 64)).toBeNull();
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
  const base = { labs: [] as { date: string; marker: string }[], pregnancyStart: null as string | null, today: '2026-11-16' };
  const lab = (date: string, marker = 'hba1c') => ({ date, marker });
  it('asks for a preconception glucose check when trying to conceive', () => {
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null })).toEqual([{ key: 'preconception_glucose', done: false }]);
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null, labs: [lab('2026-05-01')] })[0].done).toBe(true);
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null, labs: [lab('2025-05-01')] })[0].done).toBe(false);
    expect(gestationalGlucosePlan({ ...base, goal: 'fertility', gestationalWeeks: null, labs: [lab('2026-05-01', 'ldl')] })[0].done).toBe(false);
    expect(gestationalGlucosePlan({ ...base, goal: 'wellness', gestationalWeeks: null })).toEqual([]);
  });
  it('adds the first-visit curve, and the 24-28 week one from week 20', () => {
    const p = { ...base, goal: 'fertility', pregnancyStart: '2026-06-01' };
    expect(gestationalGlucosePlan({ ...p, gestationalWeeks: 8 }).map((i) => i.key)).toEqual(['early_ogtt']);
    const late = gestationalGlucosePlan({ ...p, gestationalWeeks: 22, labs: [lab('2026-07-01')] });
    expect(late).toEqual([{ key: 'early_ogtt', done: true }, { key: 'ogtt_24_28', done: false }]);
  });
  it('only counts a 2-hour value from week 24 for the 24-28 week curve', () => {
    const p = { ...base, goal: 'fertility', pregnancyStart: '2026-01-01', gestationalWeeks: 27 };
    // Week 24 starts on 2026-06-18.
    expect(gestationalGlucosePlan({ ...p, labs: [lab('2026-06-20', 'hba1c')] })[1].done).toBe(false);
    expect(gestationalGlucosePlan({ ...p, labs: [lab('2026-06-10', 'glucose_2h')] })[1].done).toBe(false);
    expect(gestationalGlucosePlan({ ...p, labs: [lab('2026-06-20', 'glucose_2h')] })[1].done).toBe(true);
  });
});

describe('metformin detection', () => {
  it('recognises generic and brand names', () => {
    expect(isOnMetformin([{ name: 'Metformina 850', active: true }])).toBe(true);
    expect(isOnMetformin([{ name: 'Glucophage XR', active: true }])).toBe(true);
    expect(isOnMetformin([{ name: 'Glucophage XR', active: false }])).toBe(false);
    expect(isOnMetformin([{ name: 'Inositol', active: true }])).toBe(false);
  });
});

describe('lab reference range', () => {
  it("prefers the lab's own range when given", () => {
    const info = markerInfo('testosterone');
    expect(markerStatus(info, 65)).toBe('ok');
    expect(markerStatus(info, 65, { low: 10, high: 55 })).toBe('high');
    expect(markerStatus(info, 65, { low: null, high: null })).toBe('ok');
  });
});
