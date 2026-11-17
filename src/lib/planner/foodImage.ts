import { FOOD_DATABASE, getFoodImageUrl } from '@/data/nutritionFoods';
import { normalizeItem, toSingularWord } from './grocery';

/** Normalizes and singularizes ingredient name for food catalog matching. */
const singular = (s: string) =>
  normalizeItem(s)
    .split(' ')
    .map((w) => toSingularWord(w))
    .join(' ');

/** Everyday names that differ from the food database titles. Values are food ids. */
const ALIASES: Record<string, string> = {
  huevo: 'huevo-cocido',
  pollo: 'pechuga-pollo',
  pechuga: 'pechuga-pollo',
  'pechuga de pollo': 'pechuga-pollo',
  'pechuga pollo': 'pechuga-pollo',
  platano: 'platano-banana',
  banana: 'platano-banana',
  banano: 'platano-banana',
  palta: 'aguacate',
  papa: 'papa-patata',
  patata: 'papa-patata',
  mani: 'cacahuetes',
  cacahuete: 'cacahuetes',
  atun: 'atun-en-agua',
  camaron: 'camaron-gamba',
  gamba: 'camaron-gamba',
  yogur: 'yogur-griego',
  yogurt: 'yogur-griego',
  'yogur natural': 'yogur-griego',
  arroz: 'arroz-blanco',
  'arroz integral': 'arroz-blanco',
  ternera: 'ternera-magra',
  carne: 'ternera-magra',
  res: 'ternera-magra',
  pan: 'pan-integral',
  espinaca: 'espinaca-cruda',
  brocoli: 'brocoli-cocido',
  frijol: 'frijoles-negros',
  garbanzo: 'garbanzos-cocidos',
  lenteja: 'lentejas-cocidas',
  camote: 'camote-batata',
  batata: 'camote-batata',
  champinon: 'champinones',
  hongo: 'champinones',
  aceite: 'aceite-oliva',
  'aceite oliva': 'aceite-oliva',
  'aceite de oliva': 'aceite-oliva',
  chia: 'semillas-chia',
  'semilla chia': 'semillas-chia',
  'semilla de chia': 'semillas-chia',
  linaza: 'semillas-lino',
  lino: 'semillas-lino',
  'semilla lino': 'semillas-lino',
  'semilla de lino': 'semillas-lino',
  'semilla girasol': 'semillas-girasol',
  'semilla de girasol': 'semillas-girasol',
  'semilla calabaza': 'semillas-calabaza',
  'semilla de calabaza': 'semillas-calabaza',
  queso: 'queso-cottage',
  'queso fresco': 'queso-cottage',
  'queso blanco': 'queso-cottage',
  'queso mozzarella': 'queso-cottage',
  'queso feta': 'queso-cottage',
  'queso ricotta': 'queso-cottage',
  'queso cheddar': 'queso-cheddar',
  'queso parmesano': 'queso-cheddar',
  leche: 'leche-entera',
  tomate: 'tomate',
  'tomate cherry': 'tomate',
  cebolla: 'cebolla',
  'cebolla roja': 'cebolla',
  'cebolla morada': 'cebolla',
  'cebolla blanca': 'cebolla',
  pimiento: 'pimiento-rojo',
  'pimiento rojo': 'pimiento-rojo',
  'pimiento verde': 'pimiento-rojo',
  limon: 'limon',
  'zumo de limon': 'limon',
  'jugo de limon': 'limon',
  miel: 'miel',
  canela: 'canela',
  azucar: 'azucar',
  panela: 'azucar',
  cilantro: 'cilantro',
  perejil: 'perejil',
  menta: 'menta',
  hierbabuena: 'menta',
  mantequilla: 'mantequilla',
  ghee: 'mantequilla',
  remolacha: 'remolacha',
  betabel: 'remolacha',
  arveja: 'arvejas',
  guisante: 'arvejas',
  comino: 'comino',
  'polvo de hornear': 'polvo-hornear',
  'polvo para hornear': 'polvo-hornear',
  levadura: 'polvo-hornear',
  maiz: 'maiz',
  choclo: 'maiz',
  elote: 'maiz',
  pasas: 'uva',
  pasa: 'uva',
  pecanas: 'nueces',
  nuez: 'nueces',
  cacao: 'chocolate-negro',
  'cacao en polvo': 'chocolate-negro',
  'harina de trigo': 'pan-integral',
  'harina de avena': 'avena',
};

const byKey = new Map<string, string>();
for (const food of FOOD_DATABASE) {
  const url = getFoodImageUrl(food);
  const base = food.name.replace(/\(.*?\)/g, ' ');
  for (const part of base.split('/')) {
    const key = singular(part);
    if (key) byKey.set(key, url);
  }
}
const byId = new Map(FOOD_DATABASE.map((f) => [f.id, getFoodImageUrl(f)]));

/** Photo for a pantry/ingredient name from the food catalog, or null when there is none. */
export function foodImageFor(name: string): string | null {
  const key = singular(name.replace(/\(.*?\)/g, ' '));
  if (!key) return null;
  const direct = byKey.get(key);
  if (direct) return direct;
  const alias = ALIASES[key];
  if (alias && byId.has(alias)) return byId.get(alias) ?? null;

  // Multi-word prefix/suffix matching:
  for (const [k, url] of byKey) {
    if (k.length >= 4 && (key.startsWith(`${k} `) || key.endsWith(` ${k}`))) return url;
  }
  if (key.length >= 4) {
    for (const [k, url] of byKey) {
      if (k.startsWith(`${key} `)) return url;
    }
  }

  // Alias multi-word prefix matching
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (alias && id && byId.has(id) && alias.length >= 4) {
      if (key.startsWith(`${alias} `) || key.endsWith(` ${alias}`)) {
        return byId.get(id) ?? null;
      }
    }
  }

  // If first word alone is a known distinct ingredient (e.g. "tomate saladet" -> tomate)
  // but avoid over-matching generic adjectives or compounds
  const first = key.split(' ')[0];
  if (first && ALIASES[first] && byId.has(ALIASES[first])) {
    // Only use first-word match if the full key does not contain conflicting nouns (like "almendra")
    return byId.get(ALIASES[first]) ?? null;
  }

  return null;
}
