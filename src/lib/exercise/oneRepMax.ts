/**
 * One Repetition Maximum (1RM) estimation and load targets for female strength training.
 *
 * Grounded in exercise physiology:
 * - Indirect calculation using validated Brzycki formula (optimal for <= 7-10 reps)
 *   to avoid risky true 1RM testing.
 * - Scientific rest intervals: 2-3 minutes between heavy effective sets for full
 *   ATP-PC and glycolytic replenishment (Helms, Aragon).
 * - Phase-specific loading recommendations (Menstrual ~70%, Follicular 70-85%, Luteal ~70-75%).
 */

export type ExerciseGoal = 'strength' | 'hypertrophy' | 'endurance';

export interface TargetLoad {
  goal: ExerciseGoal;
  percentage: number;
  load: number;
  repRange: string;
  restMinutes: string;
}

export interface PhaseLoadRecommendation {
  percentage: number;
  load: number;
  reps: string;
  guidance: string;
}

export interface OneRepMaxResult {
  oneRepMax: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lb';
  isHighRepWarning: boolean;
  targetLoads: {
    strength: TargetLoad;
    hypertrophy: TargetLoad;
    endurance: TargetLoad;
  };
  phaseRecommendations: {
    menstrual: PhaseLoadRecommendation;
    follicular: PhaseLoadRecommendation;
    luteal: PhaseLoadRecommendation;
  };
}

export interface EssentialExercise {
  id: string;
  nameEs: string;
  nameEn: string;
  category: 'lower' | 'upper' | 'posterior';
  musclesEs: string;
  tipEs: string;
  /** How the load is measured, so the number she types matches what she sees in the gym. */
  loadType: LoadType;
  /** Beginner-friendly starting load in kg, used as the calculator's default. */
  startingWeightKg: number;
  /** Common gym loads in kg (dumbbell pairs, plate steps, machine stack) from beginner to advanced. */
  suggestedWeightsKg: number[];
}

export type LoadType = 'barbell' | 'dumbbell' | 'machine' | 'assisted';

export const LOAD_TYPE_NOTE_ES: Record<LoadType, string> = {
  barbell: 'Peso total: barra + discos (barra olímpica 20 kg, barra ligera 10-15 kg).',
  dumbbell: 'Peso de una sola mancuerna.',
  machine: 'Peso marcado en la máquina o la pila de placas.',
  assisted: 'Tu peso corporal menos la asistencia de la máquina.',
};

type ExerciseBase = Omit<EssentialExercise, 'loadType' | 'startingWeightKg' | 'suggestedWeightsKg'>;

