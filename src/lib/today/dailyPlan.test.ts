import { describe, it, expect } from 'vitest';
import { buildDailyPlan, flexibleStreak, readiness, type TodayCheckin } from './dailyPlan';

const checkin = (over: Partial<TodayCheckin> = {}): TodayCheckin => ({
  energy: null, motivation: null, sleepHours: null, cravings: [], cravingIntensity: null, symptoms: [], ...over,
});

describe('readiness', () => {
  it('is null without relevant signals', () => {
    expect(readiness(null)).toBeNull();
    expect(readiness(checkin())).toBeNull();
  });
  it('takes the lowest signal: no motivation alone means low', () => {
    expect(readiness(checkin({ energy: 9, motivation: 1 }))).toBe('low');
    expect(readiness(checkin({ energy: 5, motivation: 3 }))).toBe('medium');
    expect(readiness(checkin({ energy: 9, motivation: 3, sleepHours: 7.5 }))).toBe('high');
  });
  it('treats short sleep and cramps as low', () => {
    expect(readiness(checkin({ energy: 9, sleepHours: 5 }))).toBe('low');
    expect(readiness(checkin({ energy: 9, symptoms: ['Mild Cramps'] }))).toBe('low');
  });
});

describe('buildDailyPlan', () => {
  const planned = { kind: 'gym' as const, title: 'Pierna', durationMinutes: 45 };

  it('offers the 10-minute minimum on a lazy day, and it counts', () => {
    const p = buildDailyPlan({ phase: 'Follicular', confidence: 'high', checkin: checkin({ energy: 3, motivation: 1 }), planned });
    expect(p.mode).toBe('minimum');
    expect(p.minutes).toBe(10);
    expect(p.basis).toBe('checkin');
    expect(p.move.es).toContain('También cuenta');
  });

  it('shortens the planned workout on a medium day', () => {
    const p = buildDailyPlan({ phase: 'Follicular', confidence: 'high', checkin: checkin({ energy: 5, motivation: 2 }), planned });
    expect(p.mode).toBe('light');
    expect(p.minutes).toBe(25);
    expect(p.move.es).toContain('Pierna');
  });

  it('follows a reliable phase when there is no check-in', () => {
    const p = buildDailyPlan({ phase: 'Luteal', confidence: 'high', checkin: null, planned: null });
    expect(p.basis).toBe('phase');
    expect(p.mode).toBe('light');
    expect(p.meal.es).toContain('magnesio');
  });

  it('does not trust the date-based phase with irregular cycles, contraception or low confidence', () => {
    for (const extra of [{ irregular: true }, { hormonal: true }, { confidence: 'low' as const }, { overdue: true }]) {
      const p = buildDailyPlan({ phase: 'Luteal', confidence: 'high', ...extra, checkin: null, planned: null });
      expect(p.phaseUnreliable).toBe(true);
      expect(p.basis).toBe('none');
      expect(p.meal.es).toContain('PMOS');
    }
  });

  it('keeps planned rest days as rest', () => {
    const p = buildDailyPlan({ phase: 'Follicular', checkin: checkin({ energy: 9, motivation: 3 }), planned: { kind: 'rest', title: 'Descanso', durationMinutes: null } });
    expect(p.mode).toBe('rest');
    expect(p.minutes).toBeNull();
  });

  it('answers a craving without guilt and links it to short sleep when strong', () => {
    const p = buildDailyPlan({ phase: null, checkin: checkin({ cravings: ['sweet'], cravingIntensity: 3, sleepHours: 5 }), planned: null });
    expect(p.craving?.es).toContain('dulce');
    expect(p.craving?.es).toContain('no es falta de voluntad');
    expect(p.focus.es).toContain('acostarte');
  });
});

describe('flexibleStreak', () => {
  it('counts movement days in the last week', () => {
    const s = flexibleStreak(['2026-11-17', '2026-11-15', '2026-11-12', '2026-11-01'], '2026-11-17');
    expect(s.days).toBe(3);
    expect(s.movedToday).toBe(true);
    expect(s.twoZeroDays).toBe(false);
  });
  it('flags two empty days in a row', () => {
    expect(flexibleStreak(['2026-11-14'], '2026-11-17').twoZeroDays).toBe(true);
  });
});
