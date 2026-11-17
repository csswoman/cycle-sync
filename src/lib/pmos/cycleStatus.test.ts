import { describe, it, expect } from 'vitest';
import { fertileNow, periodGap } from './cycleStatus';
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
describe('periodGap with pregnancy', () => {
  it('gives no late alert during a pregnancy or after it until a new period', () => {
    expect(periodGap(['2026-01-01'], '2026-06-01')?.level).toBe('alert');
    expect(periodGap(['2026-01-01'], '2026-06-01', [{ start_date: '2026-01-01', end_date: null }])).toBeNull();
    expect(periodGap(['2026-01-01'], '2026-06-01', [{ start_date: '2026-01-01', end_date: '2026-05-01' }])).toBeNull();
    expect(periodGap(['2026-01-01', '2026-05-20'], '2026-06-01', [{ start_date: '2026-01-01', end_date: '2026-05-01' }])?.level).toBe('ok');
  });
});
