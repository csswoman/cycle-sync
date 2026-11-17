import { describe, it, expect } from 'vitest';
import { suggestQuestions } from './suggestedQuestions';
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
const base: PMOSOverviewData = {
  today: '2026-11-16', periodStarts: [], periodRuns: [], medications: [], medLogs: [], symptomTotals: [], fastingGlucose: [],
  bloodPressureDates: ['2026-10-01'], labs: [], dailyLogs: [], signs: [], mealReadings: [], workoutDates: [], healthData: [], acne: [],
  hirsutism: [], waist: [], doseChanges: [], sideEffects: [], hormonal: false, pregnancies: [], goal: null,
};
const ids = (d: PMOSOverviewData, ins: Parameters<typeof suggestQuestions>[1] = []) => suggestQuestions(d, ins).map((q) => q.id);
describe('suggestQuestions', () => {
  it('asks about overdue check-ups only', () => {
    const out = ids({ ...base, labs: [{ date: '2026-09-01', marker: 'hdl', value: 55 }, { date: '2026-09-01', marker: 'fasting_glucose', value: 90 }] });
    expect(out).toEqual([]);
  });
  it('asks about missing glucose and lipids when never logged', () => {
    expect(ids(base)).toEqual(['screen-glucose', 'screen-lipids']);
  });
  it('uses her own numbers for the period gap and HOMA-IR', () => {
    const d = { ...base, periodStarts: ['2026-07-01'],
      labs: [{ date: '2026-10-01', marker: 'fasting_glucose', value: 100 }, { date: '2026-10-01', marker: 'fasting_insulin', value: 14 },
        { date: '2026-10-01', marker: 'total_cholesterol', value: 180 }, { date: '2026-10-01', marker: 'hba1c', value: 5.2 }] };
    const q = suggestQuestions(d, []);
    expect(q.find((x) => x.id === 'period-gap')?.es).toContain('138 días');
    expect(q.find((x) => x.id === 'homa')?.es).toContain('3.46');
  });
  it('turns attention insights into questions and caps the list at 6', () => {
    const ins = [
      { id: 'side-effects-m-2026-10-01', tone: 'attention' as const, icon: '', es: '', en: '' },
      { id: 'checkpoint-m-6', tone: 'neutral' as const, icon: '', es: '', en: '' },
      { id: 'adh-m', tone: 'attention' as const, icon: '', es: '', en: '' },
    ];
    const out = ids(base, ins);
    expect(out).toContain('side-effects-m-2026-10-01');
    expect(out).toContain('adh-m');
    expect(out.length).toBeLessThanOrEqual(6);
  });
});
