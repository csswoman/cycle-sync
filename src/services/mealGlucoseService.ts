import { supabase } from '@/lib/supabase';

export const MEAL_COLUMN_NAMES = ['meal_slot', 'meal_label', 'minutes_after_meal'] as const;

/** Probes the new columns; any error means the migration is not applied. */
export async function mealColumnsAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase.from('pmos_metrics').select('meal_slot').limit(1);
    return !error;
  } catch {
    return false;
  }
}

const isMissingColumn = (err: { code?: string } | null) =>
  err?.code === '42703' || err?.code === 'PGRST204';

/**
 * Inserts a pmos_metrics row for the signed-in user. If a meal column does not exist,
 * retries once without the meal fields.
 */
export async function insertMetric(
  row: Record<string, unknown>,
): Promise<{ ok: true; mealColumnsMissing: boolean } | { ok: false; message: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { ok: false, message: 'No session' };

  const payload = { ...row, user_id: session.user.id };
  const { error } = await supabase.from('pmos_metrics').insert(payload);
  if (!error) return { ok: true, mealColumnsMissing: false };
  if (!isMissingColumn(error)) return { ok: false, message: error.message };

  const stripped = { ...payload } as Record<string, unknown>;
  for (const c of MEAL_COLUMN_NAMES) delete stripped[c];
  const retry = await supabase.from('pmos_metrics').insert(stripped);
  if (retry.error) return { ok: false, message: retry.error.message };
  return { ok: true, mealColumnsMissing: true };
}
