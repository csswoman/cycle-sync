/**
 * Today's adaptive plan: the cycle phase, today's quick check-in and the planner's workout
 * combine into one suggestion for movement, one anchor meal, a craving tip and a single focus.
 *
 * Rules of thumb:
 * - How she feels today wins over the calendar. The phase only tunes food and the default
 *   when there is no check-in yet.
 * - With PMOS, irregular cycles, hormonal contraception or a late period the date-based phase
 *   is not reliable, so the plan says it is following her signals instead.
 * - Every mode has a version that counts. The minimum (10 min) is a win, not a failure.
 */
import type { CyclePhase } from '@/types';

type Lang = 'es' | 'en';
type Text = Record<Lang, string>;

export type CravingKind = 'sweet' | 'salty' | 'carbs';
export type MoveMode = 'full' | 'light' | 'minimum' | 'rest';
/** What the plan is based on: today's check-in, the (reliable) phase, or neither yet. */
export type PlanBasis = 'checkin' | 'phase' | 'none';

export interface TodayCheckin {
  /** 1-10, same scale as daily_logs.energy_level. */
  energy: number | null;
  /** 1 none, 2 a little, 3 ready to go. */
  motivation: number | null;
  sleepHours: number | null;
  cravings: CravingKind[];
  /** 1 mild, 2 moderate, 3 strong. */
  cravingIntensity: number | null;
  symptoms: string[];
}

export interface PlannedWorkout {
  kind: 'video' | 'gym' | 'rest';
  title: string;
  durationMinutes: number | null;
}

export interface PlanInput {
  phase: CyclePhase | string | null;
  confidence?: 'low' | 'medium' | 'high';
  irregular?: boolean;
  overdue?: boolean;
  /** Hormonal contraception: there are no natural phases to follow. */
  hormonal?: boolean;
  checkin: TodayCheckin | null;
  planned: PlannedWorkout | null;
}

export interface DailyPlan {
  mode: MoveMode;
  basis: PlanBasis;
  /** True when the date-based phase should not drive suggestions. */
  phaseUnreliable: boolean;
  /** Suggested minutes for the movement, null on rest days. */
  minutes: number | null;
  move: Text;
  /** Short reason for the mode, shown under the suggestion. */
  why: Text;
  meal: Text;
  craving: Text | null;
  focus: Text;
}

/** Symptoms that make a hard session a bad idea today. */
const HEAVY_SYMPTOMS = ['Mild Cramps', 'Pelvic Pain', 'Headache', 'Nausea / Stomach Upset', 'Back Pain'];

export function phaseIsUnreliable(input: Pick<PlanInput, 'phase' | 'confidence' | 'irregular' | 'overdue' | 'hormonal'>): boolean {
  return !input.phase || !!input.hormonal || !!input.irregular || !!input.overdue || input.confidence === 'low';
}

/** Low / medium / high from the check-in; null when nothing relevant was logged. */
export function readiness(c: TodayCheckin | null): 'low' | 'medium' | 'high' | null {
  if (!c) return null;
  const signals: number[] = [];
  if (c.energy != null) signals.push(c.energy <= 3 ? 1 : c.energy <= 6 ? 2 : 3);
  if (c.motivation != null) signals.push(c.motivation);
  if (c.sleepHours != null && c.sleepHours < 6) signals.push(1);
  if (c.symptoms.some((s) => HEAVY_SYMPTOMS.includes(s))) signals.push(1);
  if (!signals.length) return null;
  // The lowest signal sets the ceiling: low energy or no motivation alone is enough to go gentle.
  const min = Math.min(...signals);
  return min === 1 ? 'low' : min === 2 ? 'medium' : 'high';
}

const PHASE_DEFAULT: Record<string, MoveMode> = {
  Menstrual: 'light',
  Follicular: 'full',
  Ovulation: 'full',
  Luteal: 'light',
};

