-- Lab results: more markers and the origin of each row (typed by hand or read from a scanned file).
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.lab_results'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%marker%'
  LOOP
    EXECUTE format('ALTER TABLE public.lab_results DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_marker_check CHECK (marker IN (
  'testosterone', 'lh', 'fsh', 'homa_ir', 'tsh', 'vitamin_d',
  'shbg', 'amh', 'prolactin', 'hba1c', 'fasting_glucose', 'fasting_insulin',
  'total_cholesterol', 'ldl', 'hdl', 'triglycerides', 'vitamin_b12',
  'ferritin', 'dheas', 'androstenedione', 'free_testosterone', 'ohp17',
  'glucose_2h', 'alt', 'ast', 'progesterone', 'estradiol'
));
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'scan'));
