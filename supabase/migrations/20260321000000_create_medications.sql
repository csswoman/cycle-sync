-- Medications (e.g. metformin, inositol, birth control, vitamin D) and their daily intake logs.
CREATE TABLE IF NOT EXISTS public.medications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  dose        text,
  -- Local times of day in 'HH:MM' (24h), one entry per daily intake.
  times       text[] NOT NULL DEFAULT '{}',
  notes       text,
  reminders   boolean NOT NULL DEFAULT true,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medications_user_idx
  ON public.medications (user_id, created_at);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medications"
  ON public.medications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id   uuid REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  date            date NOT NULL,
  scheduled_time  text NOT NULL,
  taken           boolean NOT NULL DEFAULT false,
  taken_at        timestamptz,
  UNIQUE (medication_id, date, scheduled_time)
);
CREATE INDEX IF NOT EXISTS medication_logs_user_date_idx
  ON public.medication_logs (user_id, date DESC);
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medication logs"
  ON public.medication_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
