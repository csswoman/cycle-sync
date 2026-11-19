'use client';

import { useState } from 'react';
import { analyzeImage } from '@/services/geminiService';
import type { Language } from '@/i18n/translations';
import { buildMealAnalysisPrompt, parseMealAnalysis, type MealAnalysis } from '@/lib/nutrition/mealAnalysis';

interface NutritionAnalysis {
  /** Structured result, shown as separate cards. */
  result: MealAnalysis | null;
  /** Model reply when it could not be parsed; shown as plain text. */
  raw: string;
  loading: boolean;
  error: string | null;
}

const EMPTY: NutritionAnalysis = { result: null, raw: '', loading: false, error: null };

export function useNutritionAI(hideNumbers = false, pmos = true) {
  const [analysis, setAnalysis] = useState<NutritionAnalysis>(EMPTY);

  /** Runs the analysis and also returns it (null on error) so the caller can save it. */
  const analyzePlate = async (base64Image: string, lang: Language = 'en'): Promise<{ result: MealAnalysis | null; raw: string } | null> => {
    setAnalysis({ ...EMPTY, loading: true });
    try {
      const reply = await analyzeImage(base64Image, buildMealAnalysisPrompt(lang, { pmos, hideNumbers }), 'json');
      const result = parseMealAnalysis(reply, hideNumbers);
      const raw = result ? '' : reply;
      setAnalysis({ ...EMPTY, result, raw });
      return { result, raw };
    } catch (err: any) {
      setAnalysis({ ...EMPTY, error: err.message || 'Failed to analyze image' });
      return null;
    }
  };

  return { analysis, analyzePlate };
}
