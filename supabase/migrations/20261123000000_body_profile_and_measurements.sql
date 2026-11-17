-- Body profile (height and starting point) and more body measurements.
-- Weight entered in /nutrition is logged to pmos_metrics so progress lives in one place.

-- 1. Height and starting weight on the user's config row.
ALTER TABLE public.cycle_config
  ADD COLUMN IF NOT EXISTS height_cm       numeric CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 220),
  ADD COLUMN IF NOT EXISTS start_weight_kg numeric CHECK (start_weight_kg IS NULL OR start_weight_kg BETWEEN 30 AND 250),
  ADD COLUMN IF NOT EXISTS start_date      date;

-- 2. More measurements next to waist and hip.
--    abdomen_cm: at the navel (waist_cm stays the narrowest point / WHO site).
ALTER TABLE public.pmos_metrics
  ADD COLUMN IF NOT EXISTS abdomen_cm numeric CHECK (abdomen_cm IS NULL OR abdomen_cm BETWEEN 30 AND 250),
  ADD COLUMN IF NOT EXISTS chest_cm   numeric CHECK (chest_cm   IS NULL OR chest_cm   BETWEEN 30 AND 250),
  ADD COLUMN IF NOT EXISTS arm_cm     numeric CHECK (arm_cm     IS NULL OR arm_cm     BETWEEN 10 AND 100),
  ADD COLUMN IF NOT EXISTS thigh_cm   numeric CHECK (thigh_cm   IS NULL OR thigh_cm   BETWEEN 20 AND 150);

-- 3. The "at least one value" CHECK must accept a row with only the new measurements.
DO $$
DECLARE c text;
BEGIN
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
  OR abdomen_cm IS NOT NULL OR chest_cm IS NOT NULL OR arm_cm IS NOT NULL OR thigh_cm IS NOT NULL
);
