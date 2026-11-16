// Pure helpers for the user's food tastes: which foods she likes, which she avoids,
// and how to match them against recipes. No imports so the API route and tests can use them.

export type FoodCategory = 'protein' | 'legume' | 'dairy' | 'vegetable' | 'fruit' | 'grain' | 'nutSeed' | 'dish';

export interface CatalogFood {
  id: string;
  es: string;
  en: string;
  category: FoodCategory;
  /** Words that identify the food inside a recipe (any language, no accents needed). */
  keywords: string[];
}

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, { es: string; en: string }> = {
  protein: { es: 'Proteínas', en: 'Proteins' },
  legume: { es: 'Legumbres', en: 'Legumes' },
  dairy: { es: 'Lácteos', en: 'Dairy' },
  vegetable: { es: 'Verduras', en: 'Vegetables' },
  fruit: { es: 'Frutas', en: 'Fruits' },
  grain: { es: 'Cereales y tubérculos', en: 'Grains & starches' },
  nutSeed: { es: 'Frutos secos y semillas', en: 'Nuts & seeds' },
  dish: { es: 'Platos típicos', en: 'Typical dishes' },
};

export const FOOD_CATEGORIES = Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[];

export const FOOD_CATALOG: CatalogFood[] = [
  { id: 'pollo', es: 'Pollo', en: 'Chicken', category: 'protein', keywords: ['pollo', 'pechuga', 'chicken'] },
  { id: 'res', es: 'Carne de res', en: 'Beef', category: 'protein', keywords: ['res', 'ternera', 'beef', 'steak'] },
  { id: 'cerdo', es: 'Cerdo', en: 'Pork', category: 'protein', keywords: ['cerdo', 'pork', 'jamon', 'tocino', 'bacon'] },
  {
    id: 'pescado',
    es: 'Pescado',
    en: 'Fish',
    category: 'protein',
    keywords: ['pescado', 'salmon', 'atun', 'sardina', 'trucha', 'bacalao', 'merluza', 'tilapia', 'caballa', 'anchoa', 'fish', 'tuna', 'cod', 'sardine', 'mackerel', 'trout'],
  },
  {
    id: 'mariscos',
    es: 'Mariscos',
    en: 'Seafood',
    category: 'protein',
    keywords: ['marisco', 'camaron', 'langostino', 'pulpo', 'calamar', 'mejillon', 'shrimp', 'prawn', 'squid', 'mussel', 'seafood'],
  },
  { id: 'huevo', es: 'Huevo', en: 'Eggs', category: 'protein', keywords: ['huevo', 'egg', 'omelette'] },
  { id: 'tofu', es: 'Tofu / tempeh', en: 'Tofu / tempeh', category: 'protein', keywords: ['tofu', 'tempeh', 'seitan'] },

  { id: 'lentejas', es: 'Lentejas', en: 'Lentils', category: 'legume', keywords: ['lenteja', 'lentil'] },
  { id: 'garbanzos', es: 'Garbanzos', en: 'Chickpeas', category: 'legume', keywords: ['garbanzo', 'chickpea', 'hummus', 'humus'] },
  { id: 'frijoles', es: 'Frijoles', en: 'Beans', category: 'legume', keywords: ['frijol', 'poroto', 'judia', 'habichuela', 'bean'] },

  { id: 'yogur', es: 'Yogur', en: 'Yogurt', category: 'dairy', keywords: ['yogur', 'yogurt', 'kefir'] },
  { id: 'queso', es: 'Queso', en: 'Cheese', category: 'dairy', keywords: ['queso', 'cheese', 'ricota', 'ricotta', 'feta'] },

  { id: 'espinaca', es: 'Espinaca', en: 'Spinach', category: 'vegetable', keywords: ['espinaca', 'spinach'] },
  { id: 'brocoli', es: 'Brócoli', en: 'Broccoli', category: 'vegetable', keywords: ['brocoli', 'broccoli'] },
  { id: 'coliflor', es: 'Coliflor', en: 'Cauliflower', category: 'vegetable', keywords: ['coliflor', 'cauliflower'] },
  { id: 'kale', es: 'Kale / col rizada', en: 'Kale', category: 'vegetable', keywords: ['kale', 'col rizada', 'berza'] },
  { id: 'zanahoria', es: 'Zanahoria', en: 'Carrot', category: 'vegetable', keywords: ['zanahoria', 'carrot'] },
  { id: 'tomate', es: 'Tomate', en: 'Tomato', category: 'vegetable', keywords: ['tomate', 'tomato'] },
  { id: 'cebolla', es: 'Cebolla', en: 'Onion', category: 'vegetable', keywords: ['cebolla', 'onion', 'puerro'] },
  { id: 'calabacin', es: 'Calabacín', en: 'Zucchini', category: 'vegetable', keywords: ['calabacin', 'zucchini', 'courgette'] },
  { id: 'berenjena', es: 'Berenjena', en: 'Eggplant', category: 'vegetable', keywords: ['berenjena', 'eggplant', 'aubergine'] },
  { id: 'champinones', es: 'Champiñones', en: 'Mushrooms', category: 'vegetable', keywords: ['champinon', 'hongo', 'seta', 'mushroom'] },
  { id: 'aguacate', es: 'Aguacate', en: 'Avocado', category: 'vegetable', keywords: ['aguacate', 'palta', 'avocado'] },
  { id: 'remolacha', es: 'Remolacha', en: 'Beetroot', category: 'vegetable', keywords: ['remolacha', 'betabel', 'beet'] },

  { id: 'banano', es: 'Banano', en: 'Banana', category: 'fruit', keywords: ['banano', 'banana', 'platano', 'guineo'] },
  { id: 'manzana', es: 'Manzana', en: 'Apple', category: 'fruit', keywords: ['manzana', 'apple'] },
  { id: 'frutos-rojos', es: 'Frutos rojos', en: 'Berries', category: 'fruit', keywords: ['fresa', 'arandano', 'frambuesa', 'mora', 'berry', 'berries', 'strawberry', 'blueberry', 'raspberry'] },
  { id: 'mango', es: 'Mango', en: 'Mango', category: 'fruit', keywords: ['mango'] },
  { id: 'citricos', es: 'Cítricos', en: 'Citrus', category: 'fruit', keywords: ['naranja', 'mandarina', 'toronja', 'orange', 'grapefruit', 'tangerine'] },
  { id: 'papaya-pina', es: 'Papaya y piña', en: 'Papaya & pineapple', category: 'fruit', keywords: ['papaya', 'pina', 'pineapple'] },

  { id: 'avena', es: 'Avena', en: 'Oats', category: 'grain', keywords: ['avena', 'oat', 'oats', 'oatmeal'] },
  { id: 'arroz', es: 'Arroz', en: 'Rice', category: 'grain', keywords: ['arroz', 'rice'] },
  { id: 'quinoa', es: 'Quinoa', en: 'Quinoa', category: 'grain', keywords: ['quinoa', 'quinua'] },
  { id: 'papa-camote', es: 'Papa / camote', en: 'Potato / sweet potato', category: 'grain', keywords: ['papa', 'patata', 'camote', 'batata', 'potato'] },
  { id: 'pan', es: 'Pan / pasta', en: 'Bread / pasta', category: 'grain', keywords: ['pan', 'pasta', 'tostada', 'bread', 'toast', 'espagueti', 'spaghetti', 'tortilla de trigo'] },

  { id: 'almendras', es: 'Almendras', en: 'Almonds', category: 'nutSeed', keywords: ['almendra', 'almond'] },
  { id: 'nueces', es: 'Nueces', en: 'Walnuts', category: 'nutSeed', keywords: ['nuez', 'nueces', 'walnut'] },
  { id: 'chia', es: 'Chía', en: 'Chia seeds', category: 'nutSeed', keywords: ['chia'] },
  { id: 'linaza', es: 'Linaza', en: 'Flaxseed', category: 'nutSeed', keywords: ['linaza', 'lino', 'flax', 'flaxseed'] },
  { id: 'semillas-calabaza', es: 'Semillas de calabaza', en: 'Pumpkin seeds', category: 'nutSeed', keywords: ['pepita', 'semillas de calabaza', 'pumpkin seed'] },
  { id: 'mani', es: 'Maní', en: 'Peanuts', category: 'nutSeed', keywords: ['mani', 'cacahuate', 'cacahuete', 'peanut'] },
  { id: 'cacao', es: 'Cacao / chocolate negro', en: 'Cacao / dark chocolate', category: 'nutSeed', keywords: ['cacao', 'chocolate', 'cocoa'] },

  { id: 'arepa', es: 'Arepa', en: 'Arepa', category: 'dish', keywords: ['arepa'] },
  { id: 'cachapa', es: 'Cachapa', en: 'Cachapa', category: 'dish', keywords: ['cachapa'] },
  { id: 'empanada', es: 'Empanada', en: 'Empanada', category: 'dish', keywords: ['empanada'] },
  { id: 'tequenos', es: 'Tequeños', en: 'Tequeños', category: 'dish', keywords: ['tequeno'] },
  { id: 'patacon', es: 'Patacón / tostones', en: 'Patacón / tostones', category: 'dish', keywords: ['patacon', 'tostone'] },
  { id: 'pabellon', es: 'Pabellón criollo', en: 'Pabellón criollo', category: 'dish', keywords: ['pabellon'] },
  { id: 'taco', es: 'Tacos', en: 'Tacos', category: 'dish', keywords: ['taco'] },
  { id: 'pizza', es: 'Pizza', en: 'Pizza', category: 'dish', keywords: ['pizza'] },
  { id: 'hamburguesa', es: 'Hamburguesa', en: 'Burger', category: 'dish', keywords: ['hamburguesa', 'burger', 'hamburger'] },
  { id: 'panqueques', es: 'Panqueques', en: 'Pancakes', category: 'dish', keywords: ['panqueque', 'pancake', 'hotcake', 'crepe'] },
];

