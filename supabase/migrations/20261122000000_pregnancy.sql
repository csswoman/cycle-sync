-- Phase 9: pregnancy test result per day and pregnancy intervals.
-- A pregnancy only stops predictions and alerts; it does not store an outcome.
ALTER TABLE public.cycle_signs
  ADD COLUMN IF NOT EXISTS pregnancy_test text CHECK (pregnancy_test IS NULL OR pregnancy_test IN ('negative', 'positive'));

CREATE TABLE IF NOT EXISTS public.pregnancies (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date          date NOT NULL,
  positive_test_date  date,
  end_date            date,
  created_at          timestamptz DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS pregnancies_user_start_idx ON public.pregnancies (user_id, start_date DESC);
ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pregnancies" ON public.pregnancies FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ovulation induction: a medication can be marked as induction, with the days of the cycle it is taken.
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS is_ovulation_induction boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS induction_cycle_days int[];
