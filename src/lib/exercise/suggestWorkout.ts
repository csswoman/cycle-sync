/**
 * "What should I do today?" for the training journal. Ranks what the user already has in the app
 * (today's saved routine, the next day of the program she follows) and fills the gaps of the
 * weekly goal (strength days, minutes) with a routine, a program day or a simple free session.
 * The day's effort (phase + logged energy, see suggestEffort) can only make a suggestion gentler.
 */

import { STRENGTH_DAYS_GOAL, WEEKLY_MINUTES_GOAL, type Effort, type WeeklyActivity } from './weeklyActivity';

export interface SuggestRoutine { id: string; name: string; weekday: number | null; exerciseCount: number }
export interface SuggestProgram {
  id: string;
  name: string;
  category: 'home' | 'gym';
  routines: { id: string; label: string; minutes: number | null }[];
}

export interface SuggestInput {
  effort: Effort;
  /** 0 = Monday ... 6 = Sunday. */
  weekday: number;
  routines: SuggestRoutine[];
  programs: SuggestProgram[];
  /** Program day of the last program session, if any. */
  lastProgramRoutineId: string | null;
  /** Last date (YYYY-MM-DD) each routine was trained. */
  lastDoneByRoutine: Record<string, string>;
  week: WeeklyActivity;
  /** Strength work logged yesterday: leave a rest day before the next one. */
  strengthYesterday: boolean;
  trainedToday: boolean;
}

export type Suggestion =
  | { key: string; kind: 'routine'; routineId: string; title: string; reason: string; icon: string }
  | { key: string; kind: 'program'; programId: string; routineId: string; title: string; reason: string; icon: string; minutes: number | null }
  | { key: string; kind: 'free'; exercise: string; minutes: number; title: string; reason: string; icon: string };

const WEEKDAYS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

const GENTLE_PROGRAMS = ['home-pilates', 'home-calentamiento', 'home-femenino'];
const STRENGTH_PROGRAMS: Record<'home' | 'gym', string[]> = {
  home: ['home-cuerpo-completo', 'home-tonificacion', 'home-gluteos'],
  gym: ['gym-fullbody', 'gym-upperlower', 'gym-gluteos'],
};
const CARDIO_PROGRAMS = ['home-cardio', 'home-hiit'];

function findProgramRoutine(programs: SuggestProgram[], routineId: string) {
  for (const program of programs) {
    const index = program.routines.findIndex((r) => r.id === routineId);
    if (index >= 0) return { program, index };
  }
  return null;
}

function programDay(programs: SuggestProgram[], ids: string[], key: string, reason: string, icon: string): Suggestion | null {
  for (const id of ids) {
    const program = programs.find((p) => p.id === id);
    const day = program?.routines[0];
    if (program && day) {
      return { key, kind: 'program', programId: program.id, routineId: day.id, title: `${program.name} · ${day.label}`, reason, icon, minutes: day.minutes };
    }
  }
  return null;
}

export function suggestWorkouts(input: SuggestInput, max = 3): Suggestion[] {
  const { effort, weekday, routines, programs, week } = input;
  const out: Suggestion[] = [];
  const push = (s: Suggestion | null) => {
    if (!s || out.some((o) => o.key === s.key)) return;
    out.push(s);
  };
  const gentle = effort === 'gentle';
  const strengthLeft = Math.max(0, STRENGTH_DAYS_GOAL - week.strengthDays);
  const minutesLeft = Math.max(0, WEEKLY_MINUTES_GOAL - week.minutes);
  const needsStrength = strengthLeft > 0 && !input.strengthYesterday;

  // 1. The routine she planned for this weekday.
  const today = routines.find((r) => r.weekday === weekday);
  if (today) {
    push({
      key: `routine:${today.id}`,
      kind: 'routine',
      routineId: today.id,
      title: today.name,
      reason: gentle
        ? `Es tu rutina de los ${WEEKDAYS_ES[weekday]}. Hoy toca suave: baja el peso o haz menos series.`
        : `Es tu rutina de los ${WEEKDAYS_ES[weekday]}.`,
      icon: 'event_available',
    });
  }

  // 2. Low energy: something gentle first.
  if (gentle) {
    push({ key: 'free:walk', kind: 'free', exercise: 'Caminata suave', minutes: 30, title: 'Caminata suave · 30 min', reason: 'Tu energía o tu fase piden recuperar. Moverte suave también suma minutos.', icon: 'directions_walk' });
    push(programDay(programs, GENTLE_PROGRAMS, 'gentle-program', 'Movilidad y control, sin impacto.', 'self_improvement'));
  }

  // 3. The next day of the program she follows.
  const last = input.lastProgramRoutineId ? findProgramRoutine(programs, input.lastProgramRoutineId) : null;
  if (last) {
    const next = last.program.routines[(last.index + 1) % last.program.routines.length];
    push({
      key: `program:${next.id}`,
      kind: 'program',
      programId: last.program.id,
      routineId: next.id,
      title: `${last.program.name} · ${next.label}`,
      reason: 'Sigue tu programa: es el siguiente día después del último que hiciste.',
      icon: 'trending_up',
      minutes: next.minutes,
    });
  }

  // 4. Strength days missing this week (never two days in a row).
  if (needsStrength && !gentle) {
    const reason = `Te ${strengthLeft === 1 ? 'falta 1 día' : `faltan ${strengthLeft} días`} de fuerza esta semana.`;
    const candidates = routines
      .filter((r) => r.exerciseCount > 0 && r.id !== today?.id)
      .sort((a, b) => (input.lastDoneByRoutine[a.id] ?? '').localeCompare(input.lastDoneByRoutine[b.id] ?? ''));
    if (candidates[0]) {
      push({ key: `routine:${candidates[0].id}`, kind: 'routine', routineId: candidates[0].id, title: candidates[0].name, reason, icon: 'fitness_center' });
    } else {
      const category = last?.program.category ?? 'home';
      push(programDay(programs, STRENGTH_PROGRAMS[category], 'strength-program', reason, 'fitness_center'));
    }
  }

  // 5. Minutes missing this week.
  if (minutesLeft > 0) {
    const reason = `Te faltan ${minutesLeft} min para la meta de la semana.`;
    if (effort === 'strong') push(programDay(programs, CARDIO_PROGRAMS, 'cardio-program', reason, 'favorite'));
    push({ key: 'free:brisk', kind: 'free', exercise: 'Caminata rápida', minutes: 30, title: 'Caminata rápida · 30 min', reason, icon: 'directions_walk' });
  }

  // 6. Week done: keep moving without adding fatigue.
  if (out.length === 0 || (week.minutesGoalMet && week.strengthGoalMet)) {
    push({ key: 'free:mobility', kind: 'free', exercise: 'Movilidad y estiramientos', minutes: 15, title: 'Movilidad · 15 min', reason: input.trainedToday ? 'Ya entrenaste hoy: estirar ayuda a recuperar.' : 'Meta de la semana cumplida: algo suave suma sin cansarte.', icon: 'self_improvement' });
  }

  return out.slice(0, max);
}
