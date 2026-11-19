-- Goals shown in /nutrition → Progress: a goal weight and the habits the user wants to build.
ALTER TABLE public.cycle_config
  ADD COLUMN IF NOT EXISTS goal_weight_kg numeric CHECK (goal_weight_kg IS NULL OR goal_weight_kg BETWEEN 30 AND 250),
  -- Keys from src/lib/body/goals.ts: eat_better, cravings, sleep, movement, stress, hydration.
  ADD COLUMN IF NOT EXISTS focus_habits   text[] NOT NULL DEFAULT '{}';
