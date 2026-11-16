import { describe, it, expect } from 'vitest';
import { bringList, daysUntil, lastPastAppointment, nextAppointment, showAppointmentBanner } from './appointments';
const ap = (date: string, time: string | null = null) => ({ date, time });
describe('appointments', () => {
  it('counts calendar days across a month end', () => {
    expect(daysUntil('2026-12-02', '2026-11-30')).toBe(2);
    expect(daysUntil('2026-11-15', '2026-11-16')).toBe(-1);
  });
  it('picks the next and last past appointments', () => {
    const list = [ap('2026-10-01'), ap('2026-12-10'), ap('2026-11-20', '09:00'), ap('2026-11-20', '08:00')];
    expect(nextAppointment(list, '2026-11-16')).toEqual(ap('2026-11-20', '08:00'));
    expect(lastPastAppointment(list, '2026-11-16')).toEqual(ap('2026-10-01'));
    expect(nextAppointment([ap('2026-01-01')], '2026-11-16')).toBeNull();
  });
  it('shows the banner from 3 days before until the day itself', () => {
    expect(showAppointmentBanner('2026-11-19', '2026-11-16')).toBe(true);
    expect(showAppointmentBanner('2026-11-16', '2026-11-16')).toBe(true);
    expect(showAppointmentBanner('2026-11-20', '2026-11-16')).toBe(false);
    expect(showAppointmentBanner('2026-11-15', '2026-11-16')).toBe(false);
  });
  it('lists overdue screenings and pending questions only', () => {
    const plan = [
      { key: 'glucose' as const, last: null, due: null, status: 'never' as const },
      { key: 'lipids' as const, last: '2026-01-01', due: '2028-01-01', status: 'ok' as const },
      { key: 'blood_pressure' as const, last: '2025-01-01', due: '2026-01-01', status: 'due' as const },
    ];
    expect(bringList(plan, [{ question: 'a', done: false }, { question: 'b', done: true }])).toEqual({
      screenings: ['glucose', 'blood_pressure'], questions: ['a'],
    });
  });
});
