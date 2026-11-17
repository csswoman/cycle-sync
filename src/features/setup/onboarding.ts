export type Goal = 'performance' | 'pmos' | 'fertility' | 'wellness';

export type Diagnosis = 'yes' | 'suspect' | 'no' | 'private';
export type NoPeriodReason = 'breastfeeding' | 'contraception' | 'stoppedPill' | 'perimenopause' | 'unknown';
/** Manual override for the PMOS toolkit; 'auto' follows the profile. */
export type PmosToolsPref = 'auto' | 'show' | 'hide';
/** What the app adapts to: PMOS (diagnosed or suspected), irregular cycles without PMOS, or regular cycles. */
export type CycleProfile = 'pmos' | 'irregular' | 'regular';

export interface OnboardingAnswers {
  goal?: Goal;
  diagnosis?: Diagnosis;
  regularity?: 'regular' | 'irregular' | 'unsure' | 'none';
  /** Only asked when regularity is 'none'. */
  noPeriodReason?: NoPeriodReason;
  contraception?: 'none' | 'pill' | 'iud' | 'other' | 'nonhormonal';
  symptoms?: string[];
  activity?: 'low' | 'moderate' | 'high';
  pmosTools?: PmosToolsPref;
  /** ISO date of the last time the questionnaire was completed. */
  answeredAt?: string;
}

export interface OnboardingQuestion {
  id: keyof OnboardingAnswers;
  multi: boolean;
  /** Option ids; text comes from onboardingText.archetype.options[`${prefix}_${id}`]. */
  prefix: string;
  options: { id: string; icon: string }[];
  /** Asked only when this returns true; otherwise skipped. */
  when?: (answers: OnboardingAnswers) => boolean;
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'goal', multi: false, prefix: 'goal',
    options: [
      { id: 'performance', icon: 'trending_up' },
      { id: 'pmos', icon: 'spa' },
      { id: 'fertility', icon: 'child_friendly' },
      { id: 'wellness', icon: 'favorite' },
    ],
  },
  {
    id: 'diagnosis', multi: false, prefix: 'dx',
    options: [
      { id: 'yes', icon: 'verified' },
      { id: 'suspect', icon: 'search' },
      { id: 'no', icon: 'block' },
      { id: 'private', icon: 'lock' },
    ],
  },
  {
    id: 'regularity', multi: false, prefix: 'reg',
    options: [
      { id: 'regular', icon: 'event_available' },
      { id: 'irregular', icon: 'event_repeat' },
      { id: 'unsure', icon: 'help' },
      { id: 'none', icon: 'event_busy' },
    ],
  },
  {
    id: 'noPeriodReason', multi: false, prefix: 'np',
    when: (a) => a.regularity === 'none',
    options: [
      { id: 'breastfeeding', icon: 'child_care' },
      { id: 'contraception', icon: 'medication' },
      { id: 'stoppedPill', icon: 'event_repeat' },
      { id: 'perimenopause', icon: 'hourglass' },
      { id: 'unknown', icon: 'help' },
    ],
  },
  {
    id: 'contraception', multi: false, prefix: 'con',
    options: [
      { id: 'none', icon: 'block' },
      { id: 'pill', icon: 'medication' },
      { id: 'iud', icon: 'health_and_safety' },
      { id: 'other', icon: 'vaccines' },
      { id: 'nonhormonal', icon: 'shield' },
    ],
  },
  {
    id: 'symptoms', multi: true, prefix: 'sym',
    options: [
      { id: 'cramps', icon: 'sentiment_stressed' },
      { id: 'fatigue', icon: 'battery_2_bar' },
      { id: 'mood', icon: 'mood' },
      { id: 'bloating', icon: 'air' },
      { id: 'acne', icon: 'face' },
      { id: 'headache', icon: 'psychology_alt' },
      { id: 'sleep', icon: 'bedtime' },
      { id: 'cravings', icon: 'cookie' },
      { id: 'hair', icon: 'content_cut' },
    ],
  },
  {
    id: 'activity', multi: false, prefix: 'act',
    options: [
      { id: 'low', icon: 'weekend' },
      { id: 'moderate', icon: 'directions_walk' },
      { id: 'high', icon: 'fitness_center' },
    ],
  },
];

/** Questions that apply to these answers, in order (conditional ones are skipped). */
export function activeQuestions(answers: OnboardingAnswers): OnboardingQuestion[] {
  return ONBOARDING_QUESTIONS.filter((q) => !q.when || q.when(answers));
}

