'use client';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_DISPLAY_PREFS, loadDisplayPrefs, parseDisplayPrefs, saveDisplayPrefs, subscribeDisplayPrefs,
  type DisplayPrefs,
} from '@/lib/displayPrefs';

// useSyncExternalStore needs a stable snapshot between changes.
let cacheRaw = '';
let cacheValue: DisplayPrefs = DEFAULT_DISPLAY_PREFS;
function snapshot(): DisplayPrefs {
  const fresh = loadDisplayPrefs();
  const raw = JSON.stringify(fresh);
  if (raw !== cacheRaw) { cacheRaw = raw; cacheValue = fresh; }
  return cacheValue;
}

let remoteLoaded = false;

/**
 * Display preferences. The local copy is returned right away; the copy in
 * `cycle_config.display_prefs` replaces it once it arrives, so a new device keeps the choice.
 * If the column does not exist yet the local copy is used.
 */
export function useDisplayPrefs() {
  const prefs = useSyncExternalStore(subscribeDisplayPrefs, snapshot, () => DEFAULT_DISPLAY_PREFS);

  useEffect(() => {
    if (remoteLoaded) return;
    remoteLoaded = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { remoteLoaded = false; return; }
        const { data, error } = await supabase.from('cycle_config').select('display_prefs').eq('user_id', session.user.id).maybeSingle();
        if (error) return;
        const remote = (data as { display_prefs?: unknown } | null)?.display_prefs;
        if (remote && typeof remote === 'object' && Object.keys(remote).length > 0) saveDisplayPrefs(parseDisplayPrefs(remote));
      } catch {
        remoteLoaded = false;
      }
    })();
  }, []);

  const update = useCallback(async (patch: Partial<DisplayPrefs>) => {
    const next = { ...loadDisplayPrefs(), ...patch };
    saveDisplayPrefs(next);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { error } = await supabase.from('cycle_config').upsert(
        { user_id: session.user.id, display_prefs: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
      if (error) console.warn('display_prefs not saved remotely:', error.message);
    } catch {
      // Offline: the local copy still applies.
    }
  }, []);

  return { prefs, hideNumbers: prefs.hideNumbers, update };
}
