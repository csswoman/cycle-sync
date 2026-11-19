// Pure helpers to detect duplicate recipe titles. No imports so scripts and tests can use them.

const STOP_WORDS = new Set([
  // es
  'de', 'del', 'la', 'el', 'los', 'las', 'con', 'y', 'e', 'al', 'en', 'a', 'un', 'una', 'unos', 'unas', 'para', 'o',
  // en
  'with', 'and', 'the', 'of', 'a', 'an', 'in', 'on', 'for', 'or',
]);

/** Naive singularization so "frijoles"/"frijol" and "beans"/"bean" match. */
function singular(word: string): string {
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Normalized word set of a title: no accents, case, punctuation, stop words or plurals. */
export function titleTokens(title: string): string[] {
  const words = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .map(singular);
  return Array.from(new Set(words)).sort();
}

/** Stable key: "Frijoles con Arroz" and "arroz con frijoles" give the same key. */
export function titleKey(title: string): string {
  return titleTokens(title).join(' ');
}

/** True when both titles share at least `threshold` of their words (Jaccard similarity). */
export function isSimilarTitle(a: string, b: string, threshold = 0.8): boolean {
  const ta = new Set(titleTokens(a));
  const tb = new Set(titleTokens(b));
  if (ta.size === 0 || tb.size === 0) return false;
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared++;
  });
  return shared / (ta.size + tb.size - shared) >= threshold;
}
// Dishes recognizable by name alone: a photo of "Panqueque super facil" fits "Panqueques de quinua".
const DISH_WORDS = new Set(
  ['arepa', 'hamburguesa', 'panqueque', 'tortilla', 'pizza', 'empanada', 'ensalada', 'sandwich', 'tostada', 'galleta', 'bowl', 'wrap', 'taco', 'burrito', 'sopa', 'crema', 'batido', 'smoothie', 'granola', 'pancake', 'waffle', 'omelette', 'pasta', 'tamal', 'noqui', 'albondiga', 'avena'].map(singular)
);
/** Image of the most similar title: near identical, or the same main dish (first dish word in the title: arepa, hamburguesa...). */
export function findSimilarImage(title: string, candidates: { title: string; imageUrl?: string | null }[]): string | null {
  const t = new Set(titleTokens(title));
  // titleTokens sorts words, so find the main dish in the original word order ("Hamburguesa ... Ensalada" is a hamburguesa)
  const main = title.split(/\s+/).flatMap((w) => titleTokens(w)).find((w) => DISH_WORDS.has(w));
  let best: { url: string; score: number } | null = null;
  for (const c of candidates) {
    if (!c.imageUrl) continue;
    const tc = titleTokens(c.title);
    if (!(main && tc.includes(main)) && !isSimilarTitle(title, c.title)) continue;
    const shared = tc.filter((w) => t.has(w)).length;
    const score = shared / (t.size + tc.length - shared);
    if (!best || score > best.score) best = { url: c.imageUrl, score };
  }
  return best?.url ?? null;
}
