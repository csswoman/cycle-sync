-- Answers of the personalization questionnaire (/archetype): goal, regularity, contraception, symptoms, activity.
ALTER TABLE public.cycle_config
  ADD COLUMN IF NOT EXISTS onboarding_answers jsonb;
