import type { RecipeLanguage } from '../../types/recipes';

const SCHEMA = `{
  "recipes": [
    {
      "title": string,
      "description": string (1-2 sentences),
      "readyInMinutes": number,
      "servings": number,
      "ingredients": string[] (each with amount, e.g. "200 g de lentejas"),
      "steps": string[] (one short step per item, no numbering),
      "nutrition": { "calories": number, "protein": number, "carbohydrates": number, "fat": number, "fiber": number } per serving,
      "tags": string[]
    }
  ]
}`;

const TAGS: Record<RecipeLanguage, string> = {
  es: 'Bajo IG, Antiinflamatoria, Sin gluten, Sin lácteos, Vegetariana, Vegana, Alta en proteína',
  en: 'Low GI, Anti-inflammatory, Gluten free, Dairy free, Vegetarian, Vegan, High protein',
};

const LANGUAGE_NAME: Record<RecipeLanguage, string> = { es: 'Spanish', en: 'English' };

/** Prompt for creating new recipes from the ingredients the user has. */
export function buildGeneratePrompt(opts: {
  ingredients: string[];
  phase: string;
  dietary: string[];
  language: RecipeLanguage;
  existingTitles: string[];
}): string {
  const { ingredients, phase, dietary, language, existingTitles } = opts;
  return `You are a nutrition expert specialized in cycle-synced eating and PMOS-friendly food.
Create 3 different recipes using these ingredients (you may add common pantry items): ${ingredients.join(', ')}.
Current cycle phase: ${phase}. ${dietary.length ? `Dietary restrictions: ${dietary.join(', ')}.` : ''}
Prefer low glycemic index and anti-inflammatory ingredients.
Write everything in ${LANGUAGE_NAME[language]}, with natural dish names a native speaker would use.
Tags: pick only from this list when they apply: ${TAGS[language]}.
${existingTitles.length ? `These recipes already exist, do NOT create them or close variations of them: ${existingTitles.slice(0, 300).join('; ')}.` : ''}
Answer with JSON only, using exactly this shape:
${SCHEMA}`;
}

/** Prompt for extracting every recipe found in a PDF document. */
export function buildPdfPrompt(language: RecipeLanguage): string {
  return `Extract every complete recipe from the attached PDF. Do not invent recipes that are not in the document.
Write the output in ${LANGUAGE_NAME[language]} (translate if the document uses another language).
If a value is not in the document, estimate nutrition per serving and use null for readyInMinutes or servings when unknown.
Tags: pick only from this list when they apply: ${TAGS[language]}.
Answer with JSON only, using exactly this shape:
${SCHEMA}`;
}
