import { METFORMIN_PATTERN } from './metformin';

/** Side-effect chips by type of medication. Free text is never stored; only these keys. */
export type EffectKey =
  | 'nausea' | 'diarrhea' | 'stomach_pain' | 'metallic_taste' | 'bloating' | 'dizziness' | 'frequent_urination'
  | 'breast_tenderness' | 'irregular_bleeding' | 'spotting' | 'headache' | 'mood_changes' | 'fatigue' | 'other';
export const EFFECT_LABELS: Record<EffectKey, { es: string; en: string }> = {
  nausea: { es: 'Náuseas', en: 'Nausea' },
  diarrhea: { es: 'Diarrea', en: 'Diarrhoea' },
  stomach_pain: { es: 'Dolor de estómago', en: 'Stomach pain' },
  metallic_taste: { es: 'Sabor metálico', en: 'Metallic taste' },
  bloating: { es: 'Hinchazón', en: 'Bloating' },
  dizziness: { es: 'Mareo', en: 'Dizziness' },
  frequent_urination: { es: 'Orinar más seguido', en: 'Frequent urination' },
  breast_tenderness: { es: 'Sensibilidad en los pechos', en: 'Breast tenderness' },
  irregular_bleeding: { es: 'Sangrado irregular', en: 'Irregular bleeding' },
  spotting: { es: 'Manchado', en: 'Spotting' },
  headache: { es: 'Dolor de cabeza', en: 'Headache' },
  mood_changes: { es: 'Cambios de ánimo', en: 'Mood changes' },
  fatigue: { es: 'Cansancio', en: 'Fatigue' },
  other: { es: 'Otro', en: 'Other' },
};
const BY_TYPE: { test: RegExp; effects: EffectKey[] }[] = [
  { test: METFORMIN_PATTERN, effects: ['nausea', 'diarrhea', 'stomach_pain', 'metallic_taste', 'bloating', 'fatigue'] },
  { test: /espironolact|spironolact/i, effects: ['dizziness', 'frequent_urination', 'breast_tenderness', 'irregular_bleeding', 'headache', 'fatigue'] },
  { test: /anticonceptiv|contracept|p[ií]ldora|\bpill\b/i, effects: ['spotting', 'nausea', 'headache', 'breast_tenderness', 'mood_changes', 'bloating'] },
];
const GENERIC: EffectKey[] = ['nausea', 'headache', 'dizziness', 'fatigue', 'stomach_pain', 'mood_changes'];
export function effectOptions(medicationName: string): EffectKey[] {
  const list = BY_TYPE.find((b) => b.test.test(medicationName))?.effects ?? GENERIC;
  return [...list, 'other'];
}
export const SEVERITY_LABELS = {
  1: { es: 'Leve', en: 'Mild' },
  2: { es: 'Moderado', en: 'Moderate' },
  3: { es: 'Fuerte', en: 'Strong' },
} as const;
export function effectLabel(key: string, lang: 'es' | 'en'): string {
  return (EFFECT_LABELS as Record<string, { es: string; en: string }>)[key]?.[lang] ?? key;
}
