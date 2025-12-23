export interface Recipe {
    id: number;
    title: string;
    image: string;
    readyInMinutes: number;
    servings: number;
    sourceUrl: string;
    summary?: string;
    cuisines?: string[];
    dishTypes?: string[];
    diets?: string[];
    healthScore?: number;
}

export interface RecipeDetails extends Recipe {
    ingredients: Ingredient[];
    instructions: string;
    nutrition?: NutritionInfo;
    analyzedInstructions?: AnalyzedInstruction[];
}

export interface Ingredient {
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
    image?: string;
}

export interface NutritionInfo {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber?: number;
    sugar?: number;
}

export interface AnalyzedInstruction {
    name: string;
    steps: InstructionStep[];
}

export interface InstructionStep {
    number: number;
    step: string;
    ingredients?: { id: number; name: string }[];
    equipment?: { id: number; name: string }[];
}

export interface RecipeFilters {
    query?: string;
    cuisine?: string;
    diet?: string;
    intolerances?: string;
    type?: string;
    maxReadyTime?: number;
    number?: number;
}

export interface APIQuotaStatus {
    used: number;
    limit: number;
    remaining: number;
    resetTime?: Date;
}
