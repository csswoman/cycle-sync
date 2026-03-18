import { Recipe, RecipeDetails, RecipeFilters, APIQuotaStatus, Ingredient } from '@/types/recipes';

const SPOONACULAR_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_KEY || '';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';
const DAILY_QUOTA_LIMIT = 150; // Free tier limit

// LocalStorage key for tracking daily usage
const QUOTA_STORAGE_KEY = 'spoonacular_quota';

/**
 * Get current quota status from localStorage
 */
const getQuotaStatus = (): APIQuotaStatus => {
    if (typeof window === 'undefined') {
        return { used: 0, limit: DAILY_QUOTA_LIMIT, remaining: DAILY_QUOTA_LIMIT };
    }
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!stored) {
        return { used: 0, limit: DAILY_QUOTA_LIMIT, remaining: DAILY_QUOTA_LIMIT };
    }

    const quota = JSON.parse(stored);
    const resetTime = new Date(quota.resetTime);
    const now = new Date();

    // Reset if it's a new day
    if (now > resetTime) {
        const newQuota = { used: 0, limit: DAILY_QUOTA_LIMIT, remaining: DAILY_QUOTA_LIMIT, resetTime: getNextResetTime() };
        localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(newQuota));
        return newQuota;
    }

    return quota;
};

/**
 * Get next reset time (midnight)
 */
const getNextResetTime = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
};

/**
 * Increment quota usage
 */
const incrementQuota = (points: number = 1) => {
    const quota = getQuotaStatus();
    quota.used += points;
    quota.remaining = Math.max(0, quota.limit - quota.used);
    if (!quota.resetTime) {
        quota.resetTime = getNextResetTime();
    }
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quota));
};

/**
 * Check if quota is available
 */
export const hasQuotaAvailable = (): boolean => {
    const quota = getQuotaStatus();
    return quota.remaining > 0;
};

/**
 * Get quota status for UI display
 */
export const getQuota = (): APIQuotaStatus => {
    return getQuotaStatus();
};

/**
 * Search recipes with Spoonacular API
 */
export const searchRecipes = async (filters: RecipeFilters = {}): Promise<Recipe[]> => {
    // Check quota first
    if (!hasQuotaAvailable()) {
        console.warn('Spoonacular quota exceeded, using fallback');
        return getFallbackRecipes(filters);
    }

    try {
        const {
            query = '',
            cuisine = '',
            diet = '',
            intolerances = '',
            type = '',
            maxReadyTime,
            number = 12
        } = filters;

        const params = new URLSearchParams({
            apiKey: SPOONACULAR_KEY,
            number: number.toString(),
            addRecipeInformation: 'true',
            fillIngredients: 'true'
        });

        if (query) params.append('query', query);
        if (cuisine) params.append('cuisine', cuisine);
        if (diet) params.append('diet', diet);
        if (intolerances) params.append('intolerances', intolerances);
        if (type) params.append('type', type);
        if (maxReadyTime) params.append('maxReadyTime', maxReadyTime.toString());

        const response = await fetch(`${SPOONACULAR_BASE_URL}/recipes/complexSearch?${params}`);

        if (!response.ok) {
            if (response.status === 402) {
                // Quota exceeded on server side
                console.warn('Spoonacular quota exceeded on server');
                return getFallbackRecipes(filters);
            }
            throw new Error(`Spoonacular error: ${response.status}`);
        }

        const data = await response.json();

        // Increment quota (1 point per search)
        incrementQuota(1);

        return data.results.map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            sourceUrl: recipe.sourceUrl,
            summary: recipe.summary,
            cuisines: recipe.cuisines,
            dishTypes: recipe.dishTypes,
            diets: recipe.diets,
            healthScore: recipe.healthScore
        }));
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return getFallbackRecipes(filters);
    }
};

/**
 * Get recipe details by ID
 */
