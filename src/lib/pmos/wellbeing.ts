/**
 * Monthly wellbeing screening. PHQ-2 and GAD-2 are validated two-question screeners
 * (each answer 0-3, a total of 3 or more is a positive screen that deserves a fuller
 * assessment). The sleep questions come from STOP-Bang (snoring, tiredness, observed apnea).
 * Depression, anxiety and sleep apnea are all more common with PMOS (2023 guideline).
 */
export interface WellbeingAnswers {
  phq_interest: number;
  phq_mood: number;
  gad_nervous: number;
  gad_worry: number;
  snoring: boolean;
  daytime_tiredness: boolean;
  observed_apnea: boolean;
}

export interface WellbeingResult {
  phq2: number;
  gad2: number;
  moodFlag: boolean;
  anxietyFlag: boolean;
  /** Two or more sleep-apnea signs. */
  sleepFlag: boolean;
}

export const SCREEN_CUTOFF = 3;
export const CHECK_INTERVAL_DAYS = 30;

export function scoreWellbeing(a: WellbeingAnswers): WellbeingResult {
  const phq2 = a.phq_interest + a.phq_mood;
  const gad2 = a.gad_nervous + a.gad_worry;
  const sleepSigns = [a.snoring, a.daytime_tiredness, a.observed_apnea].filter(Boolean).length;
  return { phq2, gad2, moodFlag: phq2 >= SCREEN_CUTOFF, anxietyFlag: gad2 >= SCREEN_CUTOFF, sleepFlag: sleepSigns >= 2 };
}

/**
 * SCOFF: five yes/no questions about eating. Two or more "yes" answers is a positive screen that
 * deserves a conversation with a professional. It is optional and asked every 90 days.
 */
export const SCOFF_QUESTIONS = ['sick', 'control', 'weight', 'fat', 'food'] as const;
export type ScoffKey = (typeof SCOFF_QUESTIONS)[number];
export type ScoffAnswers = Record<ScoffKey, boolean>;
export const SCOFF_CUTOFF = 2;
export const SCOFF_INTERVAL_DAYS = 90;
export function scoreScoff(answers: Partial<ScoffAnswers>): { score: number; positive: boolean } {
  const score = SCOFF_QUESTIONS.filter((k) => answers[k] === true).length;
  return { score, positive: score >= SCOFF_CUTOFF };
}
/** True when SCOFF was never shown, or the last time it was answered or skipped was 90 days ago or more. */
export function isScoffDue(lastDate: string | null, today: string): boolean {
  if (!lastDate) return true;
  const [y1, m1, d1] = lastDate.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  return (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86_400_000 >= SCOFF_INTERVAL_DAYS;
}
/** Quick-log symptom keys (stored in daily_logs.symptoms) used to follow eating patterns. */
export const EATING_SYMPTOMS = {
  binge: 'Binge / Loss of Control',
  emotional: 'Emotional Eating',
  skipped: 'Skipped Meals',
} as const;

export function isCheckDue(lastDate: string | null, today: string): boolean {
  if (!lastDate) return true;
  const [y1, m1, d1] = lastDate.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  return (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86_400_000 >= CHECK_INTERVAL_DAYS;
}

/**
 * Modified Ferriman-Gallwey: nine androgen-sensitive areas scored 0 (no terminal hair) to 4
 * (extensive). The guideline suggests 4–6 or more as hirsutism, depending on ethnicity; the
 * app uses it only to follow the trend over time.
 */
export const FG_AREAS = [
  { key: 'upper_lip', es: 'Labio superior', en: 'Upper lip' },
  { key: 'chin', es: 'Mentón y mandíbula', en: 'Chin and jaw' },
  { key: 'chest', es: 'Pecho', en: 'Chest' },
  { key: 'upper_abdomen', es: 'Abdomen superior', en: 'Upper abdomen' },
  { key: 'lower_abdomen', es: 'Abdomen inferior', en: 'Lower abdomen' },
  { key: 'upper_arm', es: 'Brazos (parte superior)', en: 'Upper arms' },
  { key: 'thigh', es: 'Muslos', en: 'Thighs' },
  { key: 'upper_back', es: 'Espalda alta', en: 'Upper back' },
  { key: 'lower_back', es: 'Espalda baja', en: 'Lower back' },
] as const;

export type FGArea = (typeof FG_AREAS)[number]['key'];
export const FG_THRESHOLD = 6;

export function fgTotal(scores: Partial<Record<FGArea, number>>): number {
  return FG_AREAS.reduce((sum, a) => sum + Math.max(0, Math.min(4, Math.round(scores[a.key] ?? 0))), 0);
}
