-- Quick daily check-in: cravings and motivation ("ganas de moverme"), logged in one tap from the dashboard.
-- cravings holds 'sweet' | 'salty' | 'carbs'; 'Sugar Cravings' is still added to symptoms for older insights.
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS cravings          text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS craving_intensity smallint,
  ADD COLUMN IF NOT EXISTS motivation        smallint;

ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_craving_intensity_check;
ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_craving_intensity_check
  CHECK (craving_intensity IS NULL OR craving_intensity BETWEEN 1 AND 3);

ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_motivation_check;
ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_motivation_check
  CHECK (motivation IS NULL OR motivation BETWEEN 1 AND 3);
