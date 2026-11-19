/**
 * Per-exercise set/rep/load suggestions for the routine builder, built on the
 * same Brzycki model as the 1RM calculator (see ./oneRepMax).
 *
 * Without data from her, the load is a conservative beginner baseline by
 * equipment and target muscle. When she enters a real set (weight × reps),
 * we estimate her 1RM and derive the load for the goal's rep target.
 * Loads always keep 2-3 reps in reserve: we pick the load she could lift for
 * `loadAtReps`, which is a few reps above the top of the prescribed range.
 */
import { estimate1RM, loadForReps } from './oneRepMax';

export type TrainingGoal = 'start' | 'maintain' | 'hypertrophy';

export interface GoalPlan {
  id: TrainingGoal;
  labelEs: string;
  shortEs: string;
  icon: string;
  sets: number;
  reps: string;
  restSeconds: number;
  /** Rep count whose near-failure load we prescribe (leaves reps in reserve). */
  loadAtReps: number;
  progressionEs: string;
}

export const GOAL_PLANS: Record<TrainingGoal, GoalPlan> = {
  start: {
    id: 'start',
    labelEs: 'Empezar desde 0',
    shortEs: 'Aprende la técnica con peso ligero y sube poco a poco.',
    icon: 'trending_up',
    sets: 2,
    reps: '12-15',
    restSeconds: 60,
    loadAtReps: 17,
    progressionEs:
      'Cuando completes todas las series con 15 reps y buena técnica, sube un escalón de peso y vuelve a 12 reps.',
  },
  maintain: {
    id: 'maintain',
    labelEs: 'Mantener',
    shortEs: 'Conserva tu fuerza y tu músculo con un esfuerzo moderado.',
    icon: 'balance',
    sets: 3,
    reps: '10-12',
    restSeconds: 90,
    loadAtReps: 14,
    progressionEs: 'Mantén el peso; si 12 reps se sienten muy fáciles durante 2 sesiones, sube un escalón.',
  },
  hypertrophy: {
    id: 'hypertrophy',
    labelEs: 'Hipertrofia',
    shortEs: 'Más series y peso medio para ganar músculo y forma.',
    icon: 'fitness_center',
    sets: 4,
    reps: '8-12',
    restSeconds: 120,
    loadAtReps: 12,
    progressionEs:
      'Cuando llegues a 12 reps en todas las series, sube un escalón de peso y vuelve a 8 reps (doble progresión).',
  },
};

/** Phase adjustment on top of the goal: lighter around menstruation and late luteal. */
export const PHASE_ADJUSTMENT: Record<string, { loadFactor: number; setDelta: number; noteEs: string | null }> = {
  menstrual: { loadFactor: 0.9, setDelta: -1, noteEs: 'Fase menstrual: −10% de peso y una serie menos.' },
  luteal: { loadFactor: 0.95, setDelta: 0, noteEs: 'Fase lútea: −5% de peso, prioriza la técnica.' },
  follicular: { loadFactor: 1, setDelta: 0, noteEs: null },
  ovulation: { loadFactor: 1, setDelta: 0, noteEs: null },
};

type MuscleClass = 'lower' | 'back' | 'chest' | 'small' | 'core';

const MUSCLE_CLASS: Record<string, MuscleClass> = {
  glutes: 'lower',
  quads: 'lower',
  hamstrings: 'lower',
  adductors: 'lower',
  abductors: 'lower',
  calves: 'lower',
  lats: 'back',
  'upper back': 'back',
  spine: 'back',
  traps: 'back',
  pectorals: 'chest',
  'serratus anterior': 'chest',
  delts: 'small',
  biceps: 'small',
  triceps: 'small',
  forearms: 'small',
  'levator scapulae': 'small',
  abs: 'core',
};

interface EquipmentProfile {
  /** Beginner baseline (kg) for 12-15 controlled reps, by muscle class. */
  base: Record<MuscleClass, number>;
  /** Loads that exist in a gym for this equipment; suggestions snap to these. */
  steps: number[];
  /** Short explanation of what the number means. */
  unitEs: string;
}

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

const DUMBBELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22.5, 25, 27.5, 30];
const KETTLEBELLS = [4, 6, 8, 10, 12, 14, 16, 20, 24];
const BARBELL = range(5, 150, 2.5);
const CABLE = range(2.5, 80, 2.5);
const MACHINE = range(5, 200, 5);

const BARBELL_PROFILE: EquipmentProfile = {
  base: { lower: 20, back: 15, chest: 15, small: 10, core: 5 },
  steps: BARBELL,
  unitEs: 'peso total (barra + discos)',
};

