'use client';

import { useState } from 'react';
import { analyzeImage } from '@/services/geminiService';
import type { Language } from '@/i18n/translations';

interface NutritionAnalysis {
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
5. **PMOS Score**: Rate 1-10 how PMOS-friendly this meal is (low glycemic, anti-inflammatory)
6. **Suggestions**: How to make it more hormone-friendly

Format with markdown headers and bullet points. Be concise but thorough. Respond entirely in English.`,

  es: `Eres un experto en nutrición. Analiza esta foto de comida y proporciona:
1. **Alimentos identificados**: Lista cada alimento que veas
2. **Calorías estimadas**: Total y por alimento
3. **Macronutrientes**: Proteína, Carbohidratos, Grasas (en gramos)
4. **Micronutrientes destacados**: Vitaminas/minerales clave
5. **Puntuación PMOS**: Califica del 1 al 10 qué tan amigable es esta comida para PMOS (bajo índice glucémico, antiinflamatoria)
6. **Sugerencias**: Cómo hacerla más amigable con las hormonas

Formatea con encabezados markdown y viñetas. Sé conciso pero completo. Responde completamente en español.`,
};

export function useNutritionAI() {
  const [analysis, setAnalysis] = useState<NutritionAnalysis>({ raw: '', loading: false, error: null });

  const analyzePlate = async (base64Image: string, lang: Language = 'en') => {
    setAnalysis({ raw: '', loading: true, error: null });
    try {
      const result = await analyzeImage(base64Image, ANALYZE_PROMPTS[lang]);
      setAnalysis({ raw: result, loading: false, error: null });
    } catch (err: any) {
      setAnalysis({ raw: '', loading: false, error: err.message || 'Failed to analyze image' });
    }
  };

  return { analysis, analyzePlate };
}
