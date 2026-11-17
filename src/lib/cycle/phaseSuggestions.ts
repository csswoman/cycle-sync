/**
 * Phase-based suggestions: which foods/recipes and habits fit the current cycle phase.
 *
 * The phase is a gentle starting point, not a rule. Evidence for phase-specific eating is limited;
 * what holds up best is replacing iron lost during the period, keeping blood sugar stable and
 * getting enough magnesium/complex carbs in the luteal phase, and fiber/antioxidants overall.
 * With PMOS the weekly pattern matters more than the phase, so these suggestions only re-rank.
 */

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
type Lang = 'es' | 'en';
type Text = Record<Lang, string>;

const PHASE_KEYS: Record<string, PhaseKey> = {
  menstrual: 'menstrual',
  follicular: 'follicular',
  folicular: 'follicular',
  ovulation: 'ovulation',
  ovulatory: 'ovulation',
  ovulatoria: 'ovulation',
  ovulacion: 'ovulation',
  luteal: 'luteal',
  lutea: 'luteal',
};

/** Accepts the CyclePhase enum value ("Follicular") or any es/en phase name. */
export function toPhaseKey(phase: string | null | undefined): PhaseKey {
  return PHASE_KEYS[normalize(phase ?? '').replace(/^fase\s+/, '')] ?? 'follicular';
}

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ�]/g, '').toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Food
// ---------------------------------------------------------------------------

interface FoodFocus {
  /** Nutrients to highlight in the UI. */
  nutrients: Text[];
  why: Text;
  /** Recipe tags (normalized) that fit the phase. */
  tags: string[];
  /** Ingredient stems, Spanish and English, matched as substrings of the normalized recipe text. */
  foods: { stem: string; label: Text }[];
}

const f = (stem: string, es: string, en: string) => ({ stem, label: { es, en } });

