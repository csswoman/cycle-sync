import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

import { computeCycleInfo } from './useCycleInfo';
import { CyclePhase, type CycleConfig, type Period } from '@/types';

const config = (over: Partial<CycleConfig> = {}): CycleConfig => ({
  id: '', user_id: 'u', cycle_length: 28, last_period_start: null,
  workout_prefs: [], dietary_prefs: [], archetype: null, created_at: '', updated_at: '',
  ...over,
} as CycleConfig);

const period = (start: string) => ({ start_date: start }) as Period;

// Period starts 2025-01-01 (local). Day N = Jan N.
const day = (n: number) => new Date(2025, 0, n, 12);

describe('computeCycleInfo', () => {
  it('defaults to follicular day 1 with no data', () => {
    expect(computeCycleInfo(config(), [], day(10))).toEqual({
      phase: CyclePhase.FOLLICULAR, cycleDay: 1, daysUntilNextPeriod: 28, cycleLength: 28,
    });
  });

  it('uses the config start date when there are no periods', () => {
    const info = computeCycleInfo(config({ last_period_start: '2025-01-01' }), [], day(1));
    expect(info.cycleDay).toBe(1);
    expect(info.phase).toBe(CyclePhase.MENSTRUAL);
  });

  it('maps cycle days to phases for a 28-day cycle', () => {
    const phaseOn = (n: number) => computeCycleInfo(config(), [period('2025-01-01')], day(n)).phase;
    expect(phaseOn(1)).toBe(CyclePhase.MENSTRUAL);
    expect(phaseOn(5)).toBe(CyclePhase.MENSTRUAL);
    expect(phaseOn(6)).toBe(CyclePhase.FOLLICULAR);
    expect(phaseOn(14)).toBe(CyclePhase.FOLLICULAR);
    expect(phaseOn(15)).toBe(CyclePhase.OVULATION);
    expect(phaseOn(16)).toBe(CyclePhase.OVULATION);
    expect(phaseOn(17)).toBe(CyclePhase.LUTEAL);
    expect(phaseOn(28)).toBe(CyclePhase.LUTEAL);
  });

  it('keeps counting instead of starting a new cycle when no period is logged', () => {
    const info = computeCycleInfo(config(), [period('2025-01-01')], day(29));
    expect(info.cycleDay).toBe(29);
    expect(info.phase).toBe(CyclePhase.LUTEAL);
    expect(info.overdue).toBe(true);
    expect(info.daysUntilNextPeriod).toBe(0);
    // Still inside the expected range (28 +/- 7 with no history), so not late yet.
    expect(info.daysLate).toBe(0);
  });

  it('reports days late once the expected range has passed', () => {
    // Feb 9 is cycle day 40. The range ends on cycle day 36 (Jan 1 + 35 days).
    const info = computeCycleInfo(config(), [period('2025-01-01')], new Date(2025, 1, 9, 12));
    expect(info.cycleDay).toBe(40);
    expect(info.phase).toBe(CyclePhase.LUTEAL);
    expect(info.daysLate).toBe(4);
  });

  it('is not late on a normal cycle day', () => {
    const info = computeCycleInfo(config(), [period('2025-01-01')], day(10));
    expect(info.overdue).toBe(false);
    expect(info.daysLate).toBe(0);
  });

  it('computes days until next period', () => {
    expect(computeCycleInfo(config(), [period('2025-01-01')], day(1)).daysUntilNextPeriod).toBe(28);
    expect(computeCycleInfo(config(), [period('2025-01-01')], day(28)).daysUntilNextPeriod).toBe(1);
  });

  it('scales ovulation with custom cycle length', () => {
    const c = config({ cycle_length: 32 });
    const phaseOn = (n: number) => computeCycleInfo(c, [period('2025-01-01')], day(n)).phase;
    expect(phaseOn(18)).toBe(CyclePhase.FOLLICULAR);
    expect(phaseOn(19)).toBe(CyclePhase.OVULATION);
    expect(phaseOn(20)).toBe(CyclePhase.OVULATION);
    expect(phaseOn(21)).toBe(CyclePhase.LUTEAL);
  });

  it('learns the cycle length from logged history', () => {
    const periods = [period('2025-03-05'), period('2025-02-05'), period('2025-01-01')]; // 35 and 28 -> ~32
    const info = computeCycleInfo(config(), periods, new Date(2025, 2, 6, 12));
    expect(info.cycleLength).toBe(32);
    expect(info.cycleDay).toBe(2);
    expect(info.ovulationDay).toBe(19);
  });

  it('falls back to 28 when cycle_length is 0', () => {
    expect(computeCycleInfo(config({ cycle_length: 0 }), [], day(1)).cycleLength).toBe(28);
  });
});
