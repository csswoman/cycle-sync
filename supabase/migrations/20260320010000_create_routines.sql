-- routines (saved workout routines). Was referenced by the app but missing from migrations.
CREATE TABLE IF NOT EXISTS public.routines (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  description text,
  exercises   jsonb NOT NULL DEFAULT '[]'::jsonb,
  phase       text,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS routines_user_created_idx
  ON public.routines (user_id, created_at DESC);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own routines"
  ON public.routines FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
