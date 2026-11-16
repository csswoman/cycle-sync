import { describe, it, expect } from 'vitest';
import { buildInsights, cycleChangeInsights, glucoseInsight, sleepInsights, adherenceSymptomInsight,
  exerciseInsight, activitySleepInsight, treatmentCheckpoint, phaseSymptomInsight, waistCycleInsight, sideEffectInsights, type InsightInput } from './insights';
import { periodGap, ovulationHistory } from './cycleStatus';
import { scoreWellbeing, isCheckDue, fgTotal } from './wellbeing';
import { emptySign } from '@/lib/cycle/fertilitySigns';

const base: InsightInput = {
  today: '2026-11-16', periodStarts: [], medications: [], medLogs: [], symptomTotals: [], fastingGlucose: [], dailyLogs: [],
};
const met = { id: 'm', name: 'Metformina', times: ['20:00'], start: '2026-06-01', start_date: '2026-06-01', active: true };

describe('insights', () => {
  it('compares cycle length before and after a treatment', () => {
    const out = cycleChangeInsights({ ...base, medications: [met],
      periodStarts: ['2026-01-01', '2026-02-20', '2026-04-10', '2026-06-05', '2026-07-08', '2026-08-10'] });
    expect(out).toHaveLength(1);
    expect(out[0].tone).toBe('positive');
    expect(out[0].es).toContain('de 52 a 33 días');
  });
  it('compares fasting glucose around the start date', () => {
    const g = glucoseInsight({ ...base, medications: [met], fastingGlucose: [
      { date: '2026-04-01', value: 105 }, { date: '2026-05-01', value: 103 }, { date: '2026-07-01', value: 95 }, { date: '2026-08-01', value: 93 },
    ] });
    expect(g?.tone).toBe('positive');
    expect(g?.es).toContain('94 mg/dL');
  });
  it('links short sleep with cravings only with enough data', () => {
    const mk = (i: number, h: number, crave: boolean) => ({ date: `2026-10-${String(i).padStart(2, '0')}`, sleep_hours: h, energy_level: h < 6 ? 3 : 7, symptoms: crave ? ['Sugar Cravings'] : [] });
    const logs = [1, 2, 3, 4].map((i) => mk(i, 5, true)).concat([5, 6, 7, 8].map((i) => mk(i, 8, false)));
    const out = sleepInsights({ ...base, dailyLogs: logs });
    expect(out.map((i) => i.id)).toEqual(['sleep-cravings', 'sleep-energy']);
    expect(sleepInsights({ ...base, dailyLogs: logs.slice(1) })).toEqual([]);
  });
  it('compares symptoms on full-adherence days vs missed days', () => {
    const days = Array.from({ length: 10 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const medLogs = days.slice(0, 5).map((date) => ({ medication_id: 'm', date, scheduled_time: '20:00', taken: true }));
    const symptomTotals = days.map((date, i) => ({ date, total: i < 5 ? 3 : 7 }));
    expect(adherenceSymptomInsight({ ...base, medications: [met], medLogs, symptomTotals })?.tone).toBe('positive');
  });
  it('returns nothing without data', () => {
    expect(buildInsights(base)).toEqual([]);
  });
});

describe('cycle status', () => {
  it('classifies the gap since the last period', () => {
    expect(periodGap(['2026-10-20'], '2026-11-16')?.level).toBe('ok');
    expect(periodGap(['2026-09-20'], '2026-11-16')?.level).toBe('long');
    expect(periodGap(['2026-07-01'], '2026-11-16')).toMatchObject({ level: 'alert', days: 138 });
    expect(periodGap([], '2026-11-16')).toBeNull();
  });
  it('confirms ovulation with a temperature shift and marks LH-only as possible', () => {
    const temps = [36.4, 36.4, 36.3, 36.4, 36.4, 36.4, 36.7, 36.7, 36.7];
    const signs = temps.map((c, i) => ({ ...emptySign(`2026-09-${String(10 + i).padStart(2, '0')}`), bbtCelsius: c }));
    signs.push({ ...emptySign('2026-10-15'), lhTest: 'positive' });
    const hist = ovulationHistory(['2026-09-01', '2026-10-01', '2026-11-01'], signs, '2026-11-16');
    expect(hist.map((h) => h.status)).toEqual(['no_data', 'possible', 'confirmed']);
  });
});

describe('wellbeing', () => {
  it('scores PHQ-2 / GAD-2 and sleep signs', () => {
    const r = scoreWellbeing({ phq_interest: 2, phq_mood: 1, gad_nervous: 1, gad_worry: 1, snoring: true, daytime_tiredness: true, observed_apnea: false });
    expect(r).toEqual({ phq2: 3, gad2: 2, moodFlag: true, anxietyFlag: false, sleepFlag: true });
    expect(isCheckDue('2026-10-10', '2026-11-16')).toBe(true);
    expect(isCheckDue('2026-11-01', '2026-11-16')).toBe(false);
  });
  it('totals Ferriman-Gallwey scores', () => {
    expect(fgTotal({ upper_lip: 2, chin: 3, thigh: 9 })).toBe(9);
  });
});

const day = (n: number) => { const d = new Date(2026, 9, 1 + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
describe('phase 6 insights', () => {
  const logsFor = (energyAfter: number, energyRest: number) => {
    const workoutDates = [0, 2, 4, 6, 8].map(day);
    const dailyLogs = Array.from({ length: 10 }, (_, i) => ({
      date: day(i), sleep_hours: 7, symptoms: [], energy_level: workoutDates.includes(day(i - 1)) ? energyAfter : energyRest,
    }));
    return { workoutDates, dailyLogs };
  };
  it('exercise: positive, neutral and not enough data', () => {
    expect(exerciseInsight({ ...base, ...logsFor(8, 5) })?.tone).toBe('positive');
    expect(exerciseInsight({ ...base, ...logsFor(6, 6) })).toBeNull();
    expect(exerciseInsight({ ...base, workoutDates: [day(0)], dailyLogs: logsFor(8, 5).dailyLogs.slice(0, 3) })).toBeNull();
  });
  it('exercise: different energy with lower after-workout energy is neutral', () => {
    expect(exerciseInsight({ ...base, ...logsFor(4, 7) })?.tone).toBe('neutral');
  });
  it('activity and sleep: compares steps with symptom score', () => {
    const healthData = Array.from({ length: 8 }, (_, i) => ({ date: day(i), steps: i < 4 ? 9000 : 2000, sleep_duration_seconds: 7 * 3600 }));
    const symptomTotals = healthData.map((h, i) => ({ date: h.date, total: i < 4 ? 3 : 8 }));
    expect(activitySleepInsight({ ...base, healthData, symptomTotals })?.tone).toBe('positive');
    expect(activitySleepInsight({ ...base, healthData, symptomTotals: symptomTotals.map((s) => ({ ...s, total: 5 })) })).toBeNull();
    expect(activitySleepInsight({ ...base, healthData: healthData.slice(0, 3), symptomTotals })).toBeNull();
  });
  const spiro = { id: 's', name: 'Espironolactona', times: ['08:00'], start: '2026-05-01', start_date: '2026-05-01', active: true };
  const range = (from: string, n: number, f: (i: number) => number) =>
    Array.from({ length: n }, (_, i) => { const d = parse(from, i); return { date: d, total: f(i), value: f(i) }; });
  function parse(from: string, add: number) {
    const [y, m, d] = from.split('-').map(Number); const x = new Date(y, m - 1, d + add);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }
  it('treatment checkpoint at 6 months compares before and now', () => {
    const symptomTotals = [...range('2026-04-05', 25, () => 12), ...range('2026-10-20', 12, () => 6)].map(({ date, total }) => ({ date, total }));
    const out = treatmentCheckpoint({ ...base, today: '2026-11-01', medications: [spiro], symptomTotals,
      hirsutism: [{ date: '2026-04-20', total: 14 }, { date: '2026-10-25', total: 10 }] });
    expect(out).toHaveLength(1);
    expect(out[0].tone).toBe('positive');
    expect(out[0].es).toContain('6 meses');
    expect(out[0].es).toContain('tarda en notarse');
  });
  it('treatment checkpoint: nothing before 3 months or without data', () => {
    expect(treatmentCheckpoint({ ...base, today: '2026-06-15', medications: [spiro] })).toEqual([]);
    expect(treatmentCheckpoint({ ...base, today: '2026-11-01', medications: [spiro] })).toEqual([]);
  });
  it('treatment checkpoint: flat scores are neutral', () => {
    const symptomTotals = [...range('2026-04-05', 25, () => 8), ...range('2026-10-20', 12, () => 8)].map(({ date, total }) => ({ date, total }));
    const out = treatmentCheckpoint({ ...base, today: '2026-11-01', medications: [spiro], symptomTotals, hirsutism: [{ date: '2026-04-20', total: 10 }, { date: '2026-10-25', total: 10 }] });
    expect(out[0]?.tone).toBe('neutral');
  });
  it('phase symptoms need confirmed ovulation and no hormonal contraception', () => {
    // Two cycles of 28 days, temperature rise confirmed around day 14.
    const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
    const signs = ['2026-01-01', '2026-01-29'].flatMap((st) => Array.from({ length: 28 }, (_, i) => ({
      ...emptySign(parse(st, i)), bbtCelsius: i < 14 ? 36.3 + (i % 2) * 0.05 : 36.8,
    })));
    const symptomTotals = Array.from({ length: 56 }, (_, i) => ({ date: parse('2026-01-01', i), total: i % 28 < 14 ? 3 : 9 }));
    const input = { ...base, today: '2026-03-01', periodStarts: starts, signs, symptomTotals };
    expect(phaseSymptomInsight(input)?.es).toContain('después de ovular');
    expect(phaseSymptomInsight({ ...input, hormonal: true })).toBeNull();
    expect(phaseSymptomInsight({ ...input, signs: [] })).toBeNull();
  });
  it('waist vs cycles: shows trend, hidden without numbers or data', () => {
    const waist = [0, 30, 60, 90, 120, 150].map((n, i) => ({ date: parse('2026-01-01', n), value: 100 - i * 2 }));
    const periodStarts = ['2025-11-01', '2025-12-15', '2026-01-25', '2026-03-05', '2026-04-02', '2026-04-30', '2026-05-28'];
    const input = { ...base, today: '2026-06-10', waist, periodStarts };
    expect(waistCycleInsight(input)?.es).toContain('cm');
    expect(waistCycleInsight({ ...input, hideNumbers: true })).toBeNull();
    expect(waistCycleInsight({ ...input, waist: waist.slice(0, 2) })).toBeNull();
  });
});
describe('side effects', () => {
  const met2 = { id: 'm', name: 'Metformina', times: ['20:00'], start: '2026-10-01', start_date: '2026-10-01', active: true };
  const eff = (date: string, effect = 'nausea', severity = 1) => ({ medication_id: 'm', date, effect, severity });
  it('summarises effects in the first weeks and notes when they ease', () => {
    const out = sideEffectInsights({ ...base, medications: [met2], sideEffects: [eff('2026-10-03'), eff('2026-10-05'), eff('2026-10-09', 'diarrhea'), eff('2026-11-10')] });
    expect(out).toHaveLength(1);
    expect(out[0].es).toContain('náuseas (3)');
    expect(out[0].es).toContain('segunda mitad');
    expect(out[0].tone).toBe('neutral');
  });
  it('marks strong effects as attention', () => {
    expect(sideEffectInsights({ ...base, medications: [met2], sideEffects: [eff('2026-10-03', 'nausea', 3), eff('2026-10-04')] })[0].tone).toBe('attention');
  });
  it('opens a new window after a dose change and keeps windows apart', () => {
    const doseChanges = [{ medication_id: 'm', date: '2026-10-20', dose: '1700 mg', weeks: 4 }];
    const sideEffects = [eff('2026-10-03'), eff('2026-10-05'), eff('2026-10-25'), eff('2026-10-30', 'diarrhea'), eff('2026-11-30'), eff('2026-12-01')];
    const out = sideEffectInsights({ ...base, medications: [met2], doseChanges, sideEffects });
    expect(out).toHaveLength(2);
    expect(out[0].es).toContain('primeras 8 semanas');
    expect(out[0].es).toContain('2 molestias');
    expect(out[1].es).toContain('1700 mg');
    expect(out[1].es).toContain('2 molestias');
  });
  it('ignores a single entry, other medications and effects after week 8', () => {
    expect(sideEffectInsights({ ...base, medications: [met2], sideEffects: [eff('2026-10-03')] })).toEqual([]);
    expect(sideEffectInsights({ ...base, medications: [met2], sideEffects: [eff('2026-12-20'), eff('2026-12-21')] })).toEqual([]);
    expect(sideEffectInsights({ ...base, medications: [met2], sideEffects: [{ ...eff('2026-10-03'), medication_id: 'x' }, { ...eff('2026-10-04'), medication_id: 'x' }] })).toEqual([]);
  });
});
