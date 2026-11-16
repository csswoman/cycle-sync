import { describe, it, expect } from 'vitest';
import {
  isScheduledOn, dosesOn, doseStatus, daySummary, adherence, currentStreak, monthGrid, instructionLabel,
  packPosition, daysOfStockLeft,
} from './schedule';

const daily = { id: 'm1', times: ['20:30', '08:30'], start_date: '2026-11-01' };
// Mon/Wed/Fri only
const mwf = { id: 'm2', times: ['14:30'], days_of_week: [1, 3, 5], start_date: '2026-11-01' };

describe('isScheduledOn', () => {
  it('respects start date and weekdays', () => {
    expect(isScheduledOn(daily, '2026-10-31')).toBe(false);
    expect(isScheduledOn(daily, '2026-11-01')).toBe(true);
    expect(isScheduledOn(mwf, '2026-11-16')).toBe(true); // Monday
    expect(isScheduledOn(mwf, '2026-11-17')).toBe(false); // Tuesday
  });
  it('treats an empty or full weekday list as every day', () => {
    expect(isScheduledOn({ id: 'x', times: ['08:00'], days_of_week: [] }, '2026-11-17')).toBe(true);
    expect(isScheduledOn({ id: 'x', times: ['08:00'], days_of_week: [0, 1, 2, 3, 4, 5, 6] }, '2026-11-17')).toBe(true);
  });
});

describe('dosesOn', () => {
  it('lists doses sorted by time', () => {
    expect(dosesOn([daily, mwf], '2026-11-16').map((d) => `${d.med.id}@${d.time}`)).toEqual(['m1@08:30', 'm2@14:30', 'm1@20:30']);
  });
});

describe('doseStatus', () => {
  const now = new Date(2026, 10, 16, 14, 0);
  it('classifies doses around now', () => {
    expect(doseStatus(true, '2026-11-16', '08:30', now)).toBe('taken');
    expect(doseStatus(false, '2026-11-16', '08:30', now)).toBe('late');
    expect(doseStatus(false, '2026-11-16', '14:20', now)).toBe('due');
    expect(doseStatus(false, '2026-11-16', '20:30', now)).toBe('upcoming');
    expect(doseStatus(false, '2026-11-15', '20:30', now)).toBe('missed');
  });
});

describe('daySummary / adherence / streak', () => {
  const logs = [
    { medication_id: 'm1', date: '2026-11-14', scheduled_time: '08:30', taken: true },
    { medication_id: 'm1', date: '2026-11-14', scheduled_time: '20:30', taken: true },
    { medication_id: 'm1', date: '2026-11-15', scheduled_time: '08:30', taken: true },
    { medication_id: 'm1', date: '2026-11-15', scheduled_time: '20:30', taken: true },
    { medication_id: 'm1', date: '2026-11-13', scheduled_time: '08:30', taken: true },
  ];
  const today = '2026-11-16';
  it('summarises a day', () => {
    expect(daySummary([daily], logs, '2026-11-14', today).status).toBe('full');
    expect(daySummary([daily], logs, '2026-11-13', today).status).toBe('partial');
    expect(daySummary([daily], logs, '2026-11-12', today).status).toBe('missed');
    expect(daySummary([daily], logs, today, today).status).toBe('pending');
    expect(daySummary([daily], logs, '2026-11-20', today).status).toBe('future');
    expect(daySummary([daily], logs, '2026-10-20', today).status).toBe('none');
  });
  it('computes adherence up to today', () => {
    expect(adherence([daily], logs, '2026-11-13', '2026-11-30', today)).toEqual({ taken: 5, total: 8, pct: 63 });
  });
  it('counts the streak without breaking on an unfinished today', () => {
    expect(currentStreak([daily], logs, today)).toBe(2);
  });
});

describe('pill packs', () => {
  const pill = { id: 'p', times: ['21:00'], pack_active_days: 21, pack_break_days: 7, pack_start_date: '2026-11-01' };
  it('skips the break week and repeats', () => {
    expect(isScheduledOn(pill, '2026-11-21')).toBe(true); // day 21
    expect(isScheduledOn(pill, '2026-11-22')).toBe(false); // day 22, break
    expect(isScheduledOn(pill, '2026-11-29')).toBe(true); // new pack
    expect(packPosition(pill, '2026-11-25')).toEqual({ day: 25, length: 28, onBreak: true, daysToNextPack: 4 });
  });
});

describe('daysOfStockLeft', () => {
  it('counts only scheduled days and today\'s remaining doses', () => {
    const med = { id: 'm', times: ['08:00', '20:00'], stock: 5, units_per_dose: 1 };
    // today: 2 doses (3 left), tomorrow: 2 (1 left), day after: needs 2 -> runs out
    expect(daysOfStockLeft(med, '2026-11-16')).toBe(2);
    expect(daysOfStockLeft(med, '2026-11-16', 1)).toBe(3);
    expect(daysOfStockLeft({ ...med, stock: null }, '2026-11-16')).toBeNull();
  });
});

describe('monthGrid', () => {
  it('starts weeks on Monday', () => {
    const grid = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(grid[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(grid[0][6]).toBe('2026-11-01');
    expect(grid.every((w) => w.length === 7)).toBe(true);
  });
});

describe('instructionLabel', () => {
  it('translates known keys', () => {
    expect(instructionLabel('after_lunch', 'es')).toBe('Después del almuerzo');
    expect(instructionLabel('nope', 'es')).toBeNull();
  });
});
