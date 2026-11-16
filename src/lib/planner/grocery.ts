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

/**
 * Builds the shopping list from the ingredients of the planned meals.
 * Items repeated across meals are merged; items already in the pantry are left out
 * (matched when either name contains the other, e.g. pantry "arroz" covers "arroz integral").
 */
export function buildGroceryList(mealIngredients: string[][], pantry: string[]): GroceryItem[] {
  const have = pantry.map(normalizeItem).filter(Boolean);
  const items = new Map<string, GroceryItem>();

  for (const ingredients of mealIngredients) {
    const seenInMeal = new Set<string>();
    for (const raw of ingredients) {
      const label = raw.trim();
      const key = normalizeItem(label);
      if (!key || seenInMeal.has(key)) continue;
      seenInMeal.add(key);
      if (have.some((p) => key.includes(p) || p.includes(key))) continue;
      const existing = items.get(key);
      if (existing) existing.count += 1;
      else items.set(key, { key, label, count: 1 });
    }
  }

  return Array.from(items.values()).sort((a, b) => a.label.localeCompare(b.label));
}