export const FOOD_FOCUS: Record<PhaseKey, FoodFocus> = {
  menstrual: {
    nutrients: [
      { es: 'Hierro', en: 'Iron' },
      { es: 'Vitamina C', en: 'Vitamin C' },
      { es: 'Omega 3', en: 'Omega 3' },
      { es: 'Comidas calientes', en: 'Warm meals' },
    ],
    why: {
      es: 'Repones el hierro que pierdes con el sangrado; la vitamina C ayuda a absorberlo y el omega 3 puede aliviar cólicos.',
      en: 'Replace the iron lost with bleeding; vitamin C helps absorb it and omega 3 may ease cramps.',
    },
    tags: ['hierro', 'iron', 'antiinflamatorio', 'antiinflamatoria', 'anti-inflammatory', 'omega 3', 'vitamina c', 'fase menstrual'],
    foods: [
      f('lenteja', 'lentejas', 'lentils'), f('lentil', 'lentejas', 'lentils'),
      f('garbanzo', 'garbanzos', 'chickpeas'), f('chickpea', 'garbanzos', 'chickpeas'),
      f('frijol', 'frijoles', 'beans'), f('bean', 'frijoles', 'beans'),
      f('espinaca', 'espinaca', 'spinach'), f('spinach', 'espinaca', 'spinach'),
      f('acelga', 'acelga', 'chard'), f('kale', 'kale', 'kale'),
      f('res', 'carne de res', 'beef'), f('ternera', 'ternera', 'beef'), f('beef', 'carne de res', 'beef'),
      f('salmon', 'salmón', 'salmon'), f('sardina', 'sardinas', 'sardines'), f('atun', 'atún', 'tuna'),
      f('jengibre', 'jengibre', 'ginger'), f('ginger', 'jengibre', 'ginger'),
      f('curcuma', 'cúrcuma', 'turmeric'), f('turmeric', 'cúrcuma', 'turmeric'),
      f('caldo', 'caldo', 'broth'), f('sopa', 'sopa', 'soup'), f('soup', 'sopa', 'soup'),
      f('naranja', 'naranja', 'orange'), f('kiwi', 'kiwi', 'kiwi'), f('pimiento', 'pimiento', 'bell pepper'),
      f('semillas de calabaza', 'semillas de calabaza', 'pumpkin seeds'), f('pumpkin seed', 'semillas de calabaza', 'pumpkin seeds'),
    ],
  },
  follicular: {
    nutrients: [
      { es: 'Proteína magra', en: 'Lean protein' },
      { es: 'Fermentados', en: 'Fermented foods' },
      { es: 'Fibra', en: 'Fiber' },
      { es: 'Granos integrales', en: 'Whole grains' },
    ],
    why: {
      es: 'Con la energía en subida, proteína y granos integrales apoyan el entrenamiento; fibra y fermentados cuidan tu digestión.',
      en: 'As energy rises, protein and whole grains support training; fiber and fermented foods support digestion.',
    },
    tags: ['fibra', 'fiber', 'digestion', 'digestiva', 'energia natural', 'ganar-musculo', 'proteina', 'fase folicular'],
    foods: [
      f('yogur', 'yogur', 'yogurt'), f('yogurt', 'yogur', 'yogurt'), f('kefir', 'kéfir', 'kefir'),
      f('kimchi', 'kimchi', 'kimchi'), f('chucrut', 'chucrut', 'sauerkraut'), f('sauerkraut', 'chucrut', 'sauerkraut'),
      f('pollo', 'pollo', 'chicken'), f('chicken', 'pollo', 'chicken'), f('pavo', 'pavo', 'turkey'), f('turkey', 'pavo', 'turkey'),
      f('huevo', 'huevo', 'eggs'), f('egg', 'huevo', 'eggs'),
      f('avena', 'avena', 'oats'), f('oat', 'avena', 'oats'), f('quinoa', 'quinoa', 'quinoa'),
      f('brocoli', 'brócoli', 'broccoli'), f('broccoli', 'brócoli', 'broccoli'),
      f('linaza', 'linaza', 'flaxseed'), f('flaxseed', 'linaza', 'flaxseed'),
      f('limon', 'limón', 'lemon'), f('lemon', 'limón', 'lemon'), f('zanahoria', 'zanahoria', 'carrot'),
    ],
  },
  ovulation: {
    nutrients: [
      { es: 'Antioxidantes', en: 'Antioxidants' },
      { es: 'Fibra', en: 'Fiber' },
      { es: 'Verduras crudas', en: 'Raw vegetables' },
      { es: 'Hidratación', en: 'Hydration' },
    ],
    why: {
      es: 'Es tu pico de energía: verduras, frutas y fibra acompañan el esfuerzo, y la hidratación sostiene el rendimiento.',
      en: 'Peak energy: vegetables, fruit and fiber back up the effort, and hydration supports performance.',
    },
    tags: ['antioxidante', 'antioxidantes', 'antioxidant', 'fibra', 'fiber', 'hidratacion', 'vitamina c', 'fase ovulatoria'],
    foods: [
      f('fresa', 'fresas', 'strawberries'), f('strawberr', 'fresas', 'strawberries'),
      f('arandano', 'arándanos', 'blueberries'), f('blueberr', 'arándanos', 'blueberries'),
      f('frambuesa', 'frambuesas', 'raspberries'), f('raspberr', 'frambuesas', 'raspberries'), f('mora', 'moras', 'blackberries'),
      f('espinaca', 'espinaca', 'spinach'), f('spinach', 'espinaca', 'spinach'),
      f('quinoa', 'quinoa', 'quinoa'), f('tomate', 'tomate', 'tomato'), f('tomato', 'tomate', 'tomato'),
      f('pepino', 'pepino', 'cucumber'), f('cucumber', 'pepino', 'cucumber'),
      f('sandia', 'sandía', 'watermelon'), f('watermelon', 'sandía', 'watermelon'),
      f('kiwi', 'kiwi', 'kiwi'), f('pimiento', 'pimiento', 'bell pepper'),
      f('brocoli', 'brócoli', 'broccoli'), f('ensalada', 'ensalada', 'salad'), f('salad', 'ensalada', 'salad'),
    ],
  },
  luteal: {
    nutrients: [
      { es: 'Magnesio', en: 'Magnesium' },
      { es: 'Carbohidratos complejos', en: 'Complex carbs' },
      { es: 'Vitamina B6', en: 'Vitamin B6' },
      { es: 'Índice glucémico bajo', en: 'Low glycemic index' },
    ],
    why: {
      es: 'La progesterona sube el apetito: carbohidratos complejos y magnesio ayudan a estabilizar el azúcar, los antojos y el ánimo.',
      en: 'Progesterone raises appetite: complex carbs and magnesium help steady blood sugar, cravings and mood.',
    },
    tags: ['magnesio', 'magnesium', 'bajo ig', 'low gi', 'fibra', 'fiber', 'salud cardiovascular', 'fase lutea', 'seed cycling'],
    foods: [
      f('camote', 'camote', 'sweet potato'), f('batata', 'batata', 'sweet potato'), f('sweet potato', 'camote', 'sweet potato'),
      f('avena', 'avena', 'oats'), f('oat', 'avena', 'oats'),
      f('arroz integral', 'arroz integral', 'brown rice'), f('brown rice', 'arroz integral', 'brown rice'),
      f('cacao', 'cacao', 'cacao'), f('chocolate', 'chocolate oscuro', 'dark chocolate'),
      f('nuez', 'nueces', 'walnuts'), f('nueces', 'nueces', 'walnuts'), f('walnut', 'nueces', 'walnuts'), f('almendra', 'almendras', 'almonds'), f('almond', 'almendras', 'almonds'),
      f('girasol', 'semillas de girasol', 'sunflower seeds'), f('sunflower', 'semillas de girasol', 'sunflower seeds'),
      f('ajonjoli', 'ajonjolí', 'sesame'), f('sesamo', 'sésamo', 'sesame'), f('sesame', 'sésamo', 'sesame'),
      f('platano', 'plátano', 'banana'), f('banana', 'plátano', 'banana'),
      f('garbanzo', 'garbanzos', 'chickpeas'), f('aguacate', 'aguacate', 'avocado'), f('avocado', 'aguacate', 'avocado'),
      f('pavo', 'pavo', 'turkey'), f('calabaza', 'calabaza', 'squash'),
    ],
  },
};