/** Drops answers to conditional questions that no longer apply. */
export function pruneAnswers(answers: OnboardingAnswers): OnboardingAnswers {
  const out = { ...answers };
  for (const q of ONBOARDING_QUESTIONS) if (q.when && !q.when(answers)) delete out[q.id];
  return out;
}

/** Symptoms are optional; every other question must be answered. */
export function isQuestionAnswered(q: OnboardingQuestion, answers: OnboardingAnswers): boolean {
  if (q.id === 'symptoms') return true;
  return answers[q.id] !== undefined;
}

/** Value stored in cycle_config.archetype. */
export function deriveArchetype(answers: OnboardingAnswers): Goal {
  return answers.goal ?? 'wellness';
}

/** Hormonal methods suppress natural ovulation, so ovulation estimates do not apply. */
export function usesHormonalContraception(answers: OnboardingAnswers): boolean {
  return answers.contraception === 'pill' || answers.contraception === 'iud' || answers.contraception === 'other';
}

/**
 * The diagnosis answer decides PMOS, not regularity: PMOS can come with fairly regular cycles and
 * irregular cycles have many other causes. Answers saved before the diagnosis question existed
 * (no `diagnosis`) keep the PMOS profile unless the cycle was reported regular, so nobody loses
 * tools they were already using.
 */
export function cycleProfile(answers: OnboardingAnswers): CycleProfile {
  if (answers.diagnosis === 'yes' || answers.diagnosis === 'suspect' || answers.goal === 'pmos') return 'pmos';
  if (answers.regularity === 'regular') return 'regular';
  if (answers.diagnosis === undefined) return 'pmos';
  return 'irregular';
}

/** PMOS toolkit and PMOS wording: the manual setting wins, otherwise the profile decides. */
export function showsPmosTools(answers: OnboardingAnswers): boolean {
  if (answers.pmosTools === 'show') return true;
  if (answers.pmosTools === 'hide') return false;
  return cycleProfile(answers) === 'pmos';
}

/** Days after which the questionnaire is offered again, since cycles change (postpartum, stopping the pill...). */
export const PROFILE_REVIEW_DAYS = 180;

export function profileNeedsReview(answers: OnboardingAnswers, today: Date = new Date()): boolean {
  if (!answers.answeredAt) return false;
  const answered = new Date(answers.answeredAt);
  if (Number.isNaN(answered.getTime())) return false;
  return (today.getTime() - answered.getTime()) / 86_400_000 >= PROFILE_REVIEW_DAYS;
}

/**
 * Breastfeeding, contraception that stops bleeding and menopause explain long gaps, so the
 * "no period in 90 days" and "few periods a year" alerts are noise for them. 'stoppedPill' and
 * 'unknown' keep the alerts: months without a period after stopping is still worth checking.
 */
export function expectsLongGaps(answers: OnboardingAnswers): boolean {
  return answers.regularity === 'none'
    && (answers.noPeriodReason === 'breastfeeding' || answers.noPeriodReason === 'contraception' || answers.noPeriodReason === 'perimenopause');
}

export type ProfileNudge = 'cyclesChanged' | 'review';
const IRREGULAR_FLAGS = ['longCycles', 'shortCycles', 'noPeriod90', 'fewPeriodsYear'];

/**
 * When to suggest updating the profile. The app never changes it on its own: a user who said her
 * cycle is regular but whose log now looks irregular is asked, and every profile is offered a
 * review after PROFILE_REVIEW_DAYS.
 */
export function profileNudge(
  answers: OnboardingAnswers,
  log: { irregular: boolean; flags: string[] },
  today: Date = new Date(),
): ProfileNudge | null {
  const looksIrregular = log.irregular || log.flags.some((f) => IRREGULAR_FLAGS.includes(f));
  if (cycleProfile(answers) === 'regular' && answers.pmosTools !== 'show' && looksIrregular) return 'cyclesChanged';
  if (profileNeedsReview(answers, today)) return 'review';
  return null;
}

const STORAGE_KEY = 'cs_onboarding_answers';

export function loadOnboardingAnswers(): OnboardingAnswers {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as OnboardingAnswers;
  } catch {
    return {};
  }
}

export function saveOnboardingAnswers(answers: OnboardingAnswers): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}
