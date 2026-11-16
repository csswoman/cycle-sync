-- workout_videos: curated catalog of YouTube videos (home workouts and dance).
-- Played with a youtube-nocookie.com iframe, so no YouTube API key is needed.
-- Readable by every signed-in user; written only with the service role key
-- (scripts/import-videos.ts), so there are no write policies.
CREATE TABLE IF NOT EXISTS public.workout_videos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url              text NOT NULL,
  youtube_id       text NOT NULL UNIQUE CHECK (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title            text NOT NULL,
  channel_name     text,
  category         text NOT NULL CHECK (category IN ('gym', 'dance', 'yoga', 'pilates')),
  -- cycle phases the video suits; 'any' means every phase
  phases           text[] NOT NULL DEFAULT '{any}'
                   CHECK (phases <@ ARRAY['menstrual', 'follicular', 'ovulation', 'luteal', 'any']::text[]),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  intensity        text NOT NULL CHECK (intensity IN ('low', 'medium', 'high')),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workout_videos_category_idx ON public.workout_videos (category);
CREATE INDEX IF NOT EXISTS workout_videos_phases_idx ON public.workout_videos USING gin (phases);
ALTER TABLE public.workout_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read workout videos" ON public.workout_videos;
CREATE POLICY "Read workout videos"
  ON public.workout_videos FOR SELECT TO authenticated
  USING (true);
