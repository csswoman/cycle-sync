export type RecipeSource = 'gemini' | 'pdf' | 'custom';
export type RecipeLanguage = 'es' | 'en';

export interface NutritionInfo {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
}

/** A recipe as stored in public.recipes (catalog or private). */
export interface Recipe {
    id: string;
    ownerId: string | null;
    source: RecipeSource;
    language: RecipeLanguage;
    title: string;
    description: string;
    imageUrl: string | null;
    readyInMinutes: number | null;
    servings: number | null;
    ingredients: string[];
    steps: string[];
    nutrition?: NutritionInfo;
    tags: string[];
    createdAt: string;
}

/** A recipe plus the current user's favorite flag and personal tags. */
export interface LibraryRecipe extends Recipe {
    isFavorite: boolean;
    myTags: string[];
}

/** Recipe content before it gets an id (generated, imported or typed by the user). */
export interface NewRecipe {
    title: string;
    description?: string;
    language: RecipeLanguage;
    imageUrl?: string | null;
    readyInMinutes?: number | null;
    servings?: number | null;
    ingredients: string[];
    steps: string[];
    nutrition?: NutritionInfo | null;
    tags: string[];
}
