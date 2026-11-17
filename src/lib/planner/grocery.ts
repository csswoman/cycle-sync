export interface GroceryItem {
  key: string;
  label: string;
  /** How many planned meals use it. */
  count: number;
}

export const normalizeItem = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Items that should never appear on a supermarket shopping list (tap water, ice, basic salt & pepper). */
const SKIP_ITEMS = new Set([
  'agua',
  'agua tibia',
  'agua fria',
  'agua caliente',
  'agua templada',
  'agua del grifo',
  'agua fresca',
  'hielo',
  'cubos de hielo',
  'cubitos de hielo',
  'abundante hielo',
  'sal',
  'sal marina',
  'sal fina',
  'sal gruesa',
  'sal al gusto',
  'pimienta',
  'pimienta negra',
  'pimienta al gusto',
  'sal y pimienta',
  'sal y pimienta al gusto',
  'water',
  'warm water',
  'cold water',
  'hot water',
  'ice',
  'salt',
  'pepper',
]);

export function isSkippedIngredient(raw: string): boolean {
  const norm = normalizeItem(raw);
  if (!norm) return true;
  if (SKIP_ITEMS.has(norm)) return true;
  // If starts with "agua" but not "agua de coco", "agua mineral" or false friends like "aguacate", "aguaymanto"
  if (/^agua\b/.test(norm) && !norm.includes('coco') && !norm.includes('mineral') && !norm.includes('gas')) {
    return true;
  }
  if (/^hielo\b/.test(norm)) return true;
  if (/^sal\b/.test(norm) && (norm.includes('pimienta') || norm.includes('marina') || norm.includes('gusto'))) {
    return true;
  }
  return false;
}

/** Known Spanish plurals mapped directly to their true singular forms. */
export const KNOWN_SINGULARS: Record<string, string> = {
  tomates: 'tomate',
  aguacates: 'aguacate',
  chocolates: 'chocolate',
  cacahuetes: 'cacahuete',
  dientes: 'diente',
  aceites: 'aceite',
  brotes: 'brote',
  guisantes: 'guisante',
  huevos: 'huevo',
  claras: 'clara',
  yemas: 'yema',
  cebollas: 'cebolla',
  zanahorias: 'zanahoria',
  limones: 'limon',
  papas: 'papa',
  patatas: 'patata',
  platanos: 'platano',
  bananas: 'banana',
  bananos: 'banano',
  manzanas: 'manzana',
  naranjas: 'naranja',
  fresas: 'fresa',
  arandanos: 'arandano',
  almendras: 'almendra',
  avellanas: 'avellana',
  nueces: 'nuez',
  pasas: 'pasa',
  champinones: 'champinon',
  hongos: 'hongo',
  frijoles: 'frijol',
  garbanzos: 'garbanzo',
  lentejas: 'lenteja',
  aceitunas: 'aceituna',
  espinacas: 'espinaca',
  camarones: 'camaron',
  gambas: 'gamba',
  fideos: 'fideo',
  arvejas: 'arveja',
  semillas: 'semilla',
  pepinos: 'pepino',
  pimientos: 'pimiento',
  quesos: 'queso',
  filetes: 'filete',
  rodajas: 'rodaja',
  trozos: 'trozo',
};

/** Accurate Spanish singularization */
export function toSingularWord(word: string): string {
  const norm = normalizeItem(word);
  if (norm.length <= 3) return norm;
  if (KNOWN_SINGULARS[norm]) return KNOWN_SINGULARS[norm];
  if (norm.endsWith('ces') && norm.length > 4) {
    return norm.slice(0, -3) + 'z';
  }
  if (norm.endsWith('es')) {
    const stem = norm.slice(0, -2);
    if (stem.endsWith('tomat') || stem.endsWith('aguacat') || stem.endsWith('chocolat')) {
      return stem + 'e';
    }
    return stem;
  }
  if (norm.endsWith('s') && /[aeiou]s$/i.test(norm)) {
    return norm.slice(0, -1);
  }
  return norm;
}