const EQUIPMENT_PROFILES: Record<string, EquipmentProfile> = {
  dumbbell: {
    base: { lower: 5, back: 5, chest: 4, small: 2, core: 3 },
    steps: DUMBBELLS,
    unitEs: 'por mancuerna',
  },
  kettlebell: {
    base: { lower: 8, back: 6, chest: 6, small: 4, core: 6 },
    steps: KETTLEBELLS,
    unitEs: 'pesa rusa',
  },
  barbell: BARBELL_PROFILE,
  'olympic barbell': BARBELL_PROFILE,
  'trap bar': BARBELL_PROFILE,
  'ez barbell': { ...BARBELL_PROFILE, base: { lower: 15, back: 12.5, chest: 12.5, small: 7.5, core: 5 } },
  'smith machine': { ...BARBELL_PROFILE, base: { lower: 15, back: 12.5, chest: 10, small: 7.5, core: 5 } },
  cable: {
    base: { lower: 7.5, back: 15, chest: 7.5, small: 5, core: 7.5 },
    steps: CABLE,
    unitEs: 'en la pila de la polea',
  },
  'leverage machine': {
    base: { lower: 25, back: 20, chest: 15, small: 10, core: 10 },
    steps: MACHINE,
    unitEs: 'en la máquina',
  },
  'sled machine': {
    base: { lower: 30, back: 30, chest: 30, small: 30, core: 30 },
    steps: MACHINE,
    unitEs: 'sin contar el carro',
  },
  'medicine ball': {
    base: { lower: 3, back: 3, chest: 3, small: 2, core: 3 },
    steps: [1, 2, 3, 4, 5, 6, 8, 10],
    unitEs: 'balón medicinal',
  },
  weighted: {
    base: { lower: 5, back: 5, chest: 5, small: 2.5, core: 2.5 },
    steps: range(1, 40, 1),
    unitEs: 'lastre o disco',
  },
};

/** Name-based overrides for exercises that load far more than their muscle class suggests. */
const NAME_OVERRIDES: [RegExp, Partial<Record<string, number>>][] = [
  [/hip thrust|glute bridge/, { barbell: 20, 'smith machine': 20, dumbbell: 8, 'leverage machine': 30 }],
  [/deadlift/, { barbell: 20, dumbbell: 6, 'trap bar': 25 }],
  [/leg press/, { 'leverage machine': 30, 'sled machine': 30 }],
  [/calf raise/, { 'leverage machine': 20, 'smith machine': 20 }],
  [/lateral raise|front raise|rear delt|fly/, { dumbbell: 2, cable: 2.5 }],
];

export interface ExerciseLike {
  name: string;
  equipment: string;
  target: string;
}

/** Equipment we can't suggest a weight for (bodyweight, bands, balls, cardio). */
export const isLoadable = (ex: ExerciseLike) => ex.equipment in EQUIPMENT_PROFILES;

const snap = (value: number, steps: number[]) =>
  steps.reduce((best, s) => (Math.abs(s - value) < Math.abs(best - value) ? s : best), steps[0]);

/** Conservative beginner load (kg) for 12-15 reps, or null if the exercise has no external load. */
export function baselineLoadKg(ex: ExerciseLike): number | null {
  const profile = EQUIPMENT_PROFILES[ex.equipment];
  if (!profile) return null;
  const name = ex.name.toLowerCase();
  const override = NAME_OVERRIDES.find(([re]) => re.test(name))?.[1][ex.equipment];
  const base = override ?? profile.base[MUSCLE_CLASS[ex.target] ?? 'small'];
  return snap(base, profile.steps);
}

export const loadUnitNote = (ex: ExerciseLike): string | null => EQUIPMENT_PROFILES[ex.equipment]?.unitEs ?? null;

export interface Prescription {
  sets: number;
  reps: string;
  restSeconds: number;
  /** kg, or undefined for bodyweight/band exercises. */
  weight?: number;
  /** 'set' when derived from her own logged set, 'baseline' when estimated. */
  source: 'set' | 'baseline' | 'none';
  /** Her estimated 1RM in kg, when we have one. */
  oneRepMax?: number;
  notes: string[];
}

export interface PrescribeInput {
  exercise: ExerciseLike;
  goal: TrainingGoal;
  phaseKey?: string;
  /** A set she actually did with this exercise, to personalise the load. */
  testSet?: { weight: number; reps: number } | null;
}

export function prescribe({ exercise, goal, phaseKey, testSet }: PrescribeInput): Prescription {
  const plan = GOAL_PLANS[goal];
  const phase = PHASE_ADJUSTMENT[phaseKey ?? ''] ?? PHASE_ADJUSTMENT.follicular;
  const steps = EQUIPMENT_PROFILES[exercise.equipment]?.steps;
  const notes: string[] = [];
  const sets = Math.max(2, plan.sets + phase.setDelta);
  if (phase.noteEs) notes.push(phase.noteEs);

  const base = { sets, reps: plan.reps, restSeconds: plan.restSeconds, notes };

  if (!steps) {
    notes.unshift(
      goal === 'start'
        ? 'Sin peso: domina el movimiento y luego añade reps o una banda.'
        : 'Sin peso externo: para progresar, haz las reps más lentas (3 s bajando) o añade una banda.',
    );
    return { ...base, source: 'none' };
  }

  let oneRepMax: number;
  let source: Prescription['source'];
  if (testSet && testSet.weight > 0 && testSet.reps > 0) {
    oneRepMax = estimate1RM(testSet.weight, testSet.reps).oneRepMax;
    source = 'set';
  } else {
    // The baseline is a load for ~17 near-failure reps (2 × 12-15 with reserve);
    // back out the 1RM it implies so every goal scales from the same reference.
    const baseline = baselineLoadKg(exercise)!;
    oneRepMax = baseline / (1.0278 - 0.0278 * GOAL_PLANS.start.loadAtReps);
    source = 'baseline';
  }

  const raw = loadForReps(oneRepMax, plan.loadAtReps).load * phase.loadFactor;
  const weight = snap(raw, steps);
  return { ...base, weight, source, oneRepMax: Math.round(oneRepMax * 2) / 2 };
}
