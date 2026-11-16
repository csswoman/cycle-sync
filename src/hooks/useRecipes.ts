'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LibraryRecipe, NewRecipe } from '@/types/recipes';
import {
    listLibrary,
    saveUserState,
    createCustomRecipe,
    deleteOwnRecipe,
    cleanTags,
} from '@/services/recipesService';

export interface RecipeFilters {
    text: string;
    favoritesOnly: boolean;
    mineOnly: boolean;
    tags: string[];
}

export const EMPTY_RECIPE_FILTERS: RecipeFilters = { text: '', favoritesOnly: false, mineOnly: false, tags: [] };

const allTagsOf = (r: LibraryRecipe) => [...r.tags, ...r.myTags];

export function useRecipes() {
    const [recipes, setRecipes] = useState<LibraryRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<RecipeFilters>(EMPTY_RECIPE_FILTERS);

    const refresh = useCallback(async () => {
        try {
            setError(null);
            setRecipes(await listLibrary());
        } catch (err) {
            console.error('Error loading recipes:', err);
            setError('Could not load recipes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const patchLocal = (id: string, patch: Partial<LibraryRecipe>) =>
        setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const updateState = async (recipe: LibraryRecipe, patch: { isFavorite?: boolean; myTags?: string[] }) => {
        const next = {
            isFavorite: patch.isFavorite ?? recipe.isFavorite,
            myTags: patch.myTags !== undefined ? cleanTags(patch.myTags) : recipe.myTags,
        };
        patchLocal(recipe.id, next);
        try {
            await saveUserState(recipe.id, next);
        } catch (err) {
            console.error('Error saving recipe state:', err);
            patchLocal(recipe.id, { isFavorite: recipe.isFavorite, myTags: recipe.myTags });
        }
    };

    const toggleFavorite = (recipe: LibraryRecipe) => updateState(recipe, { isFavorite: !recipe.isFavorite });
    const setMyTags = (recipe: LibraryRecipe, tags: string[]) => updateState(recipe, { myTags: tags });

    const addCustom = async (input: NewRecipe) => {
        const created = await createCustomRecipe(input);
        setRecipes((prev) => [created, ...prev]);
        return created;
    };

    const removeOwn = async (recipe: LibraryRecipe) => {
        await deleteOwnRecipe(recipe.id);
        setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    };

    const allTags = useMemo(
        () => Array.from(new Set(recipes.flatMap(allTagsOf))).sort((a, b) => a.localeCompare(b)),
        [recipes]
    );

    const filtered = useMemo(() => {
        const text = filters.text.trim().toLowerCase();
        return recipes.filter((r) => {
            if (filters.favoritesOnly && !r.isFavorite) return false;
            if (filters.mineOnly && r.ownerId === null) return false;
            if (filters.tags.length > 0) {
                const tags = allTagsOf(r);
                if (!filters.tags.every((t) => tags.includes(t))) return false;
            }
            if (text) {
                const haystack = [r.title, r.description, ...allTagsOf(r), ...r.ingredients].join(' ').toLowerCase();
                if (!haystack.includes(text)) return false;
            }
            return true;
        });
    }, [recipes, filters]);

    return {
        recipes,
        filtered,
        allTags,
        loading,
        error,
        filters,
        setFilters,
        refresh,
        toggleFavorite,
        setMyTags,
        addCustom,
        removeOwn,
    };
}
