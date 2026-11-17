/** Tables with a `user_id` column that belong to the user. Webhook and OAuth tokens are secrets and are left out. */
export const EXPORT_TABLES = [
  'appointments', 'cycle_config', 'cycle_signs', 'daily_logs', 'doctor_questions',
  'grocery_checks', 'habit_logs', 'habits', 'health_data', 'health_events', 'health_records',
  'hirsutism_scores', 'lab_results', 'meal_plan_entries', 'medication_dose_changes',
  'medication_logs', 'medication_side_effects', 'medications', 'pantry_items', 'pcos_symptoms',
  'periods', 'pmos_diagnosis', 'pmos_metrics', 'pregnancies', 'progress_photos', 'recipes', 'routines',
  'user_food_preferences', 'user_recipes', 'wellbeing_checks', 'workout_logs', 'workout_plan_entries',
] as const;

export interface UserDataExport {
  exportedAt: string;
  userId: string;
  email: string | null;
  /** Rows per table. Tables that could not be read (migration not applied) are listed in `skipped`. */
  tables: Record<string, unknown[]>;
  skipped: string[];
  note: string;
}

export function buildExport(
  user: { id: string; email?: string | null },
  results: Record<string, unknown[] | null>,
  exportedAt: Date = new Date(),
): UserDataExport {
  const tables: Record<string, unknown[]> = {};
  const skipped: string[] = [];
  for (const name of EXPORT_TABLES) {
    const rows = results[name];
    if (rows == null) skipped.push(name);
    else if (rows.length > 0) tables[name] = rows;
  }
  return {
    exportedAt: exportedAt.toISOString(),
    userId: user.id,
    email: user.email ?? null,
    tables,
    skipped,
    note: 'Progress photo files are not included, only their metadata. Webhook tokens are left out on purpose.',
  };
}
