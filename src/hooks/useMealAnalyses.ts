'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MealAnalysis } from '@/lib/nutrition/mealAnalysis';

export interface SavedMealAnalysis {
  id: string;
  created_at: string;
  thumbnail: string | null;
  result: MealAnalysis | null;
  raw: string | null;
}

const LIMIT = 50;

/**
 * Meal photo analyses saved by the signed-in user, newest first. If the migration is not
 * applied the query fails, `available` stays false and the history is hidden.
 */
export function useMealAnalyses() {
  const [items, setItems] = useState<SavedMealAnalysis[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('meal_analyses')
      .select('id, created_at, thumbnail, result, raw')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(LIMIT);
    setAvailable(!error);
    if (!error) setItems((data as SavedMealAnalysis[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Saves one analysis and puts it at the top of the list. Returns false if it could not be saved. */
  const save = useCallback(async (input: { thumbnail: string | null; result: MealAnalysis | null; raw: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const row = {
      user_id: session.user.id,
      thumbnail: input.thumbnail,
      result: input.result,
      raw: input.result ? null : input.raw.slice(0, 20000) || null,
    };
    if (!row.result && !row.raw) return false;
    const { data, error } = await supabase
      .from('meal_analyses')
      .insert(row)
      .select('id, created_at, thumbnail, result, raw')
      .single();
    if (error || !data) return false;
    setItems((prev) => [data as SavedMealAnalysis, ...prev].slice(0, LIMIT));
    return true;
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from('meal_analyses').delete().eq('id', id);
    if (error) await load();
  }, [load]);

  return { items, available, loading, save, remove };
}

/** Downscales a photo (data URL) to a small JPEG data URL for the history list. */
export function makeThumbnail(dataUrl: string, maxSide = 360, quality = 0.7): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