const CATALOG_BY_ID = new Map(FOOD_CATALOG.map((f) => [f.id, f]));

export const getCatalogFood = (id: string): CatalogFood | undefined => CATALOG_BY_ID.get(id);

export type SunExposure = 'daily' | 'sometimes' | 'rarely';
export type ActivityLevel = 'sedentary' | 'light' | 'active';

export interface FoodPreferences {
  /** Catalog ids or free text the user likes / eats. */
  likes: string[];
  /** Catalog ids or free text the user wants to avoid. */
  avoid: string[];
  sun: SunExposure | null;
  activity: ActivityLevel | null;
}

export const EMPTY_FOOD_PREFERENCES: FoodPreferences = { likes: [], avoid: [], sun: null, activity: null };

/** Display name of an entry: the catalog name, or the free text as typed. */
export function foodLabel(entry: string, language: 'es' | 'en'): string {
  const food = CATALOG_BY_ID.get(entry);
  return food ? food[language] : entry;
}

// ---------------------------------------------------------------------------
// Text matching
// ---------------------------------------------------------------------------

const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const tokenize = (s: string): string[] => plain(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

/** Singular/plural spellings of a word, so "tomates" matches "tomate" and "limones" matches "limon". */
function variants(word: string): string[] {
  const out = [word];
  if (word.length > 3 && word.endsWith('s')) out.push(word.slice(0, -1));
  if (word.length > 4 && word.endsWith('es')) out.push(word.slice(0, -2));
  return out;
}

function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  const va = variants(a);
  const vb = variants(b);
  return va.some((x) => vb.includes(x));
}

