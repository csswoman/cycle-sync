import type { Language } from '@/i18n/translations';

/** A min-max estimate, in kcal or grams. */
export interface Range {
  min: number;
  max: number;
}

export interface MealFood {
  name: string;
  portion?: string;
  kcal?: Range;
}

export interface MealMicro {
  nutrient: string;
  sources: string;
  benefit: string;
}

export interface MealPoint {
  title: string;
  detail: string;
}

export interface MealScoreReason extends MealPoint {
  positive: boolean;
}

export interface MealAnalysis {
  summary: string;
  foods: MealFood[];
  calories: Range | null;
  macros: { protein: Range; carbs: Range; fat: Range } | null;
  micronutrients: MealMicro[];
  score: { value: number; reasons: MealScoreReason[] } | null;
  protein: { status: 'low' | 'ok' | 'high'; message: string } | null;
  suggestions: MealPoint[];
}

const SCHEMA = `{
  "summary": string,                       // 1-2 sentence overall verdict
  "foods": [{ "name": string, "portion": string, "kcal": { "min": number, "max": number } }],
  "calories": { "min": number, "max": number },
  "macros": {
    "protein": { "min": number, "max": number },
    "carbs": { "min": number, "max": number },
    "fat": { "min": number, "max": number }
  },
  "micronutrients": [{ "nutrient": string, "sources": string, "benefit": string }],
  "score": { "value": number, "reasons": [{ "title": string, "detail": string, "positive": boolean }] },
  "protein": { "status": "low" | "ok" | "high", "message": string },
  "suggestions": [{ "title": string, "detail": string }]
}`;

/** Prompt that asks the model for the analysis as JSON matching {@link MealAnalysis}. */
export function buildMealAnalysisPrompt(lang: Language, opts: { pmos: boolean; hideNumbers: boolean }): string {
  const scoreRule = opts.pmos
    ? 'score.value: 1-10, how PMOS-friendly the meal is (low glycemic, anti-inflammatory).'
    : 'score.value: 1-10, how well the meal keeps blood sugar steady and supports the menstrual cycle (low glycemic, anti-inflammatory). Do not mention PMOS.';
  const numberRules = opts.hideNumbers
    ? 'Set "calories", "macros" and "protein" to null, omit "kcal" in foods, and never mention calories, weight or numeric nutrient amounts in any text.'
    : 'Ranges are estimates for the whole plate (grams for macros, kcal for calories). protein: "ok" if it fits one meal (about 25-40 g, enough to fully stimulate muscle protein synthesis); if "low", suggest how to add some; if "high", note it is not wasted but is used better split across meals 3-5 hours apart.';
  const language = lang === 'es' ? 'Spanish' : 'English';

  return `You are a nutrition expert. Analyze this food photo and answer ONLY with JSON matching this shape:
${SCHEMA}

Rules:
- foods: every food item you see, with an estimated portion.
- micronutrients: 2-5 key vitamins/minerals, the foods that provide them and why they matter.
- ${scoreRule} reasons: 2-4 short factors explaining the score, positive or negative.
- suggestions: 2-5 concrete swaps or additions to make it more hormone-friendly.
- ${numberRules}
- Keep every text short (titles under 6 words, details 1-2 sentences). No markdown.
- Write all text in ${language}.`;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

function range(v: any): Range | null {
  const min = num(v?.min);
  const max = num(v?.max);
  if (min === null && max === null) return null;
  const lo = min ?? max!;
  const hi = max ?? min!;
  return { min: Math.round(Math.min(lo, hi)), max: Math.round(Math.max(lo, hi)) };
}

const list = <T>(v: unknown, map: (item: any) => T | null): T[] =>
  Array.isArray(v) ? v.map(map).filter((x): x is T => x !== null) : [];

const point = (p: any): MealPoint | null => (str(p?.title) || str(p?.detail) ? { title: str(p?.title), detail: str(p?.detail) } : null);

/**
 * Parses the model's reply into a {@link MealAnalysis}. Tolerates code fences and missing
 * fields; returns null when the reply is not usable JSON so the caller can show it as text.
 */
export function parseMealAnalysis(text: string, hideNumbers = false): MealAnalysis | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let data: any;
  try {
    data = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      data = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;

  const foods = list<MealFood>(data.foods, (f) => {
    const name = str(f?.name);
    if (!name) return null;
    const kcal = hideNumbers ? null : range(f?.kcal);
    return { name, ...(str(f?.portion) && { portion: str(f.portion) }), ...(kcal && { kcal }) };
  });

  const protein = range(data.macros?.protein);
  const carbs = range(data.macros?.carbs);
  const fat = range(data.macros?.fat);

  const scoreValue = num(data.score?.value);
  const status = data.protein?.status;

  const result: MealAnalysis = {
    summary: str(data.summary),
    foods,
    calories: hideNumbers ? null : range(data.calories),
    macros: hideNumbers || !protein || !carbs || !fat ? null : { protein, carbs, fat },
    micronutrients: list<MealMicro>(data.micronutrients, (m) =>
      str(m?.nutrient) ? { nutrient: str(m.nutrient), sources: str(m?.sources), benefit: str(m?.benefit) } : null),
    score: scoreValue === null ? null : {
      value: Math.min(10, Math.max(1, Math.round(scoreValue))),
      reasons: list<MealScoreReason>(data.score?.reasons, (r) => {
        const p = point(r);
        return p ? { ...p, positive: r?.positive === true } : null;
      }),
    },
    protein: hideNumbers || !str(data.protein?.message) ? null : {
      status: status === 'low' || status === 'high' ? status : 'ok',
      message: str(data.protein.message),
    },
    suggestions: list(data.suggestions, point),
  };

  const empty = !result.summary && !result.foods.length && !result.score && !result.suggestions.length;
  return empty ? null : result;
}

/** "250" or "250-320". */
export const formatRange = (r: Range): string => (r.min === r.max ? `${r.min}` : `${r.min}-${r.max}`);
