import { MEAL_SLOTS, type MealSlot } from './week';
import { avoidedIn, likedIn } from '../nutrition/foodPreferences';
import { normalizeItem } from './grocery';

// Builds the meal side of a weekly plan from recipes the app already has. No AI involved.

export interface PlannableRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  steps?: string[];
  tags: string[];
}

export interface RecipeMeal {
  day: number;
  slot: MealSlot;
  title: string;
  ingredients: string[];
}

export interface RecipePlanResult {
  meals: RecipeMeal[];
  /** Slots that could not be filled (no suitable recipe), for the AI to complete. */
  missing: { day: number; slot: MealSlot }[];
}

const UNITS = new Set([
  'g', 'gr', 'grs', 'gramo', 'gramos', 'kg', 'ml', 'l', 'lt', 'litro', 'litros', 'taza', 'tazas', 'cucharada', 'cucharadas',
  'cucharadita', 'cucharaditas', 'cda', 'cdas', 'cdta', 'cdtas', 'pizca', 'pizcas', 'diente', 'dientes', 'lata', 'latas',
  'rebanada', 'rebanadas', 'loncha', 'lonchas', 'puñado', 'puñados', 'unidad', 'unidades', 'rama', 'ramas', 'hoja', 'hojas',
  'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'oz', 'lb', 'lbs', 'clove', 'cloves',
  'slice', 'slices', 'pinch', 'can', 'cans', 'handful', 'piece', 'pieces',
]);
const SKIP = new Set(['sal', 'agua', 'pimienta', 'salt', 'water', 'pepper']);

/** "200 g de lentejas (cocidas)" becomes "lentejas". Falls back to the original text when nothing is left. */
export function ingredientName(raw: string): string {
  let s = raw.replace(/\(.*?\)/g, ' ').split(/[,;]/)[0].trim();
  s = s.replace(/^[\d\s.,/½¼¾⅓⅔-]+/, '');
  const words = s.split(/\s+/).filter(Boolean);
  while (words.length > 1 && UNITS.has(words[0].toLowerCase().replace(/\.$/, ''))) words.shift();
  while (words.length > 1 && ['de', 'del', 'of'].includes(words[0].toLowerCase())) words.shift();
  const name = words.join(' ').trim();
  return (name || raw.trim()).slice(0, 60);
}

const MEAL_TAGS: Record<MealSlot, string[]> = {
  breakfast: ['desayuno', 'breakfast'],
  lunch: ['almuerzo', 'lunch', 'comida'],
  dinner: ['cena', 'dinner'],
  snack: ['snack', 'postre', 'dessert', 'merienda'],
};
const NOT_A_MEAL = ['bebida', 'drink', 'jugo detox', 'jugo-detox', 'jugos', 'juice'];

/** Meal slots a recipe suits, from its tags. Untagged recipes count as lunch or dinner. */
export function slotsOf(recipe: Pick<PlannableRecipe, 'tags'>): MealSlot[] {
  const tags = recipe.tags.map((t) => normalizeItem(t));
  if (tags.some((t) => NOT_A_MEAL.includes(t))) return [];
  const slots = MEAL_SLOTS.filter((slot) => MEAL_TAGS[slot].some((t) => tags.includes(t)));
  return slots.length ? slots : ['lunch', 'dinner'];
}

/**
 * Picks a recipe for each empty meal slot of the week. Never repeats a recipe until every
 * candidate for that slot has been used, prefers recipes that use pantry items or liked foods,
 * and skips anything containing a food she avoids.
 */
export function buildPlanFromRecipes(
  recipes: PlannableRecipe[],
  opts: {
    pantry: string[];
    avoid: string[];
    likes: string[];
    /** Slots already planned, as `${day}-${slot}`. They are left untouched. */
    taken?: Set<string>;
    random?: () => number;
  },
): RecipePlanResult {
  const random = opts.random ?? Math.random;
  const have = opts.pantry.map(normalizeItem).filter(Boolean);
  const usable = recipes.filter((r) => r.ingredients.length > 0 && avoidedIn(r, opts.avoid).length === 0);

  const pool = new Map<MealSlot, PlannableRecipe[]>(MEAL_SLOTS.map((s) => [s, []]));
  for (const r of usable) for (const slot of slotsOf(r)) pool.get(slot)!.push(r);

  const score = (r: PlannableRecipe) => {
    const names = r.ingredients.map((i) => normalizeItem(ingredientName(i)));
    const inPantry = names.filter((n) => have.some((p) => n.includes(p) || p.includes(n))).length;
    return inPantry + likedIn(r, opts.likes).length * 2;
  };
  const scores = new Map(usable.map((r) => [r.id, score(r)]));

  const used = new Map<string, number>();
  const meals: RecipeMeal[] = [];
  const missing: RecipePlanResult['missing'] = [];

  for (let day = 0; day < 7; day++) {
    const today = new Set<string>();
    for (const slot of MEAL_SLOTS) {
      if (opts.taken?.has(`${day}-${slot}`)) continue;
      const candidates = (pool.get(slot) ?? []).filter((r) => !today.has(r.id));
      if (candidates.length === 0) {
        missing.push({ day, slot });
        continue;
      }
      const ranked = candidates.map((r) => ({
        r,
        rank: (used.get(r.id) ?? 0) * 100 - (scores.get(r.id) ?? 0) * 5 + random() * 4,
      }));
      const pick = ranked.reduce((best, c) => (c.rank < best.rank ? c : best)).r;
      used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
      today.add(pick.id);
      const ingredients = Array.from(
        new Set(
          pick.ingredients
            .map(ingredientName)
            .filter((n) => n && !SKIP.has(normalizeItem(n))),
        ),
      ).slice(0, 12);
      meals.push({ day, slot, title: pick.title, ingredients });
    }
  }
  return { meals, missing };
}