const MEALS: Record<string, Text> = {
  Menstrual: {
    es: 'Proteína + hierro: lentejas o carne con algo de vitamina C (naranja, pimiento) para absorberlo mejor.',
    en: 'Protein + iron: lentils or meat with some vitamin C (orange, bell pepper) to absorb it better.',
  },
  Follicular: {
    es: 'Proteína + fibra en el desayuno: huevos con verduras o yogur griego con chía y frutos rojos.',
    en: 'Protein + fiber at breakfast: eggs with vegetables or Greek yogurt with chia and berries.',
  },
  Ovulation: {
    es: 'Plato equilibrado: mitad verduras, un cuarto proteína y un cuarto carbohidrato con fibra.',
    en: 'Balanced plate: half vegetables, a quarter protein and a quarter fiber-rich carbs.',
  },
  Luteal: {
    es: 'Carbohidrato complejo + proteína + magnesio: avena, camote o legumbres con semillas de calabaza.',
    en: 'Complex carbs + protein + magnesium: oats, sweet potato or legumes with pumpkin seeds.',
  },
  none: {
    es: 'Proteína + fibra en cada comida, empezando por el desayuno. Es lo que más estabiliza la glucosa con PMOS.',
    en: 'Protein + fiber at every meal, starting with breakfast. It is what steadies blood sugar most with PMOS.',
  },
};

const CRAVINGS: Record<CravingKind, Text> = {
  sweet: {
    es: 'Antojo de dulce: fruta con yogur griego o crema de cacahuate, o un cuadrito de chocolate 70%. Si comes postre, mejor después de una comida con proteína y con una caminata corta después.',
    en: 'Sweet craving: fruit with Greek yogurt or peanut butter, or a square of 70% chocolate. If you have dessert, have it after a meal with protein and take a short walk afterwards.',
  },
  salty: {
    es: 'Antojo salado: palomitas naturales, edamame, nueces o hummus con verduras. Bebe agua: a veces es sed o hinchazón.',
    en: 'Salty craving: plain popcorn, edamame, nuts or hummus with veggies. Drink some water: sometimes it is thirst or bloating.',
  },
  carbs: {
    es: 'Antojo de carbohidratos: no te los quites, elige los que traen fibra (avena, pan integral, camote) y acompáñalos con proteína.',
    en: 'Carb craving: don’t cut them out. Pick ones with fiber (oats, whole-grain bread, sweet potato) and pair them with protein.',
  },
};

const clampMinutes = (n: number) => Math.max(10, Math.round(n / 5) * 5);