/** True when every word of `phrase` appears (singular or plural) among `words`. */
function containsPhrase(words: string[], phrase: string): boolean {
  const needed = tokenize(phrase);
  if (needed.length === 0) return false;
  return needed.every((n) => words.some((w) => sameWord(w, n)));
}

export interface RecipeText {
  title: string;
  description?: string;
  ingredients: string[];
  steps?: string[];
}

/**
 * Does the recipe contain this entry?
 * Catalog foods and single-word text look at the title and ingredients.
 * Multi-word free text such as "pescado hervido" also looks at the steps, because the
 * cooking method usually lives there.
 */
export function recipeHasFood(recipe: RecipeText, entry: string): boolean {
  const base = tokenize([recipe.title, ...recipe.ingredients].join(' '));
  const food = CATALOG_BY_ID.get(entry);
  if (food) return food.keywords.some((k) => containsPhrase(base, k));
  if (tokenize(entry).length <= 1) return containsPhrase(base, entry);
  const full = tokenize([recipe.title, recipe.description ?? '', ...recipe.ingredients, ...(recipe.steps ?? [])].join(' '));
  return containsPhrase(full, entry);
}

/** The avoided entries this recipe contains. */
export function avoidedIn(recipe: RecipeText, avoid: string[]): string[] {
  return avoid.filter((a) => recipeHasFood(recipe, a));
}

/** The liked entries this recipe contains. */
export function likedIn(recipe: RecipeText, likes: string[]): string[] {
  return likes.filter((l) => recipeHasFood(recipe, l));
}

/** Names to send to the AI: catalog entries become their name in the recipe language. */
export function entriesToNames(entries: string[], language: 'es' | 'en'): string[] {
  return entries.map((e) => foodLabel(e, language));
}

// ---------------------------------------------------------------------------
// State helpers and persistence
// ---------------------------------------------------------------------------

export type FoodState = 'like' | 'avoid' | 'none';

export function foodState(prefs: FoodPreferences, entry: string): FoodState {
  if (prefs.likes.includes(entry)) return 'like';
  if (prefs.avoid.includes(entry)) return 'avoid';
  return 'none';
}

/** Puts an entry in exactly one state. */
export function setFoodState(prefs: FoodPreferences, entry: string, state: FoodState): FoodPreferences {
  const likes = prefs.likes.filter((e) => e !== entry);
  const avoid = prefs.avoid.filter((e) => e !== entry);
  if (state === 'like') likes.push(entry);
  if (state === 'avoid') avoid.push(entry);
  return { ...prefs, likes, avoid };
}

/** Tap order for a chip: none -> like -> avoid -> none. */
export function nextFoodState(state: FoodState): FoodState {
  return state === 'none' ? 'like' : state === 'like' ? 'avoid' : 'none';
}

export const FOOD_PREFERENCES_STORAGE_KEY = 'cycle_sync_food_preferences';

const SUN: SunExposure[] = ['daily', 'sometimes', 'rarely'];
const ACTIVITY: ActivityLevel[] = ['sedentary', 'light', 'active'];

const cleanList = (v: unknown): string[] =>
  Array.isArray(v)
    ? Array.from(new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, 40)).filter(Boolean))).slice(0, 100)
    : [];

/** Reads untrusted JSON (localStorage) into a valid FoodPreferences. */
export function parseFoodPreferences(raw: unknown): FoodPreferences {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const likes = cleanList(obj.likes);
  const avoid = cleanList(obj.avoid).filter((a) => !likes.includes(a));
  return {
    likes,
    avoid,
    sun: SUN.includes(obj.sun as SunExposure) ? (obj.sun as SunExposure) : null,
    activity: ACTIVITY.includes(obj.activity as ActivityLevel) ? (obj.activity as ActivityLevel) : null,
  };
}
