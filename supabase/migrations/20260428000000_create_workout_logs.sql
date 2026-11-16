-- workout_logs: user's completed workouts (exercise, sets, weight or duration, how they felt).
-- id is generated on the client so offline-created rows can be upserted idempotently.
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id               uuid PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date             date NOT NULL,
  exercise         text NOT NULL,
  sets             integer CHECK (sets IS NULL OR sets > 0),
  weight_kg        numeric(6,2) CHECK (weight_kg IS NULL OR weight_kg >= 0),
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  feeling          smallint NOT NULL CHECK (feeling BETWEEN 1 AND 5),
  notes            text,
  phase            text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_logs_user_date_idx
  ON public.workout_logs (user_id, date DESC, created_at DESC);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout logs"
  ON public.workout_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
