import catalogData from './catalogRecipes.json';
import type { Recipe } from '@/types/recipes';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/** Catalog entries renamed after publishing keep `idSeed` (their old title) so saved favorites still match. */

export const CATALOG_RECIPES: Recipe[] = (catalogData as any[]).map((r, idx) => {
  const categoryTag = r.category
    ? r.category.charAt(0).toUpperCase() + r.category.slice(1)
    : 'Almuerzo';

  const tags = Array.from(
    new Set([
      categoryTag,
      ...(r.tags || []).map((t: string) =>
        t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      ),
    ])
  );

  return {
    id: `catalog-${slugify(r.idSeed ?? r.title)}-${idx}`,
    ownerId: null,
    source: 'custom',
    language: 'es',
    title: r.title,
    description: r.description || '',
    imageUrl: r.imageUrl || null,
    readyInMinutes: r.prepTime ?? 25,
    servings: r.servings ?? 1,
    ingredients: r.ingredients || [],
    steps: r.instructions || [],
    nutrition: {
      calories: r.calories,
      protein: r.protein,
      carbohydrates: r.carbs,
      fat: r.fat,
    },
    tags,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  };
});
