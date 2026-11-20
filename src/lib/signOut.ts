'use client';

import { supabase } from '@/lib/supabase';
import { db } from '@/lib/offlineDb';
import { syncAll } from '@/hooks/useOfflineSync';
import { getPendingSyncCount } from '@/lib/offlineHelpers';

/** localStorage keys that hold health data (theme and language stay). */
const PERSONAL_STORAGE_KEYS = [
  'cycle_sync_first_meal_time',
  'cycle_sync_meals_per_day',
  'cycle_sync_user_height_cm',
  'cycle_sync_user_weight_kg',
  'cs_onboarding_answers',
];

function clearPersonalStorage() {
  try {
    PERSONAL_STORAGE_KEYS.forEach((k) => window.localStorage.removeItem(k));
    window.sessionStorage.clear();
  } catch {
    // Storage blocked: nothing stored there either.
  }
}

/** Removes every offline row and personal browser key from this device. */
export async function clearAllLocalData() {
  await Promise.all(db.tables.map((t) => t.clear())).catch(() => undefined);
  clearPersonalStorage();
}

/** Removes rows already saved on the server; unsynced rows are kept so nothing is lost. */
export async function clearSyncedLocalData() {
  await Promise.all(
    db.tables.map((t) => t.filter((row: { synced?: boolean }) => row.synced !== false).delete()),
  ).catch(() => undefined);
  clearPersonalStorage();
}

/**
 * Signs out and wipes this device's copy of the user's health data.
 * Tries to upload pending offline entries first; if some can't be uploaded, asks before discarding them.
 * Returns false if the user cancelled.
 */
export async function signOutAndClearDevice(es: boolean): Promise<boolean> {
  await syncAll();
  const pending = await getPendingSyncCount().catch(() => 0);
  if (pending > 0) {
    const ok = window.confirm(
      es
        ? `Tienes ${pending} registro(s) sin sincronizar (sin conexión). Si cierras sesión ahora se borrarán de este dispositivo. ¿Cerrar sesión de todos modos?`
        : `You have ${pending} unsynced entr${pending === 1 ? 'y' : 'ies'} (offline). Signing out now will delete them from this device. Sign out anyway?`,
    );
    if (!ok) return false;
  }
  await supabase.auth.signOut().catch(() => undefined);
  await clearAllLocalData();
  return true;
}