const LOAD_GUIDE: Record<string, Pick<EssentialExercise, 'loadType' | 'startingWeightKg' | 'suggestedWeightsKg'>> = {
  'hip-thrust': { loadType: 'barbell', startingWeightKg: 20, suggestedWeightsKg: [10, 20, 30, 40, 50, 60, 80] },
  squat: { loadType: 'barbell', startingWeightKg: 15, suggestedWeightsKg: [10, 15, 20, 25, 30, 40, 50] },
  deadlift: { loadType: 'barbell', startingWeightKg: 20, suggestedWeightsKg: [15, 20, 30, 40, 50, 60, 70] },
  'bench-press': { loadType: 'barbell', startingWeightKg: 15, suggestedWeightsKg: [10, 15, 20, 25, 30, 35] },
  row: { loadType: 'dumbbell', startingWeightKg: 6, suggestedWeightsKg: [4, 6, 8, 10, 12, 15] },
  'overhead-press': { loadType: 'barbell', startingWeightKg: 10, suggestedWeightsKg: [7.5, 10, 12.5, 15, 20, 25] },
  'front-squat': { loadType: 'barbell', startingWeightKg: 15, suggestedWeightsKg: [10, 15, 20, 25, 30, 40] },
  'leg-press': { loadType: 'machine', startingWeightKg: 30, suggestedWeightsKg: [20, 30, 40, 50, 60, 80, 100] },
  bulgarian: { loadType: 'dumbbell', startingWeightKg: 4, suggestedWeightsKg: [2, 4, 6, 8, 10, 12] },
  lunge: { loadType: 'dumbbell', startingWeightKg: 4, suggestedWeightsKg: [2, 4, 6, 8, 10, 12] },
  rdl: { loadType: 'barbell', startingWeightKg: 15, suggestedWeightsKg: [10, 15, 20, 25, 30, 40, 50] },
  'sumo-deadlift': { loadType: 'barbell', startingWeightKg: 20, suggestedWeightsKg: [15, 20, 30, 40, 50, 60] },
  'glute-bridge': { loadType: 'barbell', startingWeightKg: 10, suggestedWeightsKg: [5, 10, 15, 20, 30, 40] },
  'leg-curl': { loadType: 'machine', startingWeightKg: 10, suggestedWeightsKg: [5, 10, 15, 20, 25, 30] },
  'incline-press': { loadType: 'dumbbell', startingWeightKg: 4, suggestedWeightsKg: [2, 4, 6, 8, 10, 12] },
  'lat-pulldown': { loadType: 'machine', startingWeightKg: 20, suggestedWeightsKg: [10, 15, 20, 25, 30, 35, 40] },
  pullup: { loadType: 'assisted', startingWeightKg: 25, suggestedWeightsKg: [15, 20, 25, 30, 40, 50] },
  'dumbbell-shoulder': { loadType: 'dumbbell', startingWeightKg: 4, suggestedWeightsKg: [2, 3, 4, 5, 6, 8, 10] },
  'biceps-curl': { loadType: 'dumbbell', startingWeightKg: 4, suggestedWeightsKg: [2, 3, 4, 5, 6, 8, 10] },
  triceps: { loadType: 'machine', startingWeightKg: 10, suggestedWeightsKg: [5, 7.5, 10, 12.5, 15, 20] },
};

const KG_TO_LB = 2.20462;

/**
 * Converts a kg load to the unit shown, rounded to a weight you can actually load:
 * kg to 0.5, lb to 1 under 20 lb (light dumbbells) and to 5 above.
 */
export function toGymLoad(kg: number, unit: 'kg' | 'lb'): number {
  if (unit === 'kg') return Math.round(kg * 2) / 2;
  const lb = kg * KG_TO_LB;
  const step = lb < 20 ? 1 : 5;
  return Math.max(1, Math.round(lb / step) * step);
}

/** Converts a value already shown in one unit to the other, rounded like {@link toGymLoad}. */
export function convertLoad(value: number, from: 'kg' | 'lb', to: 'kg' | 'lb'): number {
  if (from === to) return value;
  return to === 'lb' ? toGymLoad(value, 'lb') : Math.round((value / KG_TO_LB) * 2) / 2;
}

