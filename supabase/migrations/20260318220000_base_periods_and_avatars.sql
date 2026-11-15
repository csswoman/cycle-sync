-- Base objects that were originally created by hand in the dashboard.

-- periods (period history)
CREATE TABLE IF NOT EXISTS public.periods (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date  date NOT NULL,
  end_date    date,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS periods_user_start_idx
  ON public.periods (user_id, start_date DESC);
-- RLS + policy are added in 20260318230000_phase2_schema.sql

-- avatars storage bucket (public read, files named "<user_id>-<random>.<ext>")
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%'));

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%'));

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%'));
