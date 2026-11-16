/**
 * Weekly activity targets and the day's suggested effort.
 *
 * Targets come from the 2023 International Evidence-based Guideline for PCOS / PMOS: at least
 * 150 minutes a week of moderate activity (or 75 vigorous) plus muscle strengthening on 2
 * non-consecutive days. The guideline finds no exercise type clearly better than another, and
 * reviews of cycle-phase training (McNulty 2020, Colenso-Semple 2023) find the phase effect on
 * performance trivial and recommend adjusting to the individual. So the phase is only the
 * starting point here: how the user feels today overrides it.
 */

export const WEEKLY_MINUTES_GOAL = 150;
export const STRENGTH_DAYS_GOAL = 2;

export interface ActivityLog {
  date: string; // YYYY-MM-DD
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
}

export interface WeeklyActivity {
  /** Monday of the week being summarized (YYYY-MM-DD). */
  weekStart: string;
  minutes: number;
  /** Distinct days with a strength session. */
  strengthDays: number;
  /** Distinct days with any logged activity. */
  activeDays: number;
  minutesGoalMet: boolean;
  strengthGoalMet: boolean;
  /** True when every strength day so far is back to back with another one (no rest day between). */
  strengthDaysConsecutive: boolean;
}

const STRENGTH_WORDS = /fuerza|pesas|gym|strength|weights|sentadilla|squat|peso muerto|deadlift|press|hip thrust|mancuerna|dumbbell|barra|kettlebell|banda/i;

/** A log counts as strength work when it records sets or load, or its name says so. */
export function isStrengthLog(log: ActivityLog): boolean {
  return log.sets != null || log.weightKg != null || STRENGTH_WORDS.test(log.exercise);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the week that contains the date (local time). */
export function weekStartOf(date: Date): string {
  const mondayOffset = (date.getDay() + 6) % 7;
  return toISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset));
}

export function summarizeWeek(logs: ActivityLog[], now: Date = new Date()): WeeklyActivity {
  const weekStart = weekStartOf(now);
  const today = toISO(now);
  const week = logs.filter((l) => l.date.slice(0, 10) >= weekStart && l.date.slice(0, 10) <= today);

  const minutes = week.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  const strength = Array.from(new Set(week.filter(isStrengthLog).map((l) => l.date.slice(0, 10)))).sort();
  const activeDays = new Set(week.map((l) => l.date.slice(0, 10))).size;

  const dayNumber = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);
  const strengthDaysConsecutive = strength.length >= 2
    && strength.every((d, i) => {
      const prev = i > 0 && dayNumber(d) - dayNumber(strength[i - 1]) === 1;
      const next = i < strength.length - 1 && dayNumber(strength[i + 1]) - dayNumber(d) === 1;
      return prev || next;
    });

  return {
    weekStart,
    minutes,
    strengthDays: strength.length,
    activeDays,
    minutesGoalMet: minutes >= WEEKLY_MINUTES_GOAL,
    strengthGoalMet: strength.length >= STRENGTH_DAYS_GOAL,
    strengthDaysConsecutive,
  };
}

export type Effort = 'gentle' | 'moderate' | 'strong';
export type EffortReason = 'lowEnergy' | 'highEnergy' | 'latePeriod' | 'phase';

export interface EffortSuggestion {
  effort: Effort;
  reason: EffortReason;
}

const PHASE_DEFAULT: Record<string, Effort> = {
  menstrual: 'gentle',
  follicular: 'strong',
  ovulation: 'strong',
  luteal: 'moderate',
};

/**
 * Effort for today. Energy logged in the daily log (1-10) wins over the phase in both directions:
 * a low-energy day is gentle even in the follicular phase, and a high-energy day is a good day
 * for hard work even during the period. With a late period the phase is unknown, so it is not used.
 */
export function suggestEffort(phaseKey: string, energy: number | null, periodLate = false): EffortSuggestion {
  if (energy != null && energy <= 3) return { effort: 'gentle', reason: 'lowEnergy' };
  if (energy != null && energy >= 8) return { effort: 'strong', reason: 'highEnergy' };
  if (periodLate) return { effort: 'moderate', reason: 'latePeriod' };
  return { effort: PHASE_DEFAULT[phaseKey] ?? 'moderate', reason: 'phase' };
}