export const getRecipeById = async (id: number): Promise<RecipeDetails | null> => {
    // Check quota
    if (!hasQuotaAvailable()) {
        console.warn('Spoonacular quota exceeded, using fallback');
        return getFallbackRecipeDetails(id);
    }

    try {
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_KEY,
            includeNutrition: 'true'
        });

        const response = await fetch(`${SPOONACULAR_BASE_URL}/recipes/${id}/information?${params}`);

        if (!response.ok) {
            if (response.status === 402) {
                return getFallbackRecipeDetails(id);
            }
            throw new Error(`Spoonacular error: ${response.status}`);
        }

        const recipe = await response.json();

        // Increment quota (1 point per detail request)
        incrementQuota(1);

        return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            sourceUrl: recipe.sourceUrl,
            summary: recipe.summary,
            cuisines: recipe.cuisines,
            dishTypes: recipe.dishTypes,
            diets: recipe.diets,
            healthScore: recipe.healthScore,
            ingredients: recipe.extendedIngredients?.map((ing: any) => ({
                id: ing.id,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                original: ing.original,
                image: ing.image
            })) || [],
            instructions: recipe.instructions || '',
            analyzedInstructions: recipe.analyzedInstructions || [],
            nutrition: recipe.nutrition ? {
                calories: recipe.nutrition.nutrients.find((n: any) => n.name === 'Calories')?.amount || 0,
                protein: recipe.nutrition.nutrients.find((n: any) => n.name === 'Protein')?.amount || 0,
                fat: recipe.nutrition.nutrients.find((n: any) => n.name === 'Fat')?.amount || 0,
                carbohydrates: recipe.nutrition.nutrients.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
                fiber: recipe.nutrition.nutrients.find((n: any) => n.name === 'Fiber')?.amount || 0,
                sugar: recipe.nutrition.nutrients.find((n: any) => n.name === 'Sugar')?.amount || 0
            } : undefined
        };
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return getFallbackRecipeDetails(id);
    }
};

/**
 * Fallback recipes when Spoonacular quota is exceeded
 */
const getFallbackRecipes = (filters: RecipeFilters = {}): Recipe[] => {
    const allRecipes: Recipe[] = [
        {
            id: 1,
            title: 'Quinoa Buddha Bowl with Roasted Vegetables',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
            readyInMinutes: 35,
            servings: 2,
            sourceUrl: 'https://www.example.com/recipe/1',
            diets: ['vegetarian', 'gluten free'],
            healthScore: 95
        },
        {
            id: 2,
            title: 'Grilled Salmon with Asparagus',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
            readyInMinutes: 25,
            servings: 2,
            sourceUrl: 'https://www.example.com/recipe/2',
            diets: ['gluten free', 'dairy free'],
            healthScore: 92
        },
        {
            id: 3,
            title: 'Sweet Potato and Black Bean Tacos',
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
            readyInMinutes: 30,
            servings: 4,
            sourceUrl: 'https://www.example.com/recipe/3',
            diets: ['vegetarian', 'vegan'],
            healthScore: 88
        },
        {
            id: 4,
            title: 'Greek Yogurt Parfait with Berries',
            image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
            readyInMinutes: 10,
            servings: 1,
            sourceUrl: 'https://www.example.com/recipe/4',
            diets: ['vegetarian', 'gluten free'],
            healthScore: 85
        },
        {
            id: 5,
            title: 'Chicken and Vegetable Stir Fry',
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
            readyInMinutes: 20,
            servings: 3,
            sourceUrl: 'https://www.example.com/recipe/5',
            diets: ['gluten free', 'dairy free'],
            healthScore: 90
        },
        {
            id: 6,
            title: 'Avocado Toast with Poached Egg',
            image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
            readyInMinutes: 15,
            servings: 1,
            sourceUrl: 'https://www.example.com/recipe/6',
            diets: ['vegetarian'],
            healthScore: 87
        }
    ];

    // Simple filtering
    let filtered = allRecipes;

    if (filters.diet) {
        filtered = filtered.filter(r => r.diets?.includes(filters.diet!));
    }

    if (filters.maxReadyTime) {
        filtered = filtered.filter(r => r.readyInMinutes <= filters.maxReadyTime!);
    }

    return filtered.slice(0, filters.number || 12);
};

/**
 * Fallback recipe details
 */
const getFallbackRecipeDetails = (id: number): RecipeDetails | null => {
    const recipe = getFallbackRecipes().find(r => r.id === id);
    if (!recipe) return null;

    return {
        ...recipe,
        ingredients: [
            { id: 1, name: 'Ingredient 1', amount: 1, unit: 'cup', original: '1 cup ingredient 1' },
            { id: 2, name: 'Ingredient 2', amount: 2, unit: 'tbsp', original: '2 tbsp ingredient 2' }
        ],
        instructions: 'Detailed instructions not available in fallback mode. Visit the source URL for full recipe.',
        nutrition: {
            calories: 350,
            protein: 25,
            fat: 15,
            carbohydrates: 35,
            fiber: 8,
            sugar: 5
        }
    };
};
