import { describe, it, expect } from 'vitest';
import { fertileNow, lhUnreliable, ovulationHistory, periodGap } from './cycleStatus';
import { emptySign, type CycleSign } from '@/lib/cycle/fertilitySigns';
const sign = (date: string, patch: Partial<CycleSign>): CycleSign => ({ ...emptySign(date), ...patch });
describe('fertileNow', () => {
  it('falls back to the calendar without signs', () => {
    expect(fertileNow([], '2026-05-01', '2026-05-12')).toEqual({ level: 'calendar', reasons: [] });
  });
  it('reads egg-white mucus as high and a lone LH strip as possible', () => {
    expect(fertileNow([sign('2026-05-11', { cervicalMucus: 'eggwhite' })], '2026-05-01', '2026-05-12').level).toBe('high');
    expect(fertileNow([sign('2026-05-12', { lhTest: 'positive' })], '2026-05-01', '2026-05-12').level).toBe('possible');
    expect(fertileNow([sign('2026-05-12', { lhTest: 'positive', cervicalMucus: 'watery' })], '2026-05-01', '2026-05-12').level).toBe('high');
  });
  it('ignores signs older than 3 days', () => {
    expect(fertileNow([sign('2026-05-05', { cervicalMucus: 'eggwhite' })], '2026-05-01', '2026-05-12').level).toBe('calendar');
  });
});
describe('fertileNow with irregular cycles', () => {
  it('says unknown instead of falling back to the calendar', () => {
    expect(fertileNow([], '2026-05-01', '2026-05-12', { irregular: true }).level).toBe('unknown');
    expect(fertileNow([sign('2026-05-11', { cervicalMucus: 'eggwhite' })], '2026-05-01', '2026-05-12', { irregular: true }).level).toBe('high');
  });
});
describe('periodGap with pregnancy', () => {
  it('gives no count during a pregnancy and counts from its end afterwards', () => {
    expect(periodGap(['2026-01-01'], '2026-06-01')?.level).toBe('alert');
    expect(periodGap(['2026-01-01'], '2026-06-01', [{ start_date: '2026-01-01', end_date: null }])).toBeNull();
    expect(periodGap(['2026-01-01'], '2026-06-01', [{ start_date: '2026-01-01', end_date: '2026-05-01' }]))
      .toMatchObject({ since: 'pregnancy_end', from: '2026-05-01', days: 31, level: 'ok' });
    expect(periodGap(['2026-01-01'], '2026-09-15', [{ start_date: '2026-01-01', end_date: '2026-05-01' }]))
      .toMatchObject({ since: 'pregnancy_end', level: 'alert' });
    expect(periodGap(['2026-01-01', '2026-05-20'], '2026-06-01', [{ start_date: '2026-01-01', end_date: '2026-05-01' }]))
      .toMatchObject({ since: 'period', level: 'ok' });
  });
});
describe('periodGap when long gaps are expected', () => {
  it('reports the days but never warns', () => {
    expect(periodGap(['2026-01-01'], '2026-06-01', [], { gapsExpected: true })).toMatchObject({ days: 151, level: 'ok', expected: true });
  });
});
describe('ovulationHistory evidence', () => {
  const temps = (month: string, values: number[]) =>
    values.map((c, i) => sign(`2026-${month}-${String(5 + i).padStart(2, '0')}`, { bbtCelsius: c }));
  it('confirms ovulation with a luteal progesterone of 3 or more', () => {
    const hist = ovulationHistory(['2026-09-01', '2026-10-01'], [], '2026-10-20', 6, [{ date: '2026-09-22', value: 8 }]);
    expect(hist[1]).toMatchObject({ status: 'confirmed', confirmedBy: 'progesterone' });
    expect(ovulationHistory(['2026-09-01', '2026-10-01'], [], '2026-10-20', 6, [{ date: '2026-09-22', value: 1.2 }])[1].status).toBe('no_data');
  });
  it('lets a full flat temperature chart outweigh a positive LH', () => {
    const flat = temps('09', Array(22).fill(36.4));
    const signs = [...flat, sign('2026-09-14', { lhTest: 'positive' })];
    const hist = ovulationHistory(['2026-09-01', '2026-10-01'], signs, '2026-10-02');
    expect(hist[1]).toMatchObject({ status: 'not_detected', lhPositive: true });
  });
  it('does not count LH positive on many days spread across the cycle', () => {
    const signs = ['2026-09-06', '2026-09-12', '2026-09-20'].map((d) => sign(d, { lhTest: 'positive' }));
    const hist = ovulationHistory(['2026-09-01', '2026-10-01'], signs, '2026-10-02');
    expect(hist[1]).toMatchObject({ status: 'no_data', lhUnreliable: true });
    expect(lhUnreliable(['2026-09-12', '2026-09-13', '2026-09-14'])).toBe(false);
  });
});