const BASE_EXERCISES: ExerciseBase[] = [
  {
    id: 'hip-thrust',
    nameEs: 'Hip Thrust con barra',
    nameEn: 'Barbell Hip Thrust',
    category: 'posterior',
    musclesEs: 'Glúteo mayor e isquiotibiales',
    tipEs: 'Ejercicio clave para fuerza de cadera y desarrollo de glúteos sin sobrecarga axial.',
  },
  {
    id: 'squat',
    nameEs: 'Sentadilla libre',
    nameEn: 'Barbell Back Squat',
    category: 'lower',
    musclesEs: 'Cuádriceps, glúteos y core',
    tipEs: 'Respeta la profundidad con rango de movimiento completo y estabilización libre.',
  },
  {
    id: 'deadlift',
    nameEs: 'Peso muerto',
    nameEn: 'Deadlift',
    category: 'posterior',
    musclesEs: 'Cadena posterior, erectores espinales y glúteos',
    tipEs: 'Mantén la barra pegada a las tibias y activa dorsales antes de despegar la carga.',
  },
  {
    id: 'bench-press',
    nameEs: 'Press de banca o mancuernas',
    nameEn: 'Bench Press',
    category: 'upper',
    musclesEs: 'Pectoral, deltoides anterior y tríceps',
    tipEs: 'Mantén los omóplatos retraídos y los pies firmes contra el suelo.',
  },
  {
    id: 'row',
    nameEs: 'Remo con barra o mancuernas',
    nameEn: 'Barbell or DB Row',
    category: 'upper',
    musclesEs: 'Dorsal ancho, romboides y bíceps',
    tipEs: 'Tira con los codos hacia la cadera manteniendo la columna neutra.',
  },
  {
    id: 'overhead-press',
    nameEs: 'Press militar',
    nameEn: 'Overhead Press',
    category: 'upper',
    musclesEs: 'Hombros (deltoides), tríceps y core',
    tipEs: 'Aprieta glúteos y abdomen para mantener la vertical sin arquear la zona lumbar.',
  },
  {
    id: 'front-squat',
    nameEs: 'Sentadilla frontal',
    nameEn: 'Front Squat',
    category: 'lower',
    musclesEs: 'Cuádriceps y core',
    tipEs: 'Codos altos y torso erguido; la barra descansa sobre los deltoides.',
  },
  {
    id: 'leg-press',
    nameEs: 'Prensa de piernas',
    nameEn: 'Leg Press',
    category: 'lower',
    musclesEs: 'Cuádriceps y glúteos',
    tipEs: 'No bloquees las rodillas arriba y mantén la zona lumbar apoyada.',
  },
  {
    id: 'bulgarian',
    nameEs: 'Sentadilla búlgara',
    nameEn: 'Bulgarian Split Squat',
    category: 'lower',
    musclesEs: 'Glúteos y cuádriceps',
    tipEs: 'Calcula el peso por cada pierna; el torso ligeramente inclinado carga más el glúteo.',
  },
  {
    id: 'lunge',
    nameEs: 'Zancadas con mancuernas',
    nameEn: 'Dumbbell Lunge',
    category: 'lower',
    musclesEs: 'Cuádriceps, glúteos e isquiotibiales',
    tipEs: 'Da pasos largos y empuja con el talón de la pierna delantera.',
  },
  {
    id: 'rdl',
    nameEs: 'Peso muerto rumano',
    nameEn: 'Romanian Deadlift',
    category: 'posterior',
    musclesEs: 'Isquiotibiales y glúteos',
    tipEs: 'Lleva la cadera hacia atrás con las rodillas casi rectas; baja hasta sentir el estiramiento.',
  },
  {
    id: 'sumo-deadlift',
    nameEs: 'Peso muerto sumo',
    nameEn: 'Sumo Deadlift',
    category: 'posterior',
    musclesEs: 'Aductores, glúteos y espalda baja',
    tipEs: 'Pies anchos, rodillas hacia fuera y pecho arriba antes de tirar.',
  },
  {
    id: 'glute-bridge',
    nameEs: 'Puente de glúteo',
    nameEn: 'Glute Bridge',
    category: 'posterior',
    musclesEs: 'Glúteo mayor',
    tipEs: 'Sube hasta alinear rodillas, cadera y hombros, y aprieta arriba un segundo.',
  },
  {
    id: 'leg-curl',
    nameEs: 'Curl femoral',
    nameEn: 'Leg Curl',
    category: 'posterior',
    musclesEs: 'Isquiotibiales',
    tipEs: 'Controla la bajada en 2 a 3 segundos sin despegar la cadera.',
  },
  {
    id: 'incline-press',
    nameEs: 'Press inclinado con mancuernas',
    nameEn: 'Incline Dumbbell Press',
    category: 'upper',
    musclesEs: 'Pectoral superior y hombros',
    tipEs: 'Banco a 30° o 45°; no subas los hombros hacia las orejas.',
  },
  {
    id: 'lat-pulldown',
    nameEs: 'Jalón al pecho',
    nameEn: 'Lat Pulldown',
    category: 'upper',
    musclesEs: 'Dorsal ancho y bíceps',
    tipEs: 'Lleva la barra a la clavícula con el pecho arriba y sin balancear el torso.',
  },
  {
    id: 'pullup',
    nameEs: 'Dominadas asistidas',
    nameEn: 'Assisted Pull-up',
    category: 'upper',
    musclesEs: 'Dorsal ancho, bíceps y core',
    tipEs: 'Si usas máquina, el peso asistido resta: anota tu peso corporal menos la asistencia.',
  },
  {
    id: 'dumbbell-shoulder',
    nameEs: 'Press de hombros con mancuernas',
    nameEn: 'Dumbbell Shoulder Press',
    category: 'upper',
    musclesEs: 'Deltoides y tríceps',
    tipEs: 'Mancuernas a la altura de las orejas; sube sin arquear la espalda.',
  },
  {
    id: 'biceps-curl',
    nameEs: 'Curl de bíceps',
    nameEn: 'Biceps Curl',
    category: 'upper',
    musclesEs: 'Bíceps y antebrazos',
    tipEs: 'Codos pegados al torso; evita impulsarte con la espalda.',
  },
  {
    id: 'triceps',
    nameEs: 'Extensión de tríceps en polea',
    nameEn: 'Triceps Pushdown',
    category: 'upper',
    musclesEs: 'Tríceps',
    tipEs: 'Codos fijos a los lados y extiende hasta bloquear sin mover los hombros.',
  },
];

