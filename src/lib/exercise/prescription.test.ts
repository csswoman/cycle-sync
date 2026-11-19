import { describe, it, expect } from 'vitest';
import { baselineLoadKg, prescribe, GOAL_PLANS } from './prescription';

const dbCurl = { name: 'dumbbell biceps curl', equipment: 'dumbbell', target: 'biceps' };
const hipThrust = { name: 'barbell hip thrust', equipment: 'barbell', target: 'glutes' };
const pushup = { name: 'push-up', equipment: 'body weight', target: 'pectorals' };

describe('prescription', () => {
  it('uses light beginner baselines snapped to real gym loads', () => {
    expect(baselineLoadKg(dbCurl)).toBe(2);
    expect(baselineLoadKg(hipThrust)).toBe(20);
    expect(baselineLoadKg(pushup)).toBeNull();
  });

  it('follows the goal plan for sets, reps and rest', () => {
    for (const goal of ['start', 'maintain', 'hypertrophy'] as const) {
      const p = prescribe({ exercise: hipThrust, goal, phaseKey: 'follicular' });
      expect(p.sets).toBe(GOAL_PLANS[goal].sets);
      expect(p.reps).toBe(GOAL_PLANS[goal].reps);
      expect(p.restSeconds).toBe(GOAL_PLANS[goal].restSeconds);
      expect(p.source).toBe('baseline');
    }
  });

  it('starting from zero prescribes the baseline; heavier goals scale up', () => {
    const start = prescribe({ exercise: hipThrust, goal: 'start' }).weight!;
    const maintain = prescribe({ exercise: hipThrust, goal: 'maintain' }).weight!;
    const hyper = prescribe({ exercise: hipThrust, goal: 'hypertrophy' }).weight!;
    expect(start).toBe(20);
    expect(maintain).toBeGreaterThan(start);
    expect(hyper).toBeGreaterThanOrEqual(maintain);
  });

  it('personalises the load from a real set via the 1RM model', () => {
    // 40 kg × 8 → 1RM ≈ 49.5; hypertrophy load at 12 RM ≈ 69% ≈ 34.4 → 35 on a barbell
    const p = prescribe({ exercise: hipThrust, goal: 'hypertrophy', testSet: { weight: 40, reps: 8 } });
    expect(p.source).toBe('set');
    expect(p.oneRepMax).toBe(49.5);
    expect(p.weight).toBe(35);
  });

  it('lightens load and volume during menstruation', () => {
    const follicular = prescribe({ exercise: hipThrust, goal: 'hypertrophy', phaseKey: 'follicular', testSet: { weight: 40, reps: 8 } });
    const menstrual = prescribe({ exercise: hipThrust, goal: 'hypertrophy', phaseKey: 'menstrual', testSet: { weight: 40, reps: 8 } });
    expect(menstrual.weight!).toBeLessThan(follicular.weight!);
    expect(menstrual.sets).toBe(follicular.sets - 1);
    expect(menstrual.notes.length).toBeGreaterThan(0);
  });

  it('gives bodyweight exercises reps only, never fewer than 2 sets', () => {
    const p = prescribe({ exercise: pushup, goal: 'start', phaseKey: 'menstrual' });
    expect(p.weight).toBeUndefined();
    expect(p.source).toBe('none');
    expect(p.sets).toBe(2);
  });
});
