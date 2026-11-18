import { supabase } from '@/lib/supabase';
import { titleKey, isSimilarTitle } from '@/lib/recipes/normalize';
import type { LibraryRecipe, NewRecipe, Recipe, RecipeLanguage } from '@/types/recipes';
import { CATALOG_RECIPES } from '@/data/seedRecipes';

const SUGGESTED_TAGS: Record<RecipeLanguage, string[]> = {
    es: ['Bajo IG', 'Antiinflamatoria', 'Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Postre', 'Bebida', 'Fresca'],
    en: ['Low GI', 'Anti-inflammatory', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drink', 'Refreshing'],
};

export const suggestedTags = (language: RecipeLanguage) => SUGGESTED_TAGS[language] ?? SUGGESTED_TAGS.en;

export const normalizeTag = (tag: string) => tag.trim().replace(/\s+/g, ' ');

export const cleanTags = (tags: string[]) =>
    Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));

async function currentUserId(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}

const LOCAL_STORAGE_RECIPES_KEY = 'cycle_sync_local_custom_recipes';
const LOCAL_STORAGE_STATE_KEY = 'cycle_sync_local_recipe_state';

function getLocalState(): Record<string, { isFavorite: boolean; tags: string[] }> {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_STATE_KEY) || '{}');
    } catch {
        return {};
    }
}

function getLocalCustomRecipes(): LibraryRecipe[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECIPES_KEY) || '[]');
    } catch {
        return [];
    }
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
    const localState = getLocalState();
    const localCustom = getLocalCustomRecipes();

    // Start with pre-seeded rich catalog recipes (85 recipes)
    const baseRecipes: LibraryRecipe[] = CATALOG_RECIPES.map((r) => {
        const s = localState[r.id];
        return {
            ...r,
            isFavorite: !!s?.isFavorite,
            myTags: s?.tags ?? [],
        };
    });

    if (!userId) {
        // Guest mode / offline: return local catalog + local custom
        return [...localCustom, ...baseRecipes];
    }

    try {
        const [recipesRes, stateRes] = await Promise.all([
            supabase.from('recipes').select('*').order('created_at', { ascending: false }).limit(1000),
            supabase.from('user_recipes').select('recipe_id, is_favorite, tags').eq('user_id', userId),
        ]);

        const remoteState = new Map<string, { is_favorite: boolean; tags: string[] }>();
        (stateRes.data ?? []).forEach((s: any) => remoteState.set(s.recipe_id, s));

        const remoteRecipes: LibraryRecipe[] = (recipesRes.data ?? []).map((row) => {
            const s = remoteState.get(row.id);
            return { ...rowToRecipe(row), isFavorite: !!s?.is_favorite, myTags: s?.tags ?? [] };
        });

        // Merge: remote recipes take precedence, catalog items complement if not present
        const merged: LibraryRecipe[] = [...remoteRecipes];
        for (const cat of baseRecipes) {
            if (!merged.some((m) => isSimilarTitle(m.title, cat.title))) {
                const s = remoteState.get(cat.id);
                merged.push({
                    ...cat,
                    isFavorite: s ? !!s.is_favorite : cat.isFavorite,
                    myTags: s?.tags ?? cat.myTags,
                });
            }
        }

        return merged;
    } catch (err) {
        console.warn('Falling back to local recipes catalog:', err);
        return [...localCustom, ...baseRecipes];
    }
}

/** Saves the user's favorite flag and personal tags for a recipe. */
export async function saveUserState(
    recipeId: string,
    state: { isFavorite: boolean; myTags: string[] }
): Promise<void> {
    const userId = await currentUserId();
    if (typeof window !== 'undefined') {
        const local = getLocalState();
        local[recipeId] = { isFavorite: state.isFavorite, tags: cleanTags(state.myTags) };
        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(local));
    }

    if (!userId) return;

    const { error } = await supabase.from('user_recipes').upsert(
        {
            user_id: userId,
            recipe_id: recipeId,
            is_favorite: state.isFavorite,
            tags: cleanTags(state.myTags),
        },
        { onConflict: 'user_id,recipe_id' }
    );
    if (error) {
        console.warn('Failed to persist user state to supabase:', error);
    }
}

/** Creates a private recipe only its author can see. */
export async function createCustomRecipe(input: NewRecipe): Promise<LibraryRecipe> {
    const userId = await currentUserId();

    if (!userId) {
        // Store in local storage for guest
        const newLibRecipe: LibraryRecipe = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ownerId: 'guest',
            source: 'custom',
            language: input.language,
            title: input.title.trim(),
            description: input.description?.trim() || '',
            imageUrl: input.imageUrl?.trim() || null,
            readyInMinutes: input.readyInMinutes ?? null,
            servings: input.servings ?? null,
            ingredients: input.ingredients,
            steps: input.steps,
            nutrition: input.nutrition ?? undefined,
            tags: cleanTags(input.tags),
            createdAt: new Date().toISOString(),
            isFavorite: false,
            myTags: [],
        };

        if (typeof window !== 'undefined') {
            const list = getLocalCustomRecipes();
            list.unshift(newLibRecipe);
            localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(list));
        }

        return newLibRecipe;
    }

    try {
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
                nutrition: input.nutrition ?? null,
                tags: cleanTags(input.tags),
            })
            .select()
            .single();
        if (error) throw error;
        return { ...rowToRecipe(data), isFavorite: false, myTags: [] };
    } catch (err) {
        console.warn('Falling back to local storage custom recipe:', err);
        const fallback: LibraryRecipe = {
            id: `custom-${Date.now()}`,
            ownerId: userId,
            source: 'custom',
            language: input.language,
            title: input.title.trim(),
            description: input.description?.trim() || '',
            imageUrl: input.imageUrl?.trim() || null,
            readyInMinutes: input.readyInMinutes ?? null,
            servings: input.servings ?? null,
            ingredients: input.ingredients,
            steps: input.steps,
            nutrition: input.nutrition ?? undefined,
            tags: cleanTags(input.tags),
            createdAt: new Date().toISOString(),
            isFavorite: false,
            myTags: [],
        };
        if (typeof window !== 'undefined') {
            const list = getLocalCustomRecipes();
            list.unshift(fallback);
            localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(list));
        }
        return fallback;
    }
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
    /** Per-serving protein range [min, max] g for one meal of the user's plan. */
    proteinPerMeal?: [number, number];
    /** The user tracks PMOS. */
    pmos?: boolean;
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
