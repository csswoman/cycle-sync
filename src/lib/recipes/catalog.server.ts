import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewRecipe, RecipeLanguage, RecipeSource } from '../../types/recipes';
import { titleKey, isSimilarTitle } from './normalize';

// Server/script only: writes the shared catalog with a service-role client.

export interface SaveResult {
  saved: { id: string; title: string }[];
  /** Titles skipped because the catalog already has the same (or a near identical) recipe. */
  duplicates: string[];
}

/** Titles already in the catalog for a language, newest first. */
export async function listCatalogTitles(db: SupabaseClient, language: RecipeLanguage, limit = 1000): Promise<string[]> {
  const { data, error } = await db
    .from('recipes')
    .select('title')
    .is('owner_id', null)
    .eq('language', language)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: { title: string }) => r.title);
}

/**
 * Inserts recipes into the shared catalog, skipping any whose title matches one
 * already there (also against the other recipes in the same batch).
 */
export async function saveCatalogRecipes(
  db: SupabaseClient,
  recipes: NewRecipe[],
  source: Exclude<RecipeSource, 'custom'>
): Promise<SaveResult> {
  const result: SaveResult = { saved: [], duplicates: [] };
  const known = new Map<RecipeLanguage, string[]>();

  for (const recipe of recipes) {
    if (!known.has(recipe.language)) {
      known.set(recipe.language, await listCatalogTitles(db, recipe.language));
    }
    const titles = known.get(recipe.language)!;
    if (titles.some((t) => isSimilarTitle(t, recipe.title))) {
      result.duplicates.push(recipe.title);
      continue;
    }

    const { data, error } = await db
      .from('recipes')
      .insert({
        owner_id: null,
        source,
        language: recipe.language,
        title: recipe.title,
        title_key: titleKey(recipe.title),
        description: recipe.description || null,
        image_url: recipe.imageUrl ?? null,
        ready_in_minutes: recipe.readyInMinutes ?? null,
        servings: recipe.servings ?? null,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        nutrition: recipe.nutrition ?? null,
        tags: recipe.tags,
      })
      .select('id, title')
      .single();

    if (error) {
      // 23505: the unique (language, title_key) index caught a concurrent duplicate
      if (error.code === '23505') {
        result.duplicates.push(recipe.title);
        continue;
      }
      throw error;
    }
    titles.push(recipe.title);
    result.saved.push({ id: data.id, title: data.title });
  }
  return result;
}
