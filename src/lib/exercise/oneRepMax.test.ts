import { describe, it, expect } from 'vitest';
import { estimate1RM, ESSENTIAL_EXERCISES } from './oneRepMax';

describe('oneRepMax', () => {
  it('returns exact weight for 1 rep', () => {
    const result = estimate1RM(100, 1, 'kg');
    expect(result.oneRepMax).toBe(100);
    expect(result.isHighRepWarning).toBe(false);
  });

  it('estimates 1RM with Brzycki formula for 5 reps', () => {
    // 80 kg for 5 reps: 80 / (1.0278 - 0.0278 * 5) = 80 / 0.8888 = ~90 kg
    const result = estimate1RM(80, 5, 'kg');
    expect(result.oneRepMax).toBeGreaterThan(85);
    expect(result.oneRepMax).toBeLessThan(95);
    expect(result.isHighRepWarning).toBe(false);
    expect(result.targetLoads.strength.percentage).toBe(85);
    expect(result.targetLoads.strength.restMinutes).toBe('2 a 3 min');
    expect(result.targetLoads.hypertrophy.percentage).toBe(75);
    expect(result.targetLoads.endurance.percentage).toBe(65);
  });

  it('flags high rep warning when reps > 7', () => {
    const resultLow = estimate1RM(50, 6, 'kg');
    expect(resultLow.isHighRepWarning).toBe(false);

    const resultHigh = estimate1RM(40, 12, 'kg');
    expect(resultHigh.isHighRepWarning).toBe(true);
  });

  it('computes phase recommendations accurately', () => {
    const result = estimate1RM(100, 1, 'kg');
    expect(result.phaseRecommendations.menstrual.percentage).toBe(70);
    expect(result.phaseRecommendations.menstrual.load).toBe(70);
    expect(result.phaseRecommendations.follicular.percentage).toBe(85);
    expect(result.phaseRecommendations.follicular.load).toBe(85);
    expect(result.phaseRecommendations.luteal.percentage).toBe(75);
    expect(result.phaseRecommendations.luteal.load).toBe(75);
  });

  it('handles lbs unit correctly', () => {
    const result = estimate1RM(120, 5, 'lb');
    expect(result.unit).toBe('lb');
    expect(result.oneRepMax).toBeGreaterThan(130);
  });

  it('includes core essential exercises', () => {
    expect(ESSENTIAL_EXERCISES.length).toBeGreaterThanOrEqual(6);
    const ids = ESSENTIAL_EXERCISES.map((e) => e.id);
    expect(ids).toContain('hip-thrust');
    expect(ids).toContain('squat');
    expect(ids).toContain('deadlift');
    expect(ids).toContain('bench-press');
  });
});
