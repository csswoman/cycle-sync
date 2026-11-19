import { describe, expect, it } from 'vitest';
import { suggestWorkouts, type SuggestInput } from './suggestWorkout';
import type { WeeklyActivity } from './weeklyActivity';

const week = (p: Partial<WeeklyActivity> = {}): WeeklyActivity => ({
  weekStart: '2026-11-16', minutes: 0, strengthDays: 0, activeDays: 0, minutesGoalMet: false,
  strengthGoalMet: false, strengthDaysConsecutive: false, ...p,
});

const programs: SuggestInput['programs'] = [
  { id: 'home-abdomen', name: 'Abdomen', category: 'home', routines: [{ id: 'a1', label: 'Rutina 1', minutes: 20 }, { id: 'a2', label: 'Rutina 2', minutes: 20 }] },
  { id: 'home-cuerpo-completo', name: 'Cuerpo completo', category: 'home', routines: [{ id: 'cc1', label: 'Día 1', minutes: 35 }] },
  { id: 'home-pilates', name: 'Pilates', category: 'home', routines: [{ id: 'p1', label: 'Sesión 1', minutes: 25 }] },
  { id: 'home-cardio', name: 'Cardio', category: 'home', routines: [{ id: 'c1', label: 'Día 1', minutes: 25 }] },
];

const base: SuggestInput = {
  effort: 'moderate', weekday: 2, routines: [], programs, lastProgramRoutineId: null,
  lastDoneByRoutine: {}, week: week(), strengthYesterday: false, trainedToday: false,
};

describe('suggestWorkouts', () => {
  it("puts today's saved routine first", () => {
    const out = suggestWorkouts({ ...base, routines: [{ id: 'r1', name: 'Pierna', weekday: 2, exerciseCount: 5 }] });
    expect(out[0]).toMatchObject({ kind: 'routine', routineId: 'r1' });
    expect(out[0].reason).toContain('miércoles');
  });

  it('continues the program with the next day, wrapping around', () => {
    expect(suggestWorkouts({ ...base, lastProgramRoutineId: 'a1' })[0]).toMatchObject({ kind: 'program', routineId: 'a2' });
    expect(suggestWorkouts({ ...base, lastProgramRoutineId: 'a2' })[0]).toMatchObject({ kind: 'program', routineId: 'a1' });
  });

  it('fills missing strength with the routine trained longest ago', () => {
    const out = suggestWorkouts({
      ...base,
      routines: [{ id: 'r1', name: 'A', weekday: null, exerciseCount: 4 }, { id: 'r2', name: 'B', weekday: null, exerciseCount: 4 }],
      lastDoneByRoutine: { r1: '2026-11-15', r2: '2026-11-01' },
    });
    expect(out[0]).toMatchObject({ kind: 'routine', routineId: 'r2' });
  });

  it('uses a program day when there are no routines, and skips strength right after a strength day', () => {
    expect(suggestWorkouts(base)[0]).toMatchObject({ kind: 'program', programId: 'home-cuerpo-completo' });
    expect(suggestWorkouts({ ...base, strengthYesterday: true }).some((s) => s.key === 'strength-program')).toBe(false);
  });

  it('goes gentle on low-energy days', () => {
    const out = suggestWorkouts({ ...base, effort: 'gentle' });
    expect(out[0]).toMatchObject({ kind: 'free', exercise: 'Caminata suave' });
    expect(out.some((s) => s.key === 'strength-program')).toBe(false);
  });

  it('suggests mobility when the week is done', () => {
    const out = suggestWorkouts({ ...base, week: week({ minutes: 160, strengthDays: 2, minutesGoalMet: true, strengthGoalMet: true }) });
    expect(out.map((s) => s.key)).toEqual(['free:mobility']);
  });

  it('never returns more than the max', () => {
    expect(suggestWorkouts({ ...base, effort: 'strong', lastProgramRoutineId: 'a1' }, 2)).toHaveLength(2);
  });
});
