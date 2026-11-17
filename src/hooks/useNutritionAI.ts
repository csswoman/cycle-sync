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
6. **Protein per meal**: Say if the protein fits one meal (about 25-40 g, enough to fully stimulate muscle protein synthesis). If lower, suggest how to add some; if much higher, note it is not wasted but is used better split across meals 3-5 hours apart
7. **Suggestions**: How to make it more hormone-friendly

Format with markdown headers and bullet points. Be concise but thorough. Respond entirely in English.`,

  es: `Eres un experto en nutrición. Analiza esta foto de comida y proporciona:
1. **Alimentos identificados**: Lista cada alimento que veas
2. **Calorías estimadas**: Total y por alimento
3. **Macronutrientes**: Proteína, Carbohidratos, Grasas (en gramos)
4. **Micronutrientes destacados**: Vitaminas/minerales clave
5. **Puntuación PMOS**: Califica del 1 al 10 qué tan amigable es esta comida para PMOS (bajo índice glucémico, antiinflamatoria)
6. **Proteína por comida**: Indica si la proteína encaja en una comida (unos 25-40 g, suficiente para activar por completo la síntesis de proteína del músculo). Si es menos, sugiere cómo añadir; si es mucho más, aclara que no se desperdicia pero rinde más repartida en comidas separadas 3 a 5 horas
7. **Sugerencias**: Cómo hacerla más amigable con las hormonas

Formatea con encabezados markdown y viñetas. Sé conciso pero completo. Responde completamente en español.`,
};

/** Without PMOS the score rates hormone and blood-sugar friendliness instead of naming PMOS. */
function withoutPmos(prompt: string): string {
  return prompt
    .replace('**PMOS Score**: Rate 1-10 how PMOS-friendly this meal is (low glycemic, anti-inflammatory)',
      '**Balance Score**: Rate 1-10 how well this meal keeps blood sugar steady and supports your cycle (low glycemic, anti-inflammatory)')
    .replace('**Puntuación PMOS**: Califica del 1 al 10 qué tan amigable es esta comida para PMOS (bajo índice glucémico, antiinflamatoria)',
      '**Puntuación de equilibrio**: Califica del 1 al 10 qué tanto esta comida mantiene estable tu glucosa y apoya tu ciclo (bajo índice glucémico, antiinflamatoria)');
}

/** Same analysis without calories or macros, for no-numbers mode. */
function withoutNumbers(prompt: string): string {
  return prompt
    .split('\n')
    .filter((line) => !/^\d+\. \*\*(Estimated Calories|Macronutrients|Protein per meal|Calorías estimadas|Macronutrientes|Proteína por comida)\*\*/.test(line))
    .map((line) => line.replace(/^(\d+)\. /, ''))
    .map((line, i, all) => (/^\*\*/.test(line) ? `${all.slice(0, i + 1).filter((l) => /^\*\*/.test(l)).length}. ${line}` : line))
    .join('\n')
    .concat('\nDo not mention calories, weight or numeric nutrient amounts. / No menciones calorías, peso ni cantidades numéricas de nutrientes.');
}

export function useNutritionAI(hideNumbers = false, pmos = true) {
  const [analysis, setAnalysis] = useState<NutritionAnalysis>({ raw: '', loading: false, error: null });

  const analyzePlate = async (base64Image: string, lang: Language = 'en') => {
    setAnalysis({ raw: '', loading: true, error: null });
    try {
      const base = pmos ? ANALYZE_PROMPTS[lang] : withoutPmos(ANALYZE_PROMPTS[lang]);
      const result = await analyzeImage(base64Image, hideNumbers ? withoutNumbers(base) : base);
      setAnalysis({ raw: result, loading: false, error: null });
    } catch (err: any) {
      setAnalysis({ raw: '', loading: false, error: err.message || 'Failed to analyze image' });
    }
  };

  return { analysis, analyzePlate };
}
