'use client';

import { useState } from 'react';
import { analyzeImage, sendChatMessage } from '@/services/geminiService';
import type { Language } from '@/i18n/translations';

interface NutritionAnalysis {
  raw: string;
  loading: boolean;
  error: string | null;
}

interface RecipeGeneration {
  raw: string;
  loading: boolean;
  error: string | null;
}

const ANALYZE_PROMPTS: Record<Language, string> = {
  en: `You are a nutrition expert. Analyze this food photo and provide:
1. **Identified Foods**: List each food item you see
2. **Estimated Calories**: Total and per item
3. **Macronutrients**: Protein, Carbs, Fats (in grams)
4. **Micronutrient Highlights**: Key vitamins/minerals
5. **PCOS Score**: Rate 1-10 how PCOS-friendly this meal is (low glycemic, anti-inflammatory)
6. **Suggestions**: How to make it more hormone-friendly

Format with markdown headers and bullet points. Be concise but thorough. Respond entirely in English.`,

  es: `Eres un experto en nutrición. Analiza esta foto de comida y proporciona:
1. **Alimentos identificados**: Lista cada alimento que veas
2. **Calorías estimadas**: Total y por alimento
3. **Macronutrientes**: Proteína, Carbohidratos, Grasas (en gramos)
4. **Micronutrientes destacados**: Vitaminas/minerales clave
5. **Puntuación PCOS**: Califica del 1 al 10 qué tan amigable es esta comida para PCOS (bajo índice glucémico, antiinflamatoria)
6. **Sugerencias**: Cómo hacerla más amigable con las hormonas

Formatea con encabezados markdown y viñetas. Sé conciso pero completo. Responde completamente en español.`,
};

function buildRecipePrompt(ingredients: string[], phase: string, dietary: string[], lang: Language): string {
  const dietaryStr = dietary.length > 0 ? dietary.join(', ') : '';

  if (lang === 'es') {
    return `Eres un experto en nutrición sincronizada con el ciclo menstrual. Genera 3 recetas antiinflamatorias usando estos ingredientes: ${ingredients.join(', ')}.

Fase actual del ciclo: ${phase}.
${dietaryStr ? `Restricciones dietéticas: ${dietaryStr}.` : ''}

Para cada receta proporciona:
1. **Nombre de la receta** (nombre creativo)
2. **Por qué es buena para la fase ${phase}** (1 oración)
3. **Ingredientes** (con cantidades)
4. **Instrucciones** (pasos numerados, concisos)
5. **Estimación nutricional** (calorías, proteína, carbohidratos, grasas)
6. **Puntuación PCOS Friendly**: 1-10
7. **Tiempo de preparación**

Enfócate en ingredientes de bajo índice glucémico y antiinflamatorios. Formatea con markdown. Responde completamente en español.`;
  }

  return `You are a cycle-synced nutrition expert. Generate 3 anti-inflammatory recipes using these ingredients: ${ingredients.join(', ')}.

Current cycle phase: ${phase}.
${dietaryStr ? `Dietary restrictions: ${dietaryStr}.` : ''}

For each recipe provide:
1. **Recipe Name** (creative name)
2. **Why it's good for ${phase} phase** (1 sentence)
3. **Ingredients** (with amounts)
4. **Instructions** (numbered steps, concise)
5. **Nutrition estimate** (calories, protein, carbs, fats)
6. **PCOS Friendly Score**: 1-10
7. **Prep Time**

Focus on low glycemic index, anti-inflammatory ingredients. Format with markdown. Respond entirely in English.`;
}

export function useNutritionAI() {
  const [analysis, setAnalysis] = useState<NutritionAnalysis>({ raw: '', loading: false, error: null });
  const [recipe, setRecipe] = useState<RecipeGeneration>({ raw: '', loading: false, error: null });

  const analyzePlate = async (base64Image: string, lang: Language = 'en') => {
    setAnalysis({ raw: '', loading: true, error: null });
    try {
      const result = await analyzeImage(base64Image, ANALYZE_PROMPTS[lang]);
      setAnalysis({ raw: result, loading: false, error: null });
    } catch (err: any) {
      setAnalysis({ raw: '', loading: false, error: err.message || 'Failed to analyze image' });
    }
  };

  const generateRecipes = async (ingredients: string[], phase: string, dietary: string[], lang: Language = 'en') => {
    setRecipe({ raw: '', loading: true, error: null });
    try {
      const prompt = buildRecipePrompt(ingredients, phase, dietary, lang);
      const result = await sendChatMessage(prompt, [], lang);
      setRecipe({ raw: result, loading: false, error: null });
    } catch (err: any) {
      setRecipe({ raw: '', loading: false, error: err.message || 'Failed to generate recipes' });
    }
  };

  return { analysis, analyzePlate, recipe, generateRecipes };
}
