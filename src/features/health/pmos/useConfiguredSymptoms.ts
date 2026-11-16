'use client';
import { useCallback, useState } from 'react';

export const CONFIG_STORAGE_KEY = 'pmos_configured_symptoms';
const DEFAULT_SYMPTOMS = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'];

/** Symptoms the user wants in their daily routine, persisted in localStorage. */
export function useConfiguredSymptoms(): [string[], (next: string[]) => void] {
  const [configured, setConfiguredState] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const parsed = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) ?? 'null');
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_SYMPTOMS;
  });
  const setConfigured = useCallback((next: string[]) => {
    setConfiguredState(next);
    try { localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);
  return [configured, setConfigured];
}
