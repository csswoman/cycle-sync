import type { MealSlot } from '@/lib/planner/week';
import type { GlucoseContext } from '@/lib/pmos/metrics';

export interface MealColumns {
  meal_slot: MealSlot | null;
  meal_label: string | null;
  minutes_after_meal: 60 | 120 | null;
}

export type MealSelection =
  | { kind: 'planner'; slot: MealSlot; title: string }
  | { kind: 'free'; text: string; slot: MealSlot | null };

export type BuildMealColumnsResult =
  | { ok: true; columns: MealColumns }
  | { ok: false; error: 'slot_required' };

const EMPTY: MealColumns = { meal_slot: null, meal_label: null, minutes_after_meal: null };

/** Maps the glucose form state to the three meal columns. */
export function buildMealColumns(input: {
  context: GlucoseContext;
  selection: MealSelection | null;
  interval: 1 | 2 | null;
}): BuildMealColumnsResult {
  if (input.context !== 'post_meal') return { ok: true, columns: { ...EMPTY } };

  const minutes = input.interval === 1 ? 60 : input.interval === 2 ? 120 : null;
  const sel = input.selection;

  if (!sel) return { ok: true, columns: { ...EMPTY, minutes_after_meal: minutes } };

  if (sel.kind === 'planner') {
    return {
      ok: true,
      columns: { meal_slot: sel.slot, meal_label: sel.title.trim() || null, minutes_after_meal: minutes },
    };
  }

  const text = sel.text.trim();
  if (!text) return { ok: true, columns: { ...EMPTY, minutes_after_meal: minutes } };
  if (!sel.slot) return { ok: false, error: 'slot_required' };
  return { ok: true, columns: { meal_slot: sel.slot, meal_label: text, minutes_after_meal: minutes } };
}

/** "Añadir glucosa" shows only for done meals and only when the columns exist. */
export function canAddGlucoseFromMeal(done: boolean, mealColumnsAvailable: boolean): boolean {
  return done && mealColumnsAvailable;
}
