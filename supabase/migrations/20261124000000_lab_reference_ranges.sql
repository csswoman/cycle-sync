-- Reference range printed by the user's own lab, stored in the marker's canonical unit.
-- When present it takes priority over the app's typical range for the low/high flag.
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS ref_low  numeric,
  ADD COLUMN IF NOT EXISTS ref_high numeric;

ALTER TABLE public.lab_results DROP CONSTRAINT IF EXISTS lab_results_ref_range_check;
ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_ref_range_check
  CHECK (ref_low IS NULL OR ref_high IS NULL OR ref_low <= ref_high);
