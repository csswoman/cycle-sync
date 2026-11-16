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
