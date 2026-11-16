/** Display preferences kept in localStorage and mirrored in `cycle_config.display_prefs`. */
export interface DisplayPrefs {
  /** Hides calories, macros, weight and waist everywhere in the app and in the report. */
  hideNumbers: boolean;
}

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = { hideNumbers: false };
const KEY = 'cycle_sync_display_prefs';
const EVENT = 'cycle-sync-display-prefs';

/** Reads whatever shape came from storage or the database and returns a safe object. */
export function parseDisplayPrefs(raw: unknown): DisplayPrefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { hideNumbers: o.hideNumbers === true };
}

export function loadDisplayPrefs(): DisplayPrefs {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_PREFS;
  try {
    return parseDisplayPrefs(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
  } catch {
    return DEFAULT_DISPLAY_PREFS;
  }
}

export function saveDisplayPrefs(prefs: DisplayPrefs): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage full or blocked */ }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeDisplayPrefs(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
