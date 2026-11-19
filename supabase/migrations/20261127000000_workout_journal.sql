-- Workout journal: structured history per user.
-- Every log already belongs to the user (RLS on user_id). These columns record where it came from
-- so history, calendar, streak and "continue your program" are read from the database instead of
-- being parsed from the note or kept in the browser.

ALTER TABLE public.workout_logs
  -- free: exercise typed by hand · routine: from a saved routine · program: from a program day
  -- video: guided video · quick: quick check-in · session: summary row of a whole session
  ADD COLUMN IF NOT EXISTS source      text CHECK (source IS NULL OR source IN ('free', 'routine', 'program', 'video', 'quick', 'session')),
  -- Routine uuid, program routine id ("home-abs-r1") or video id.
  ADD COLUMN IF NOT EXISTS ref_id      text,
  -- Human name of the reference ("Abdomen y Core en Casa · Rutina 1").
  ADD COLUMN IF NOT EXISTS ref_name    text,
  -- Rows saved together share it: the session row and its exercises.
  ADD COLUMN IF NOT EXISTS session_id  uuid,
  -- [{ "reps": 10, "weight": 20 }, ...] for strength work.
  ADD COLUMN IF NOT EXISTS set_details jsonb CHECK (set_details IS NULL OR jsonb_typeof(set_details) = 'array');

CREATE INDEX IF NOT EXISTS workout_logs_user_session_idx
  ON public.workout_logs (user_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workout_logs_user_source_idx
  ON public.workout_logs (user_id, source, date DESC);

-- Rows saved before this migration: recover the origin from the note they were written with.
UPDATE public.workout_logs SET source = 'session' WHERE source IS NULL AND notes LIKE 'Sesión completada%';
UPDATE public.workout_logs SET source = 'video'   WHERE source IS NULL AND notes = 'Video guiado';
UPDATE public.workout_logs SET source = 'quick'   WHERE source IS NULL AND notes = 'Registro rápido';
UPDATE public.workout_logs SET source = 'program' WHERE source IS NULL AND notes LIKE '% — %';
UPDATE public.workout_logs SET source = 'free'    WHERE source IS NULL;

-- Meal settings used by /nutrition (they were only kept on the device).
ALTER TABLE public.cycle_config
  ADD COLUMN IF NOT EXISTS meals_per_day   smallint CHECK (meals_per_day IS NULL OR meals_per_day BETWEEN 3 AND 4),
  ADD COLUMN IF NOT EXISTS first_meal_time text     CHECK (first_meal_time IS NULL OR first_meal_time ~ '^[0-2][0-9]:[0-5][0-9]$');
