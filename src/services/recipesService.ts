import { supabase } from '@/lib/supabase';
import { titleKey } from '@/lib/recipes/normalize';
import type { LibraryRecipe, NewRecipe, Recipe, RecipeLanguage } from '@/types/recipes';

const SUGGESTED_TAGS: Record<RecipeLanguage, string[]> = {
    es: ['Bajo IG', 'Antiinflamatoria'],
    en: ['Low GI', 'Anti-inflammatory'],
};

export const suggestedTags = (language: RecipeLanguage) => SUGGESTED_TAGS[language] ?? SUGGESTED_TAGS.en;

export const normalizeTag = (tag: string) => tag.trim().replace(/\s+/g, ' ');

export const cleanTags = (tags: string[]) =>
    Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));

async function currentUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const id = session?.user?.id;
    if (!id) throw new Error('Not signed in');
    return id;
}

const rowToRecipe = (row: any): Recipe => ({
    id: row.id,
    ownerId: row.owner_id ?? null,
    source: row.source,
    language: row.language,
    title: row.title,
    description: row.description ?? '',
    imageUrl: row.image_url ?? null,
    readyInMinutes: row.ready_in_minutes ?? null,
    servings: row.servings ?? null,
    ingredients: (row.ingredients ?? []) as string[],
    steps: (row.steps ?? []) as string[],
    nutrition: row.nutrition ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
});

/** Catalog recipes, the user's private recipes, and the user's favorites/tags on them. */
export async function listLibrary(): Promise<LibraryRecipe[]> {
    const userId = await currentUserId();
    const [recipesRes, stateRes] = await Promise.all([
        supabase.from('recipes').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('user_recipes').select('recipe_id, is_favorite, tags').eq('user_id', userId),
    ]);
    if (recipesRes.error) throw recipesRes.error;
    if (stateRes.error) throw stateRes.error;

    const state = new Map<string, { is_favorite: boolean; tags: string[] }>();
    (stateRes.data ?? []).forEach((s: any) => state.set(s.recipe_id, s));

    return (recipesRes.data ?? []).map((row) => {
        const s = state.get(row.id);
        return { ...rowToRecipe(row), isFavorite: !!s?.is_favorite, myTags: s?.tags ?? [] };
    });
}

/** Saves the user's favorite flag and personal tags for a recipe. */
export async function saveUserState(
    recipeId: string,
    state: { isFavorite: boolean; myTags: string[] }
): Promise<void> {
    const userId = await currentUserId();
    const { error } = await supabase.from('user_recipes').upsert(
        {
            user_id: userId,
            recipe_id: recipeId,
            is_favorite: state.isFavorite,
            tags: cleanTags(state.myTags),
        },
        { onConflict: 'user_id,recipe_id' }
    );
    if (error) throw error;
}

/** Creates a private recipe only its author can see. */
export async function createCustomRecipe(input: NewRecipe): Promise<LibraryRecipe> {
    const userId = await currentUserId();
    const { data, error } = await supabase
        .from('recipes')
        .insert({
            owner_id: userId,
            source: 'custom',
            language: input.language,
            title: input.title.trim(),
            title_key: titleKey(input.title),
            description: input.description?.trim() || null,
            image_url: input.imageUrl?.trim() || null,
            ready_in_minutes: input.readyInMinutes ?? null,
            servings: input.servings ?? null,
            ingredients: input.ingredients,
            steps: input.steps,
            tags: cleanTags(input.tags),
        })
        .select()
        .single();
    if (error) throw error;
    return { ...rowToRecipe(data), isFavorite: false, myTags: [] };
}

/** Deletes a private recipe (RLS only allows the owner). */
export async function deleteOwnRecipe(recipeId: string): Promise<void> {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (error) throw error;
}

export interface GenerateResult {
    saved: { id: string; title: string }[];
    duplicates: string[];
}

/** Asks the server to create recipes with Gemini and add the new ones to the shared catalog. */
export async function generateRecipes(params: {
    ingredients: string[];
    phase: string;
    dietary: string[];
    language: RecipeLanguage;
    /** Foods the user enjoys (names, in the recipe language). */
    likes?: string[];
    /** Foods the user dislikes (names, in the recipe language). */
    avoid?: string[];
}): Promise<GenerateResult> {
    const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Recipe generation failed (${response.status})`);
    return data as GenerateResult;
}
