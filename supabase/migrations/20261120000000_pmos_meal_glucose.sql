-- Phase 5: link post-meal glucose readings to the meal that preceded them.
-- meal_label is a copy of the meal title because planner entries get replaced.
ALTER TABLE public.pmos_metrics
  ADD COLUMN IF NOT EXISTS meal_slot text
    CHECK (meal_slot IS NULL OR meal_slot IN ('breakfast', 'lunch', 'snack', 'dinner')),
  ADD COLUMN IF NOT EXISTS meal_label text,
  ADD COLUMN IF NOT EXISTS minutes_after_meal smallint
    CHECK (minutes_after_meal IS NULL OR minutes_after_meal IN (60, 120));
