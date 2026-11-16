-- Custom routines: training day (0 = Monday ... 6 = Sunday) and muscle groups worked.
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS weekday smallint CHECK (weekday BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS muscle_groups text[] NOT NULL DEFAULT '{}';