/** Metric & kitchen measure words to strip */
const MEASURE_WORDS = new Set([
  'g', 'gr', 'grs', 'gramo', 'gramos', 'kg', 'kilo', 'kilos', 'ml', 'l', 'lt', 'litro', 'litros',
  'taza', 'tazas', 'cucharada', 'cucharadas', 'cda', 'cdas', 'cucharadita', 'cucharaditas', 'cdta', 'cdtas',
  'pizca', 'pizcas', 'diente', 'dientes', 'lata', 'latas', 'rebanada', 'rebanadas', 'lonja', 'lonjas',
  'loncha', 'lonchas', 'punado', 'punados', 'puñado', 'puñados', 'unidad', 'unidades', 'unid', 'ud', 'uds', 'u',
  'pieza', 'piezas', 'rama', 'ramas', 'ramita', 'ramitas', 'hoja', 'hojas', 'rodaja', 'rodajas', 'trozo', 'trozos',
  'gajo', 'gajos', 'mitad', 'mitades', 'porcion', 'porciones', 'paquete', 'paquetes', 'pote', 'potes', 'bote', 'botes',
  'manojo', 'manojos', 'atado', 'atados', 'cabeza', 'cabezas', 'pulpa', 'chorro', 'chorrito', 'gota', 'gotas',
  'vaso', 'vasos', 'copa', 'copas', 'filete', 'filetes', 'cubito', 'cubitos', 'bloque', 'bloques', 'sobre', 'sobres',
  'tira', 'tiras', 'jugo', 'zumo', 'ralladura', 'cascara', 'cascaras',
  'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'lbs', 'clove', 'cloves', 'slice', 'slices', 'pinch', 'can', 'cans',
]);

/** Cooking, cutting, state adjectives that do not change what you buy */
const PREP_WORDS = new Set([
  'picado', 'picada', 'picados', 'picadas', 'rallado', 'rallada', 'ralladas', 'rallados',
  'cortado', 'cortada', 'cortados', 'cortadas', 'troceado', 'troceada', 'troceados', 'troceadas',
  'triturado', 'triturada', 'trituradas', 'triturados', 'licuado', 'licuada',
  'cocido', 'cocida', 'cocidos', 'cocidas', 'crudo', 'cruda', 'crudos', 'crudas',
  'fresco', 'fresca', 'frescos', 'frescas', 'finamente', 'fino', 'fina', 'finos', 'finas',
  'grueso', 'gruesa', 'pequeno', 'pequena', 'pequenos', 'pequenas', 'pequeno/a',
  'mediano', 'mediana', 'medianos', 'medianas', 'grande', 'grandes',
  'maduro', 'madura', 'maduros', 'maduras', 'entero', 'entera', 'enteros', 'enteras',
  'pelado', 'pelada', 'peladas', 'pelados', 'lavado', 'lavada', 'lavados', 'lavadas',
  'batido', 'batida', 'salteado', 'salteada', 'pochado', 'pochada', 'machacado', 'machacada',
  'molido', 'molida', 'molidos', 'molidas', 'desmenuzado', 'desmenuzada', 'desmenuzados', 'desmenuzadas',
  'rebanado', 'rebanada', 'laminado', 'laminada', 'laminados', 'laminadas',
  'hervido', 'hervida', 'asado', 'asada', 'asados', 'asadas', 'tostado', 'tostada', 'tostados', 'tostadas',
  'congelado', 'congelada', 'descongelado', 'descongelada', 'escurrido', 'escurrida',
  'fileteado', 'fileteada', 'suavemente', 'ligeramente', 'deshilachado', 'deshilachada', 'desmechado', 'desmechada',
  'magro', 'magra', 'descremado', 'descremada', 'semidescremado', 'bajo', 'baja',
  'limpio', 'limpios', 'limpia', 'limpias', 'suave', 'suaves',
  'chopped', 'diced', 'sliced', 'grated', 'minced', 'fresh', 'ripe', 'large', 'small', 'medium', 'cooked', 'raw', 'whole', 'peeled',
]);

const CUT_AT = / (?:en|para|al|a|con|sin|o|y|u|segun|según|aprox\.?|aproximadamente)(?= |$)/i;

/**
 * Shopping-list name of an ingredient:
 * "1 tomate", "2 tomates picados", "500g de tomates", "tomates en rodajas" all become "Tomate".
 * "30g de queso fresco", "1/2 taza de queso rallado", "queso" become "Queso".
 * "aceite de oliva extra virgen", "aceite vegetal" become "Aceite".
 * Returns empty string for skipped non-shopping items (e.g. agua tibia, hielo).
 */
