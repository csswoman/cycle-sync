'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LibraryRecipe, NewRecipe } from '@/types/recipes';
import { avoidedIn, likedIn, type FoodPreferences } from '@/lib/nutrition/foodPreferences';
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
    /** Hide recipes that contain a food the user avoids. */
    skipAvoided: boolean;
    /** Only recipes that contain at least one food the user likes. */
    withLiked: boolean;
}

export const EMPTY_RECIPE_FILTERS: RecipeFilters = { text: '', favoritesOnly: false, mineOnly: false, tags: [], skipAvoided: false, withLiked: false };

import { tagKey, tagLabel } from '@/lib/nutrition/recipeTags';

const allTagsOf = (r: LibraryRecipe) => [...r.tags, ...r.myTags];

export function useRecipes(foods: Pick<FoodPreferences, 'likes' | 'avoid'> = { likes: [], avoid: [] }) {
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

    // One option per canonical tag, most used first.
    const tagOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const r of recipes) {
            for (const key of new Set(allTagsOf(r).map(tagKey))) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const labelOf = new Map<string, string>();
        for (const r of recipes) for (const t of allTagsOf(r)) if (!labelOf.has(tagKey(t))) labelOf.set(tagKey(t), tagLabel(t));
        return Array.from(counts, ([key, count]) => ({ key, label: labelOf.get(key) ?? key, count }))
            .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }, [recipes]);

    const { likes, avoid } = foods;
    const filtered = useMemo(() => {
        const text = filters.text.trim().toLowerCase();
        return recipes.filter((r) => {
            if (filters.favoritesOnly && !r.isFavorite) return false;
            if (filters.mineOnly && r.ownerId === null) return false;
            if (filters.skipAvoided && avoidedIn(r, avoid).length > 0) return false;
            if (filters.withLiked && likedIn(r, likes).length === 0) return false;
            if (filters.tags.length > 0) {
                const keys = allTagsOf(r).map(tagKey);
                if (!filters.tags.every((t) => keys.includes(t))) return false;
            }
            if (text) {
                const haystack = [r.title, r.description, ...allTagsOf(r), ...r.ingredients].join(' ').toLowerCase();
                if (!haystack.includes(text)) return false;
            }
            return true;
        });
    }, [recipes, filters, likes, avoid]);

    return {
        recipes,
        filtered,
        tagOptions,
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