interface RecipeLike {
  title: string;
  description?: string;
  ingredients: string[];
  tags: string[];
  myTags?: string[];
  isFavorite?: boolean;
}

export interface RecipeMatch<R> {
  recipe: R;
  score: number;
  /** Short, de-duplicated reasons in the requested language (matched tags/foods). */
  reasons: string[];
}

/**
 * Whole-word match allowing plural endings, so "res" does not hit "fresas", "oat" does not hit
 * "goat" and "mora" does not hit "morada", while "lenteja" still matches "lentejas".
 */
function hasStem(text: string, stem: string): boolean {
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${escaped}(s|es|y|ies)?([^a-z]|$)`).test(text);
}

export function scoreRecipeForPhase<R extends RecipeLike>(recipe: R, phase: PhaseKey, lang: Lang): RecipeMatch<R> {
  const focus = FOOD_FOCUS[phase];
  const tags = [...recipe.tags, ...(recipe.myTags ?? [])].map(normalize);
  const ingredientText = normalize([recipe.title, ...recipe.ingredients].join(' | '));
  let score = 0;
  const reasons: string[] = [];

  const phaseTag = `fase ${phase === 'ovulation' ? 'ovulatoria' : phase === 'luteal' ? 'lutea' : phase === 'follicular' ? 'folicular' : 'menstrual'}`;
  const otherPhaseTags = ['fase menstrual', 'fase folicular', 'fase ovulatoria', 'fase lutea'].filter((t) => t !== phaseTag);
  if (tags.includes(phaseTag)) score += 4;
  if (tags.some((t) => otherPhaseTags.includes(t)) && !tags.includes(phaseTag)) score -= 2;

  for (const tag of focus.tags) {
    if (tag.startsWith('fase ')) continue;
    if (tags.includes(tag)) {
      score += 2;
      const original = [...recipe.tags, ...(recipe.myTags ?? [])].find((t) => normalize(t) === tag);
      if (original) reasons.push(original.toLowerCase());
    }
  }

  const seen = new Set<string>();
  for (const food of focus.foods) {
    const label = food.label[lang];
    if (seen.has(label)) continue;
    if (hasStem(ingredientText, food.stem)) {
      seen.add(label);
      score += 1.5;
      reasons.push(label);
    }
  }

  // Desserts and juices can fit, but full meals should come first.
  if (tags.includes('postre') || tags.includes('dessert')) score -= 1;
  if (recipe.isFavorite && score > 0) score += 0.5;

  return { recipe, score, reasons: Array.from(new Set(reasons)).slice(0, 3) };
}

/** Best recipes for the phase, highest score first; recipes with no match are left out. */
export function rankRecipesForPhase<R extends RecipeLike>(recipes: R[], phase: PhaseKey, lang: Lang, limit = 6): RecipeMatch<R>[] {
  return recipes
    .map((r) => scoreRecipeForPhase(r, phase, lang))
    .filter((m) => m.score >= 2)
    .sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export interface PhaseHabit {
  id: string;
  icon: string;
  name: Text;
  goal: number;
  unit: Text;
  why: Text;
}

const h = (id: string, icon: string, es: string, en: string, goal: number, unitEs: string, unitEn: string, whyEs: string, whyEn: string): PhaseHabit => ({
  id, icon, name: { es, en }, goal, unit: { es: unitEs, en: unitEn }, why: { es: whyEs, en: whyEn },
});

export const PHASE_HABITS: Record<PhaseKey, PhaseHabit[]> = {
  menstrual: [
    h('warmth', 'local_fire_department', 'Calor en el vientre', 'Heat on your belly', 1, 'vez', 'time',
      'Una bolsa de agua caliente alivia los cólicos tanto como algunos analgésicos.',
      'A hot water bottle eases cramps about as well as some pain relievers.'),
    h('iron-meal', 'restaurant', 'Comida con hierro + vitamina C', 'Iron + vitamin C meal', 1, 'vez', 'time',
      'Repone el hierro que pierdes en la regla.', 'Replaces the iron lost during your period.'),
    h('gentle-walk', 'directions_walk', 'Caminata suave', 'Gentle walk', 20, 'minutos', 'minutes',
      'El movimiento suave mejora el flujo sanguíneo y puede reducir el dolor.', 'Gentle movement improves blood flow and may reduce pain.'),
  ],
  follicular: [
    h('strength', 'fitness_center', 'Entrenamiento de fuerza', 'Strength training', 30, 'minutos', 'minutes',
      'Buen momento para subir cargas y probar ejercicios nuevos.', 'A good window to add load and try new exercises.'),
    h('fermented', 'nutrition', 'Una porción de fermentados', 'One serving of fermented food', 1, 'porción', 'serving',
      'Yogur, kéfir o kimchi apoyan tu microbiota.', 'Yogurt, kefir or kimchi support your gut.'),
    h('plan-week', 'edit_calendar', 'Planear la semana', 'Plan your week', 1, 'vez', 'time',
      'Con la energía en subida es más fácil arrancar proyectos.', 'Rising energy makes it easier to start projects.'),
  ],
  ovulation: [
    h('veggies', 'nutrition', 'Porciones de fruta y verdura', 'Fruit and veg servings', 5, 'porciones', 'servings',
      'Fibra y antioxidantes para tu semana de más energía.', 'Fiber and antioxidants for your highest-energy days.'),
    h('warmup', 'self_improvement', 'Calentar antes de entrenar', 'Warm up before training', 10, 'minutos', 'minutes',
      'Con estrógeno alto los ligamentos son más laxos: calentar protege tus rodillas.', 'High estrogen loosens ligaments: warming up protects your knees.'),
    h('connect', 'chat', 'Plan social o conversación pendiente', 'Social plan or pending talk', 1, 'vez', 'time',
      'Suele ser cuando te sientes más comunicativa.', 'This is often when you feel most outgoing.'),
  ],
  luteal: [
    h('magnesium-snack', 'spa', 'Snack con magnesio', 'Magnesium snack', 1, 'vez', 'time',
      'Nueces, semillas o cacao ayudan con antojos e hinchazón.', 'Nuts, seeds or cacao help with cravings and bloating.'),
    h('screens-off', 'bedtime', 'Pantallas fuera antes de dormir', 'Screens off before bed', 30, 'minutos', 'minutes',
      'La progesterona altera el sueño; una rutina tranquila ayuda.', 'Progesterone can disturb sleep; a calm routine helps.'),
    h('mood-journal', 'edit_note', 'Diario de ánimo', 'Mood journal', 1, 'vez', 'time',
      'Anotar cómo te sientes te ayuda a reconocer el SPM.', 'Writing down how you feel helps you spot PMS.'),
  ],
};

/** Phase habit suggestions the user has not added yet (matched by name in either language). */
export function pendingPhaseHabits(phase: PhaseKey, existingNames: string[]): PhaseHabit[] {
  const existing = new Set(existingNames.map(normalize));
  return PHASE_HABITS[phase].filter((s) => !existing.has(normalize(s.name.es)) && !existing.has(normalize(s.name.en)));
}
