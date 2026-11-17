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
}

export const ESSENTIAL_EXERCISES: EssentialExercise[] = [
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
];

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
        reps: '5 a 8 reps',
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
