-- Display preferences ("no numbers" mode) and the optional SCOFF eating-disorder screener.
ALTER TABLE public.cycle_config
  ADD COLUMN IF NOT EXISTS display_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Number of positive SCOFF answers (0 to 5); null when the question block was not answered.
ALTER TABLE public.wellbeing_checks
  ADD COLUMN IF NOT EXISTS scoff smallint CHECK (scoff IS NULL OR scoff BETWEEN 0 AND 5);
