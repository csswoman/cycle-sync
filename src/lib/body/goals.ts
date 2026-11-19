// Goals for body progress: a goal weight and the habits that get there. Pure, so they can be tested.

export interface WeightGoalProgress {
  /** 'lose' when the goal is below the start, 'gain' when above. */
  direction: 'lose' | 'gain';
  /** kg moved toward the goal (negative when moving away). */
  done: number;
  /** kg left to reach the goal (0 once reached). */
  remaining: number;
  /** 0–100, how much of the way is covered. */
  percent: number;
  reached: boolean;
  /** Weight at a 5% loss from the start: the first milestone that improves PMOS symptoms. */
  firstMilestoneKg: number | null;
  firstMilestoneReached: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function weightGoalProgress(start: number, current: number, goal: number): WeightGoalProgress | null {
  if (!(start > 0) || !(current > 0) || !(goal > 0) || start === goal) return null;
  const direction = goal < start ? 'lose' : 'gain';
  const total = Math.abs(goal - start);
  const done = round1(direction === 'lose' ? start - current : current - start);
  const reached = direction === 'lose' ? current <= goal : current >= goal;
  const remaining = reached ? 0 : round1(Math.abs(goal - current));
  const percent = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  // Only a useful milestone when the goal is further than 5% away.
  const milestone = direction === 'lose' && start * 0.95 > goal ? round1(start * 0.95) : null;
  return {
    direction, done, remaining, percent, reached,
    firstMilestoneKg: milestone,
    firstMilestoneReached: milestone != null && current <= milestone,
  };
}

export type FocusHabitKey = 'eat_better' | 'cravings' | 'sleep' | 'movement' | 'stress' | 'hydration';

interface Localized { es: string; en: string }

export interface FocusHabit {
  key: FocusHabitKey;
  icon: string;
  /** Tailwind classes for the icon tile. */
  tone: string;
  label: Localized;
  /** Why it matters with PMOS, one sentence. */
  why: Localized;
  /** A daily habit to add to /habits. */
  daily: { name: Localized; goal: number; unit: Localized };
}

export const FOCUS_HABITS: FocusHabit[] = [
  {
    key: 'eat_better', icon: 'restaurant', tone: 'bg-leaf-fresh/15 text-leaf',
    label: { es: 'Aprender a comer mejor', en: 'Learn to eat better' },
    why: {
      es: 'Proteína y verdura en cada comida estabilizan la glucosa y te dejan satisfecha más tiempo.',
      en: 'Protein and vegetables at every meal steady your glucose and keep you full longer.',
    },
    daily: { name: { es: 'Proteína en cada comida', en: 'Protein at every meal' }, goal: 3, unit: { es: 'comidas', en: 'meals' } },
  },
  {
    key: 'cravings', icon: 'favorite', tone: 'bg-coral/10 text-coral',
    label: { es: 'Cambiar los antojos', en: 'Change cravings' },
    why: {
      es: 'Los antojos con PMOS suelen venir de la insulina, no de falta de voluntad. Un desayuno con proteína los baja.',
      en: 'With PMOS, cravings often come from insulin, not willpower. A protein breakfast lowers them.',
    },
    daily: { name: { es: 'Desayuno con proteína', en: 'Protein breakfast' }, goal: 1, unit: { es: 'veces', en: 'times' } },
  },
  {
    key: 'sleep', icon: 'bedtime', tone: 'bg-petal/15 text-blossom',
    label: { es: 'Dormir mejor', en: 'Sleep better' },
    why: {
      es: 'Dormir poco sube el cortisol y el hambre al día siguiente. Una hora fija para acostarte ayuda más que dormir de más el fin de semana.',
      en: 'Short sleep raises cortisol and next-day hunger. A fixed bedtime helps more than sleeping in on weekends.',
    },
    daily: { name: { es: 'Dormir 7–8 horas', en: 'Sleep 7–8 hours' }, goal: 7, unit: { es: 'horas', en: 'hours' } },
  },
  {
    key: 'movement', icon: 'directions_walk', tone: 'bg-sun/10 text-sun-ink',
    label: { es: 'Moverme más', en: 'Move more' },
    why: {
      es: 'El músculo usa la glucosa: fuerza 2–3 veces por semana y caminar después de comer mejoran la resistencia a la insulina.',
      en: 'Muscle uses glucose: strength 2–3 times a week and walking after meals improve insulin resistance.',
    },
    daily: { name: { es: 'Caminar 20 minutos', en: 'Walk 20 minutes' }, goal: 20, unit: { es: 'minutos', en: 'minutes' } },
  },
  {
    key: 'stress', icon: 'self_improvement', tone: 'bg-secondary text-foreground',
    label: { es: 'Manejar el estrés', en: 'Manage stress' },
    why: {
      es: 'El estrés sostenido sube el cortisol, que empuja la grasa abdominal y los antojos.',
      en: 'Ongoing stress raises cortisol, which drives belly fat and cravings.',
    },
    daily: { name: { es: 'Pausa para respirar', en: 'Breathing break' }, goal: 5, unit: { es: 'minutos', en: 'minutes' } },
  },
  {
    key: 'hydration', icon: 'water_drop', tone: 'bg-leaf-fresh/15 text-leaf',
    label: { es: 'Tomar más agua', en: 'Drink more water' },
    why: {
      es: 'A veces la sed se siente como hambre. Un vaso antes de cada comida es un buen inicio.',
      en: 'Thirst can feel like hunger. A glass before each meal is a good start.',
    },
    daily: { name: { es: 'Agua antes de comer', en: 'Water before meals' }, goal: 3, unit: { es: 'vasos', en: 'glasses' } },
  },
];
