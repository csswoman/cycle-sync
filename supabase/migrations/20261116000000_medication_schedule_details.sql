-- Richer medication schedules: which weekdays a medication is taken, the doctor's
-- instruction for each intake (e.g. "after lunch") and when the treatment started.
ALTER TABLE public.medications
  -- 0 = Sunday … 6 = Saturday. NULL means every day.
  ADD COLUMN IF NOT EXISTS days_of_week smallint[],
  -- Maps an intake time ('HH:MM') to an instruction key such as 'after_lunch'.
  ADD COLUMN IF NOT EXISTS time_instructions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS start_date date;

CREATE INDEX IF NOT EXISTS medication_logs_med_date_idx
  ON public.medication_logs (medication_id, date);
