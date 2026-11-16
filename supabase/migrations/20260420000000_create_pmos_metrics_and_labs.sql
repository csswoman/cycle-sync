-- PMOS body/metabolic measurements (glucose, insulin, weight, waist, hip) and lab results.
-- Several readings per day are allowed (e.g. fasting and post-meal glucose).
CREATE TABLE IF NOT EXISTS public.pmos_metrics (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date             date NOT NULL DEFAULT CURRENT_DATE,
  glucose_mg_dl    numeric CHECK (glucose_mg_dl > 0),
  glucose_context  text CHECK (glucose_context IN ('fasting', 'post_meal', 'random')),
  insulin_uiu_ml   numeric CHECK (insulin_uiu_ml >= 0),
  weight_kg        numeric CHECK (weight_kg > 0),
  waist_cm         numeric CHECK (waist_cm > 0),
  hip_cm           numeric CHECK (hip_cm > 0),
  created_at       timestamptz DEFAULT now(),
  CHECK (glucose_mg_dl IS NULL OR glucose_context IS NOT NULL),
  CHECK (
    glucose_mg_dl IS NOT NULL OR insulin_uiu_ml IS NOT NULL OR weight_kg IS NOT NULL
    OR waist_cm IS NOT NULL OR hip_cm IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS pmos_metrics_user_date_idx
  ON public.pmos_metrics (user_id, date DESC);

ALTER TABLE public.pmos_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pmos_metrics"
  ON public.pmos_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.lab_results (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  marker      text NOT NULL CHECK (marker IN ('testosterone', 'lh', 'fsh', 'homa_ir', 'tsh', 'vitamin_d')),
  value       numeric NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_results_user_marker_date_idx
  ON public.lab_results (user_id, marker, date DESC);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lab_results"
  ON public.lab_results FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
