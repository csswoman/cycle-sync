import { describe, it, expect } from 'vitest';
import { weightGoalProgress } from './goals';

describe('weightGoalProgress', () => {
  it('measures progress toward a lower goal', () => {
    const p = weightGoalProgress(100, 95, 80)!;
    expect(p.direction).toBe('lose');
    expect(p.done).toBe(5);
    expect(p.remaining).toBe(15);
    expect(p.percent).toBe(25);
    expect(p.reached).toBe(false);
    expect(p.firstMilestoneKg).toBe(95);
    expect(p.firstMilestoneReached).toBe(true);
  });

  it('starts at 0% on the first entry', () => {
    const p = weightGoalProgress(100, 100, 90)!;
    expect(p.percent).toBe(0);
    expect(p.remaining).toBe(10);
    expect(p.firstMilestoneReached).toBe(false);
  });

  it('clamps when moving away and when past the goal', () => {
    expect(weightGoalProgress(100, 102, 90)!.percent).toBe(0);
    const past = weightGoalProgress(100, 88, 90)!;
    expect(past.percent).toBe(100);
    expect(past.reached).toBe(true);
    expect(past.remaining).toBe(0);
  });

  it('skips the 5% milestone when the goal is closer than that', () => {
    expect(weightGoalProgress(100, 99, 97)!.firstMilestoneKg).toBeNull();
  });

  it('supports gaining goals and rejects empty ones', () => {
    const g = weightGoalProgress(50, 52, 55)!;
    expect(g.direction).toBe('gain');
    expect(g.percent).toBe(40);
    expect(g.firstMilestoneKg).toBeNull();
    expect(weightGoalProgress(80, 80, 80)).toBeNull();
  });
});
