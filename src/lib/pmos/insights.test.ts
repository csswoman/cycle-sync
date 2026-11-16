import { describe, it, expect } from 'vitest';
import { buildInsights, cycleChangeInsights, glucoseInsight, sleepInsights, adherenceSymptomInsight, type InsightInput } from './insights';
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
