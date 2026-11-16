'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_FOOD_PREFERENCES,
  FOOD_PREFERENCES_STORAGE_KEY,
  parseFoodPreferences,
  setFoodState,
  type ActivityLevel,
  type FoodPreferences,
  type FoodState,
  type SunExposure,
} from '@/lib/nutrition/foodPreferences';
import { fetchRemoteFoodPreferences, saveRemoteFoodPreferences } from '@/services/foodPreferencesService';

const hasData = (p: FoodPreferences) => p.likes.length + p.avoid.length > 0 || p.sun !== null || p.activity !== null;

const writeLocal = (p: FoodPreferences) => {
  try {
    localStorage.setItem(FOOD_PREFERENCES_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Storage full or blocked: keep the in-memory value.
  }
};

/**
 * The user's food tastes and habits. Saved on this device always, and in Supabase when signed in
 * (the remote copy wins on load; a first-time account uploads what is on the device).
 */
export function useFoodPreferences() {
  const [prefs, setPrefs] = useState<FoodPreferences>(EMPTY_FOOD_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edited = useRef(false);
  const pending = useRef<FoodPreferences | null>(null);

  useEffect(() => {
    let cancelled = false;
    let local = EMPTY_FOOD_PREFERENCES;
    try {
      const raw = localStorage.getItem(FOOD_PREFERENCES_STORAGE_KEY);
      if (raw) local = parseFoodPreferences(JSON.parse(raw));
    } catch {
      // Corrupt data: start empty.
    }
    setPrefs(local);
    setLoaded(true);

    fetchRemoteFoodPreferences()
      .then((remote) => {
        if (cancelled || edited.current) return;
        if (remote) {
          setPrefs(remote);
          writeLocal(remote);
        } else if (hasData(local)) {
          saveRemoteFoodPreferences(local);
        }
      })
      .catch(() => {
        // Offline: keep the local copy.
      });

    return () => {
      cancelled = true;
      // Flush an edit that is still waiting to be saved so leaving the page does not lose it.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (pending.current) saveRemoteFoodPreferences(pending.current).catch(() => undefined);
    };
  }, []);

  const update = useCallback((updater: (prev: FoodPreferences) => FoodPreferences) => {
    edited.current = true;
    setPrefs((prev) => {
      const next = updater(prev);
      writeLocal(next);
      pending.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        pending.current = null;
        saveRemoteFoodPreferences(next).catch(() => undefined);
      }, 600);
      return next;
    });
  }, []);

  const setFood = useCallback(
    (entry: string, state: FoodState) => update((p) => setFoodState(p, entry, state)),
    [update]
  );
  const setSun = useCallback((sun: SunExposure | null) => update((p) => ({ ...p, sun })), [update]);
  const setActivity = useCallback((activity: ActivityLevel | null) => update((p) => ({ ...p, activity })), [update]);
  const clearFoods = useCallback(() => update((p) => ({ ...p, likes: [], avoid: [] })), [update]);

  return { prefs, loaded, setFood, setSun, setActivity, clearFoods };
}
