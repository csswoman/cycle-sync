import { describe, it, expect } from 'vitest';
import { buildWeeklySummary, type SummaryLog } from './weekly';

const log = (date: string, energy: number | null, sleepHours: number | null, symptoms: string[] = []): SummaryLog => ({
  date, energy, sleepHours, symptoms,
});

describe('buildWeeklySummary', () => {
  const end = '2026-04-26';

  it('reports a drop in the luteal phase that coincides with short sleep', () => {
    const logs = [
      log('2026-04-20', 8, 8), log('2026-04-21', 8, 7.5), log('2026-04-22', 7, 7),
      log('2026-04-24', 4, 5), log('2026-04-25', 3, 5.5), log('2026-04-26', 4, 6),
      log('2026-04-13', 8, 8), log('2026-04-14', 8, 8),
    ];
    const s = buildWeeklySummary({
      logs, endDate: end, language: 'es',
      phaseOf: (d) => (d >= '2026-04-23' ? 'Luteal' : 'Ovulation'),
    });
    expect(s.loggedDays).toBe(6);
    expect(s.insights.join(' ')).toContain('bajó');
    expect(s.insights.join(' ')).toContain('fase lútea');
    expect(s.insights.join(' ')).toContain('Coincidió con dormir menos');
  });

  it('says nothing about differences that are too small or lack data', () => {
    const logs = [log('2026-04-25', 6, 7), log('2026-04-26', 6.5, 7)];
    const s = buildWeeklySummary({ logs, endDate: end, language: 'en', phaseOf: () => 'Follicular' });
    expect(s.insights).toEqual([]);
    expect(s.avgEnergy).toBe(6.3);
  });

  it('lists repeated symptoms and plan adherence', () => {
    const logs = [log('2026-04-24', 5, 7, ['Cramps']), log('2026-04-25', 5, 7, ['cramps', 'acne'])];
    const s = buildWeeklySummary({
      logs, endDate: end, language: 'en', phaseOf: () => 'Menstrual',
      adherence: { mealsDone: 10, mealsPlanned: 28, workoutsDone: 3, workoutsPlanned: 5 },
    });
    expect(s.insights.join(' ')).toContain('cramps (2 days)');
    expect(s.insights.join(' ')).toContain('10/28 meals and 3/5 workouts');
  });

  it('finds cravings concentrated in one phase, but not when the phase is unreliable', () => {
    const c = (date: string): SummaryLog => ({ date, energy: 5, sleepHours: 7, symptoms: [], cravings: ['sweet'] });
    const logs = [c('2026-04-22'), c('2026-04-24'), c('2026-04-25'), log('2026-04-15', 6, 7), log('2026-04-16', 6, 7)];
    const phaseOf = (d: string) => (d >= '2026-04-21' ? 'Luteal' : 'Follicular');
    const s = buildWeeklySummary({ logs, endDate: end, language: 'es', phaseOf });
    expect(s.insights.join(' ')).toContain('3 fueron en la fase lútea');
    const off = buildWeeklySummary({ logs, endDate: end, language: 'es', phaseOf, phaseReliable: false });
    expect(off.insights.join(' ')).not.toContain('fase lútea');
  });

  it('links cravings to short sleep', () => {
    const logs = [
      { date: '2026-04-20', energy: 5, sleepHours: 5, symptoms: ['Sugar Cravings'] },
      { date: '2026-04-21', energy: 5, sleepHours: 5.5, symptoms: [], cravings: ['salty'] },
      log('2026-04-22', 6, 8), log('2026-04-23', 6, 7.5),
    ];
    const s = buildWeeklySummary({ logs, endDate: end, language: 'es', phaseOf: () => 'Follicular' });
    expect(s.insights.join(' ')).toContain('no es falta de voluntad');
  });

  it('counts movement days and next-day energy', () => {
    const logs = [
      log('2026-04-21', 8, 7), log('2026-04-23', 8, 7),
      log('2026-04-24', 4, 7), log('2026-04-26', 5, 7),
    ];
    const s = buildWeeklySummary({ logs, endDate: end, language: 'en', phaseOf: () => 'Follicular', moveDates: ['2026-04-20', '2026-04-22'] });
    const text = s.insights.join(' ');
    expect(text).toContain('You moved on 2 of 7 days');
    expect(text).toContain('The day after moving, your energy was 8');
  });
});