export function buildDailyPlan(input: PlanInput): DailyPlan {
  const unreliable = phaseIsUnreliable(input);
  const phase = input.phase ? String(input.phase) : null;
  const ready = readiness(input.checkin);
  const basis: PlanBasis = ready ? 'checkin' : !unreliable && phase ? 'phase' : 'none';

  let mode: MoveMode =
    ready === 'low' ? 'minimum'
      : ready === 'medium' ? 'light'
        : ready === 'high' ? 'full'
          : basis === 'phase' ? (PHASE_DEFAULT[phase as string] ?? 'light')
            : 'light';
  if (input.planned?.kind === 'rest') mode = 'rest';

  const planned = input.planned && input.planned.kind !== 'rest' ? input.planned : null;
  const base = planned?.durationMinutes ?? 30;
  const minutes =
    mode === 'rest' ? null
      : mode === 'minimum' ? 10
        : mode === 'light' ? clampMinutes(base * 0.6)
          : base;

  const move: Text =
    mode === 'rest'
      ? { es: 'Día de descanso. Si te apetece, una caminata suave después de comer.', en: 'Rest day. If you feel like it, a gentle walk after a meal.' }
      : mode === 'minimum'
        ? { es: 'Versión mínima: 10 minutos de caminata o estiramientos. También cuenta.', en: 'Minimum version: 10 minutes of walking or stretching. It still counts.' }
        : mode === 'light'
          ? planned
            ? { es: `Versión ligera de «${planned.title}»: unos ${minutes} min a ritmo cómodo.`, en: `Light version of “${planned.title}”: about ${minutes} min at an easy pace.` }
            : { es: `Versión ligera: ${minutes} min de caminata, yoga o fuerza suave.`, en: `Light version: ${minutes} min of walking, yoga or gentle strength.` }
          : planned
            ? { es: `Completo: «${planned.title}»${planned.durationMinutes ? ` (${planned.durationMinutes} min)` : ''}.`, en: `Full: “${planned.title}”${planned.durationMinutes ? ` (${planned.durationMinutes} min)` : ''}.` }
            : { es: `Completo: ${minutes} min de fuerza. Es lo que más mejora la sensibilidad a la insulina.`, en: `Full: ${minutes} min of strength training. It does the most for insulin sensitivity.` };

  const c = input.checkin;
  const why: Text =
    mode === 'rest'
      ? { es: 'Tu plan marca descanso hoy. Descansar también es parte del entrenamiento.', en: 'Your plan has a rest day. Rest is part of training too.' }
      : basis === 'checkin'
      ? mode === 'minimum'
        ? c?.sleepHours != null && c.sleepHours < 6
          ? { es: 'Dormiste poco: hoy basta con moverte un poco.', en: 'You slept little: moving a bit is enough today.' }
          : c?.symptoms.some((s) => HEAVY_SYMPTOMS.includes(s))
            ? { es: 'Con molestias, mejor algo suave.', en: 'With discomfort, something gentle is better.' }
            : { es: 'Hoy tienes poca energía o pocas ganas, y está bien.', en: 'Low energy or motivation today, and that’s okay.' }
        : mode === 'light'
          ? { es: 'Energía a medias: una versión más corta.', en: 'Medium energy: a shorter version.' }
          : { es: 'Te sientes con energía: aprovéchala.', en: 'You feel energetic: make the most of it.' }
      : basis === 'phase'
        ? { es: 'Según tu fase. Haz el check-in para ajustarlo a cómo te sientes.', en: 'Based on your phase. Do the check-in to match how you feel.' }
        : { es: 'Tu ciclo no permite saber la fase por la fecha. Con el check-in te guiamos por cómo te sientes.', en: 'Your cycle doesn’t let us tell the phase from the date. The check-in lets us follow how you feel.' };

  const meal = MEALS[!unreliable && phase && MEALS[phase] ? phase : 'none'];

  let craving: Text | null = null;
  if (c?.cravings.length) {
    const first = CRAVINGS[c.cravings[0]];
    const sleepLink = c.sleepHours != null && c.sleepHours < 6 && (c.cravingIntensity ?? 0) >= 2;
    craving = sleepLink
      ? { es: `${first.es} Dormir poco aumenta los antojos: no es falta de voluntad.`, en: `${first.en} Short sleep increases cravings: it isn’t a lack of willpower.` }
      : first;
  }

  const focus: Text =
    c?.sleepHours != null && c.sleepHours < 6
      ? { es: 'Hoy lo más importante: acostarte 30 minutos antes.', en: 'Most important today: go to bed 30 minutes earlier.' }
      : mode === 'minimum'
        ? { es: 'Hoy lo más importante: moverte 10 minutos. Hecho es mejor que perfecto.', en: 'Most important today: move for 10 minutes. Done beats perfect.' }
        : c?.cravings.length
          ? { es: 'Hoy lo más importante: no saltarte comidas. Los antojos suben cuando pasas mucho tiempo sin comer.', en: 'Most important today: don’t skip meals. Cravings rise after long gaps without food.' }
          : { es: 'Hoy lo más importante: tu comida ancla con proteína y fibra.', en: 'Most important today: your anchor meal with protein and fiber.' };

  return { mode, basis, phaseUnreliable: unreliable, minutes, move, why, meal, craving, focus };
}

/** Movement days in the last 7 (ending `today`) and whether the "never two days at zero" rule holds. */
export function flexibleStreak(moveDates: string[], today: string): { days: number; twoZeroDays: boolean; movedToday: boolean } {
  const set = new Set(moveDates);
  const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const back = (n: number) => { const d = parse(today); d.setDate(d.getDate() - n); return iso(d); };
  let days = 0;
  for (let i = 0; i < 7; i++) if (set.has(back(i))) days++;
  // Yesterday and the day before both empty: today is the day to break the gap.
  const twoZeroDays = !set.has(back(1)) && !set.has(back(2));
  return { days, twoZeroDays, movedToday: set.has(today) };
}
