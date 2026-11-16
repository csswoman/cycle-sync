export type Goal = 'performance' | 'pmos' | 'fertility' | 'wellness';

export interface OnboardingAnswers {
  goal?: Goal;
  regularity?: 'regular' | 'irregular' | 'unsure' | 'none';
  contraception?: 'none' | 'pill' | 'iud' | 'other' | 'nonhormonal';
  symptoms?: string[];
  activity?: 'low' | 'moderate' | 'high';
}

export interface OnboardingQuestion {
  id: keyof OnboardingAnswers;
  multi: boolean;
  /** Option ids; text comes from onboardingText.archetype.options[`${prefix}_${id}`]. */
  prefix: string;
  options: { id: string; icon: string }[];
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
    id: 'regularity', multi: false, prefix: 'reg',
    options: [
      { id: 'regular', icon: 'event_available' },
      { id: 'irregular', icon: 'event_repeat' },
      { id: 'unsure', icon: 'help' },
      { id: 'none', icon: 'event_busy' },
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
