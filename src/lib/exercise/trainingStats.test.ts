import { describe, expect, it } from 'vitest';
import {
  computeStreak, dayTotals, groupHistory, lastProgramRoutine, lastSetsFor, logSource, monthGrid,
  personalRecords, setsOf, type JournalLog,
} from './trainingStats';

let n = 0;
const log = (p: Partial<JournalLog>): JournalLog => ({
  id: `id${++n}`, date: '2026-11-18', exercise: 'Sentadilla', sets: null, weightKg: null,
  durationMinutes: null, feeling: 3, notes: null, createdAt: `2026-11-18T10:00:${String(n).padStart(2, '0')}Z`, ...p,
});

describe('logSource', () => {
  it('prefers the column and falls back to the note', () => {
    expect(logSource({ source: 'routine', notes: 'Video guiado' })).toBe('routine');
    expect(logSource({ notes: 'Sesión completada: 3 ejercicios guardados' })).toBe('session');
    expect(logSource({ notes: 'Video guiado' })).toBe('video');
    expect(logSource({ notes: '10 × 20 kg — Programa, Día 1' })).toBe('program');
    expect(logSource({ notes: null })).toBe('free');
  });
});

describe('sets', () => {
  it('parses the legacy note format', () => {
    expect(setsOf({ notes: '10 × 20 kg · 8 × 22,5 kg · – — Prog, Día' })).toEqual([
      { reps: 10, weight: 20 }, { reps: 8, weight: 22.5 }, { reps: null, weight: null },
    ]);
  });
  it('lastSetsFor finds the newest log with sets, case-insensitive', () => {
    const logs = [
      log({ exercise: 'sentadilla', setDetails: [{ reps: 12, weight: 30 }] }),
      log({ exercise: 'Sentadilla', setDetails: [{ reps: 10, weight: 25 }] }),
    ];
    expect(lastSetsFor(logs, 'Sentadilla')).toEqual([{ reps: 12, weight: 30 }]);
    expect(lastSetsFor(logs, 'Remo')).toBeNull();
  });
});

describe('computeStreak', () => {
  it('keeps the streak alive until today is over', () => {
    expect(computeStreak(['2026-11-15', '2026-11-16', '2026-11-17'], '2026-11-18')).toEqual({ current: 3, longest: 3, totalDays: 3 });
  });
  it('breaks after a missed day and tracks the longest run', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10'], '2026-11-18')).toEqual({ current: 0, longest: 3, totalDays: 4 });
  });
  it('crosses month boundaries', () => {
    expect(computeStreak(['2026-10-31', '2026-11-01'], '2026-11-01').current).toBe(2);
  });
});

describe('monthGrid', () => {
  it('starts on Monday and covers the month', () => {
    const grid = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(grid[0][0]).toEqual({ date: '2026-10-26', inMonth: false });
    expect(grid[0][6]).toEqual({ date: '2026-11-01', inMonth: true });
    expect(grid.flat().filter((c) => c.inMonth)).toHaveLength(30);
  });
});

describe('groupHistory', () => {
  it('groups rows of one session and keeps singles apart', () => {
    const s = 'sess-1';
    const logs = [
      log({ exercise: 'Pierna', source: 'session', sessionId: s, durationMinutes: 40 }),
      log({ exercise: 'Sentadilla', source: 'routine', sessionId: s, sets: 3, weightKg: 30 }),
      log({ exercise: 'Zancada', source: 'routine', sessionId: s, sets: 3 }),
      log({ exercise: 'Caminata', source: 'free', durationMinutes: 20 }),
      log({ date: '2026-11-17', exercise: 'Yoga', source: 'video', durationMinutes: 25 }),
    ];
    const days = groupHistory(logs);
    expect(days.map((d) => d.date)).toEqual(['2026-11-18', '2026-11-17']);
    expect(days[0].minutes).toBe(60);
    const session = days[0].items.find((i) => i.session)!;
    expect(session.title).toBe('Pierna');
    expect(session.source).toBe('routine');
    expect(session.exercises.map((e) => e.exercise)).toEqual(['Sentadilla', 'Zancada']);
    expect(session.ids).toHaveLength(3);
    expect(session.strength).toBe(true);
    const totals = dayTotals(logs);
    expect(totals.get('2026-11-18')).toMatchObject({ minutes: 60, strength: true, activities: 2 });
    expect(totals.get('2026-11-17')).toMatchObject({ minutes: 25, strength: false });
  });
  it('attaches legacy program rows to the only session of the day', () => {
    const logs = [
      log({ exercise: 'Abdomen: Rutina 1', notes: 'Sesión completada: 2 ejercicios guardados', durationMinutes: 20 }),
      log({ exercise: 'Crunch', notes: '15 · 15 — Abdomen, Rutina 1', sets: 2 }),
      log({ exercise: 'Plancha', notes: '– — Abdomen, Rutina 1', sets: 1 }),
    ];
    const [day] = groupHistory(logs);
    expect(day.items).toHaveLength(1);
    expect(day.items[0].exercises).toHaveLength(2);
  });
});

describe('personalRecords', () => {
  it('marks a heavier weight than any earlier one', () => {
    const a = log({ date: '2026-11-01', exercise: 'Hip thrust', weightKg: 40 });
    const b = log({ date: '2026-11-08', exercise: 'Hip thrust', weightKg: 40 });
    const c = log({ date: '2026-11-15', exercise: 'hip thrust', weightKg: 45 });
    expect(personalRecords([c, b, a])).toEqual(new Set([c.id]));
  });
});

describe('lastProgramRoutine', () => {
  it('returns the newest program day', () => {
    const logs = [log({ source: 'free' }), log({ source: 'program', refId: 'home-abs-r2' }), log({ source: 'program', refId: 'home-abs-r1' })];
    expect(lastProgramRoutine(logs)?.refId).toBe('home-abs-r2');
  });
});
