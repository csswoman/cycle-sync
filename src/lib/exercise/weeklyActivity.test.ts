import { describe, it, expect } from 'vitest';
import { isStrengthLog, suggestEffort, summarizeWeek, weekStartOf, type ActivityLog } from './weeklyActivity';

const log = (date: string, over: Partial<ActivityLog> = {}): ActivityLog => ({
  date, exercise: 'Caminata', sets: null, weightKg: null, durationMinutes: 30, ...over,
});

// Wednesday 2025-06-11; its week starts on Monday 2025-06-09.
const now = new Date(2025, 5, 11, 20);

describe('weekStartOf', () => {
  it('returns the Monday of the week, also on a Sunday', () => {
    expect(weekStartOf(now)).toBe('2025-06-09');
    expect(weekStartOf(new Date(2025, 5, 15))).toBe('2025-06-09');
    expect(weekStartOf(new Date(2025, 5, 9))).toBe('2025-06-09');
  });
});

describe('isStrengthLog', () => {
  it('detects strength work from sets, load or the name', () => {
    expect(isStrengthLog(log('2025-06-09', { sets: 3 }))).toBe(true);
    expect(isStrengthLog(log('2025-06-09', { weightKg: 20 }))).toBe(true);
    expect(isStrengthLog(log('2025-06-09', { exercise: 'Fuerza: tren inferior' }))).toBe(true);
    expect(isStrengthLog(log('2025-06-09'))).toBe(false);
  });
});

describe('summarizeWeek', () => {
  it('adds minutes and counts strength days of the current week only', () => {
    const w = summarizeWeek([
      log('2025-06-08', { durationMinutes: 60 }), // last week
      log('2025-06-09', { durationMinutes: 40 }),
      log('2025-06-09', { exercise: 'Sentadillas', sets: 3, weightKg: 30, durationMinutes: null }),
      log('2025-06-11', { exercise: 'Sentadillas', sets: 3, durationMinutes: 25 }),
      log('2025-06-12', { durationMinutes: 90 }), // future entry is ignored
    ], now);
    expect(w.weekStart).toBe('2025-06-09');
    expect(w.minutes).toBe(65);
    expect(w.strengthDays).toBe(2);
    expect(w.activeDays).toBe(2);
    expect(w.minutesGoalMet).toBe(false);
    expect(w.strengthGoalMet).toBe(true);
    expect(w.strengthDaysConsecutive).toBe(false);
  });
  it('notices strength days without a rest day between them', () => {
    const w = summarizeWeek([log('2025-06-10', { sets: 3 }), log('2025-06-11', { sets: 3 })], now);
    expect(w.strengthDaysConsecutive).toBe(true);
  });
  it('meets the minutes goal at 150', () => {
    const w = summarizeWeek([log('2025-06-09', { durationMinutes: 75 }), log('2025-06-10', { durationMinutes: 75 })], now);
    expect(w.minutesGoalMet).toBe(true);
  });
});

describe('suggestEffort', () => {
  it('follows the phase when energy is average or unknown', () => {
    expect(suggestEffort('menstrual', null)).toEqual({ effort: 'gentle', reason: 'phase' });
    expect(suggestEffort('follicular', 5)).toEqual({ effort: 'strong', reason: 'phase' });
    expect(suggestEffort('luteal', 6)).toEqual({ effort: 'moderate', reason: 'phase' });
  });
  it('lets how the user feels override the phase in both directions', () => {
    expect(suggestEffort('follicular', 2)).toEqual({ effort: 'gentle', reason: 'lowEnergy' });
    expect(suggestEffort('menstrual', 9)).toEqual({ effort: 'strong', reason: 'highEnergy' });
  });
  it('does not use the phase when the period is late', () => {
    expect(suggestEffort('luteal', 5, true)).toEqual({ effort: 'moderate', reason: 'latePeriod' });
  });
});
