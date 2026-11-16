-- PMOS care expansion: pill packs and stock, more lab markers, blood pressure, LH tests,
-- monthly wellbeing check-ins, hirsutism (Ferriman-Gallwey) scores, private progress photos
-- and questions for the next doctor visit.

-- 1. Medications: pill packs (e.g. 21 active + 7 break) and stock for refill alerts.
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS pack_active_days smallint CHECK (pack_active_days IS NULL OR pack_active_days BETWEEN 1 AND 90),
  ADD COLUMN IF NOT EXISTS pack_break_days  smallint CHECK (pack_break_days IS NULL OR pack_break_days BETWEEN 0 AND 30),
  ADD COLUMN IF NOT EXISTS pack_start_date  date,
  ADD COLUMN IF NOT EXISTS stock            numeric CHECK (stock IS NULL OR stock >= 0),
  ADD COLUMN IF NOT EXISTS units_per_dose   numeric NOT NULL DEFAULT 1 CHECK (units_per_dose > 0),
  ADD COLUMN IF NOT EXISTS refill_alert_days smallint NOT NULL DEFAULT 7 CHECK (refill_alert_days BETWEEN 0 AND 60);

-- 2. Lab markers: replace the original CHECK with the extended list.
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
  'total_cholesterol', 'ldl', 'hdl', 'triglycerides', 'vitamin_b12'
));

-- 3. Blood pressure next to glucose and body measurements.
ALTER TABLE public.pmos_metrics
  ADD COLUMN IF NOT EXISTS systolic  smallint CHECK (systolic IS NULL OR systolic BETWEEN 60 AND 260),
  ADD COLUMN IF NOT EXISTS diastolic smallint CHECK (diastolic IS NULL OR diastolic BETWEEN 30 AND 160);

DO $$
DECLARE c text;
BEGIN
  -- The "at least one value" CHECK must also accept a blood-pressure-only row.
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.pmos_metrics'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%hip_cm IS NOT NULL%'
  LOOP
    EXECUTE format('ALTER TABLE public.pmos_metrics DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.pmos_metrics ADD CONSTRAINT pmos_metrics_has_value CHECK (
  glucose_mg_dl IS NOT NULL OR insulin_uiu_ml IS NOT NULL OR weight_kg IS NOT NULL
  OR waist_cm IS NOT NULL OR hip_cm IS NOT NULL OR systolic IS NOT NULL
);

-- 4. Ovulation (LH) strip result per day.
ALTER TABLE public.cycle_signs
  ADD COLUMN IF NOT EXISTS lh_test text CHECK (lh_test IS NULL OR lh_test IN ('negative', 'positive'));

-- 5. Monthly wellbeing check-in: PHQ-2, GAD-2 and sleep-apnea screening questions.
CREATE TABLE IF NOT EXISTS public.wellbeing_checks (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date               date NOT NULL DEFAULT CURRENT_DATE,
  phq_interest       smallint NOT NULL CHECK (phq_interest BETWEEN 0 AND 3),
  phq_mood           smallint NOT NULL CHECK (phq_mood BETWEEN 0 AND 3),
  gad_nervous        smallint NOT NULL CHECK (gad_nervous BETWEEN 0 AND 3),
  gad_worry          smallint NOT NULL CHECK (gad_worry BETWEEN 0 AND 3),
  snoring            boolean NOT NULL DEFAULT false,
  daytime_tiredness  boolean NOT NULL DEFAULT false,
  observed_apnea     boolean NOT NULL DEFAULT false,
  created_at         timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wellbeing_checks_user_date_idx ON public.wellbeing_checks (user_id, date DESC);
ALTER TABLE public.wellbeing_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wellbeing checks" ON public.wellbeing_checks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6a. Modified Ferriman-Gallwey self-assessment (9 body areas scored 0-4).
CREATE TABLE IF NOT EXISTS public.hirsutism_scores (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  scores      jsonb NOT NULL,
  total       smallint NOT NULL CHECK (total BETWEEN 0 AND 36),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hirsutism_scores_user_date_idx ON public.hirsutism_scores (user_id, date DESC);
ALTER TABLE public.hirsutism_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hirsutism scores" ON public.hirsutism_scores FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6b. Private progress photos (acne, hair). Files live in the private 'progress-photos' bucket
-- under '<user_id>/...'; they are only reachable through short-lived signed URLs.
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  area        text NOT NULL CHECK (area IN ('face', 'chin', 'scalp', 'body', 'other')),
  path        text NOT NULL,
  note        text CHECK (note IS NULL OR char_length(note) <= 200),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS progress_photos_user_area_idx ON public.progress_photos (user_id, area, date);
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress photos" ON public.progress_photos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('progress-photos', 'progress-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own progress photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own progress photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own progress photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Questions to bring to the next appointment.
CREATE TABLE IF NOT EXISTS public.doctor_questions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question    text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 500),
  answer      text CHECK (answer IS NULL OR char_length(answer) <= 1000),
  done        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS doctor_questions_user_idx ON public.doctor_questions (user_id, created_at DESC);
ALTER TABLE public.doctor_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own doctor questions" ON public.doctor_questions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
