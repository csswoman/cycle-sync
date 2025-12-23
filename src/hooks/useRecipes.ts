import { useState, useEffect } from 'react';
import { Recipe, RecipeDetails, RecipeFilters, APIQuotaStatus } from '@/types/recipes';
import {
    searchRecipes,
    getRecipeById,
    hasQuotaAvailable,
    getQuota
} from '@/services/recipesService';

export const useRecipes = (initialFilters: RecipeFilters = {}) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [quotaStatus, setQuotaStatus] = useState<APIQuotaStatus>(getQuota());
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    const loadRecipes = async (filters: RecipeFilters = initialFilters) => {
        try {
            setLoading(true);
            setError(null);

            // Check quota before making request
            const hasQuota = hasQuotaAvailable();
            setQuotaExceeded(!hasQuota);

            const data = await searchRecipes(filters);
            setRecipes(data);

            // Update quota status after request
            setQuotaStatus(getQuota());
        } catch (err) {
            setError(err as Error);
            console.error('Error loading recipes:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRecipeDetails = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const hasQuota = hasQuotaAvailable();
            setQuotaExceeded(!hasQuota);

            const data = await getRecipeById(id);
            setSelectedRecipe(data);

            setQuotaStatus(getQuota());
        } catch (err) {
            setError(err as Error);
            console.error('Error loading recipe details:', err);
        } finally {
            setLoading(false);
        }
    };

    const search = async (filters: RecipeFilters) => {
        await loadRecipes(filters);
    };

    useEffect(() => {
        loadRecipes();
    }, []);

    return {
        recipes,
        selectedRecipe,
        loading,
        error,
        quotaStatus,
        quotaExceeded,
        refreshRecipes: loadRecipes,
        searchRecipes: search,
        getRecipeDetails: loadRecipeDetails,
        clearSelectedRecipe: () => setSelectedRecipe(null)
    };
};
