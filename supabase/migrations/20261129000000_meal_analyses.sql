-- Saved meal photo analyses: a small thumbnail plus the AI result, so the user can look back at them.
CREATE TABLE IF NOT EXISTS public.meal_analyses (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Downscaled JPEG data URL (about 20-40 KB), not the original photo.
  thumbnail   text CHECK (thumbnail IS NULL OR char_length(thumbnail) <= 200000),
  -- Parsed MealAnalysis; null when the reply could not be parsed (then `raw` holds the text).
  result      jsonb,
  raw         text CHECK (raw IS NULL OR char_length(raw) <= 20000),
  CHECK (result IS NOT NULL OR raw IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS meal_analyses_user_created_idx ON public.meal_analyses (user_id, created_at DESC);

ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meal analyses" ON public.meal_analyses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
