import type { NewRecipe, NutritionInfo, RecipeLanguage } from '../../types/recipes';

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const strList = (v: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(v)
    ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems)
    : [];

const posInt = (v: unknown, max: number): number | null => {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n > 0 && n <= max ? Math.round(n) : null;
};

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 10) / 10 : undefined;
};

function cleanNutrition(v: any): NutritionInfo | null {
  if (!v || typeof v !== 'object') return null;
  const n: NutritionInfo = {
    calories: num(v.calories),
    protein: num(v.protein),
    carbohydrates: num(v.carbohydrates),
    fat: num(v.fat),
    fiber: num(v.fiber),
  };
  return Object.values(n).some((x) => x !== undefined) ? n : null;
}

/** Validates one recipe object coming from Gemini. Returns null when it is unusable. */
export function sanitizeRecipe(raw: any, language: RecipeLanguage): NewRecipe | null {
  const title = str(raw?.title, 150);
  const ingredients = strList(raw?.ingredients, 60, 200);
  const steps = strList(raw?.steps, 40, 1000);
  if (!title || ingredients.length === 0 || steps.length === 0) return null;
  return {
    title,
    description: str(raw?.description, 500),
    language,
    readyInMinutes: posInt(raw?.readyInMinutes, 1440),
    servings: posInt(raw?.servings, 100),
    ingredients,
    steps,
    nutrition: cleanNutrition(raw?.nutrition),
    tags: Array.from(new Set(strList(raw?.tags, 10, 40))),
  };
}

/** Extracts the recipes array from Gemini's JSON text. */
export function parseRecipesJson(text: string, language: RecipeLanguage): NewRecipe[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    try {
      data = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.recipes) ? data.recipes : [];
  return list.map((r: unknown) => sanitizeRecipe(r, language)).filter((r: NewRecipe | null): r is NewRecipe => r !== null);
}