export function groceryLabel(raw: string): string {
  if (isSkippedIngredient(raw)) return '';

  let s = raw.replace(/\(.*?\)/g, ' ').trim();
  // Separate glued numbers: "500g" -> "500 g", "250ml" -> "250 ml", "30g" -> "30 g"
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/g, '$1 $2');
  // Strip numbers and fractions
  s = s.replace(/(^|\s)[\d.,/½¼¾⅓⅔-]+(?=\s|$)/g, ' ');
  // Split at semicolons, commas, or colons
  s = s.split(/[,;:]/)[0];

  // Protect multi-word staples from being chopped by CUT_AT
  if (/polvo\s+(?:para|de)\s+hornear/i.test(s)) {
    return 'Polvo de hornear';
  }
  if (/leche\s+(?:en\s+polvo|de\s+\w+)/i.test(s)) {
    const m = s.match(/leche\s+(?:en\s+polvo|de\s+[a-zA-Z]+)/i);
    if (m) return m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase();
  }

  const cut = s.search(CUT_AT);
  if (cut > 0) s = s.slice(0, cut);

  let words = s.trim().split(/\s+/).filter(Boolean);

  // Strip leading measure words and prepositions/articles
  while (words.length > 0) {
    const first = normalizeItem(words[0]);
    if (MEASURE_WORDS.has(first)) {
      words.shift();
      if (words.length > 0 && ['de', 'del', 'of'].includes(words[0].toLowerCase())) {
        words.shift();
      }
    } else if (['de', 'del', 'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las'].includes(first)) {
      words.shift();
    } else {
      break;
    }
  }

  // Strip trailing prep/size words
  while (words.length > 1) {
    const last = normalizeItem(words[words.length - 1]);
    if (PREP_WORDS.has(last)) {
      words.pop();
    } else {
      break;
    }
  }

  let text = words.join(' ').trim();
  if (!text) return isSkippedIngredient(raw) ? '' : raw.trim();

  // Canonical consolidation for common staples
  const norm = normalizeItem(text);
  if (/^aceite\b/.test(norm)) {
    text = 'aceite';
  } else if (/^tomate\b|^tomates\b/.test(norm)) {
    text = norm.includes('cherry') ? 'tomate cherry' : 'tomate';
  } else if (/^queso\b/.test(norm)) {
    if (norm.includes('feta')) text = 'queso feta';
    else if (norm.includes('cottage') || norm.includes('requeson')) text = 'queso cottage';
    else if (norm.includes('mozzarella')) text = 'queso mozzarella';
    else if (norm.includes('cheddar')) text = 'queso cheddar';
    else if (norm.includes('parmesano')) text = 'queso parmesano';
    else if (norm.includes('ricotta')) text = 'queso ricotta';
    else text = 'queso';
  } else if (/^cebolla\b/.test(norm)) {
    text = norm.includes('roja') || norm.includes('morada') ? 'cebolla roja' : 'cebolla';
  } else if (/^pimiento\b/.test(norm)) {
    text = norm.includes('verde') ? 'pimiento verde' : 'pimiento rojo';
  } else if (/^pechuga\b/.test(norm)) {
    text = 'pechuga de pollo';
  } else if (/^zanahoria\b|^zanahorias\b/.test(norm)) {
    text = 'zanahoria';
  }

  if (isSkippedIngredient(text)) return '';

  let formatted = text.charAt(0).toUpperCase() + text.slice(1);
  if (formatted === 'Limon') formatted = 'Limón';
  else if (formatted === 'Platano') formatted = 'Plátano';
  else if (formatted === 'Arandano') formatted = 'Arándano';
  else if (formatted === 'Azucar') formatted = 'Azúcar';
  return formatted;
}

/** Merge key: accent-free, lower case, singular words merged so "tomates" meets "tomate". */
export const groceryKey = (label: string): string =>
  normalizeItem(label)
    .split(' ')
    .map((w) => toSingularWord(w))
    .join(' ');

/**
 * Builds the shopping list from the ingredients of the planned meals.
 * Items repeated across meals are merged; items already in the pantry are left out.
 */
export function buildGroceryList(mealIngredients: string[][], pantry: string[]): GroceryItem[] {
  const have = pantry.map(normalizeItem).filter(Boolean);
  const items = new Map<string, GroceryItem>();

  for (const ingredients of mealIngredients) {
    const seenInMeal = new Set<string>();
    for (const raw of ingredients) {
      const label = groceryLabel(raw);
      if (!label) continue;
      const key = groceryKey(label);
      if (!key || seenInMeal.has(key)) continue;
      seenInMeal.add(key);

      // Skip if covered by pantry item
      if (have.some((p) => key.includes(p) || p.includes(key))) continue;

      const existing = items.get(key);
      if (existing) {
        existing.count += 1;
        // Prefer shorter/canonical label (e.g. "Tomate" over "Tomates", "Limón" over "Limones")
        if (label.length < existing.label.length && label.length >= 3) {
          existing.label = label;
        }
      } else {
        items.set(key, { key, label, count: 1 });
      }
    }
  }

  return Array.from(items.values()).sort((a, b) => a.label.localeCompare(b.label));
}