export const ESSENTIAL_EXERCISES: EssentialExercise[] = BASE_EXERCISES.map((ex) => ({
  ...ex,
  ...(LOAD_GUIDE[ex.id] ?? { loadType: 'barbell', startingWeightKg: 10, suggestedWeightsKg: [5, 10, 15, 20, 30] }),
}));

/**
 * Inverse Brzycki: the load (and % of 1RM) she could lift for `reps` repetitions
 * to near failure. Rounded to 0.5 so it maps to real plates/dumbbells.
 */
export function loadForReps(oneRepMax: number, reps: number): { load: number; percentage: number } {
  const r = Math.max(1, Math.min(30, Math.round(reps)));
  const fraction = r === 1 ? 1 : 1.0278 - 0.0278 * r;
  return {
    load: Math.round(oneRepMax * fraction * 2) / 2,
    percentage: Math.round(fraction * 100),
  };
}

/**
 * Calculates indirect 1RM using the Brzycki formula:
 * 1RM = weight / (1.0278 - (0.0278 * reps))
 * When reps = 1, returns the exact weight.
 */
export function estimate1RM(weight: number, reps: number, unit: 'kg' | 'lb' = 'kg'): OneRepMaxResult {
  const safeWeight = Math.max(0, weight);
  const safeReps = Math.max(1, Math.min(30, Math.round(reps)));

  let raw1RM = safeWeight;
  if (safeReps === 1) {
    raw1RM = safeWeight;
  } else if (safeReps < 37) {
    // Brzycki formula
    raw1RM = safeWeight / (1.0278 - 0.0278 * safeReps);
  }

  // Round to nearest 0.5 kg/lb for realistic gym plates
  const oneRepMax = Math.round(raw1RM * 2) / 2;

  const roundLoad = (pct: number) => Math.round(oneRepMax * pct * 2) / 2;

  return {
    oneRepMax,
    weight: safeWeight,
    reps: safeReps,
    unit,
    // When reps > 7, estimation error increases; recommended to test with <= 7 reps
    isHighRepWarning: safeReps > 7,
    targetLoads: {
      strength: {
        goal: 'strength',
        percentage: 85,
        load: roundLoad(0.85),
        repRange: '3 a 6 reps',
        restMinutes: '2 a 3 min',
      },
      hypertrophy: {
        goal: 'hypertrophy',
        percentage: 75,
        load: roundLoad(0.75),
        repRange: '8 a 12 reps',
        restMinutes: '2 min',
      },
      endurance: {
        goal: 'endurance',
        percentage: 65,
        load: roundLoad(0.65),
        repRange: '12 a 15+ reps',
        restMinutes: '1.5 min',
      },
    },
    phaseRecommendations: {
      menstrual: {
        percentage: 70,
        load: roundLoad(0.7),
        reps: '12 a 15 reps',
        guidance: 'Carga moderada y confortable; reduce volumen si hay cólicos o inflamación.',
      },
      follicular: {
        percentage: 85,
        load: roundLoad(0.85),
        reps: '4 a 6 reps',
        guidance: 'Ventana óptima por pico de estrógenos; busca sobrecarga progresiva y descansos de 2-3 min.',
      },
      luteal: {
        percentage: 75,
        load: roundLoad(0.75),
        reps: '8 a 10 reps',
        guidance: 'Mantén la fuerza con técnica controlada; modula si sientes fatiga premenstrual.',
      },
    },
  };
}
