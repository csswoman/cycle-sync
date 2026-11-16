-- user_food_preferences: foods and dishes the user likes or avoids, plus sun exposure and activity.
-- Used to filter and generate recipes and to suggest foods/supplements. One row per user,
-- only readable and writable by its owner (RLS).
CREATE TABLE IF NOT EXISTS public.user_food_preferences (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  likes       text[] NOT NULL DEFAULT '{}' CHECK (cardinality(likes) <= 100),
  avoid       text[] NOT NULL DEFAULT '{}' CHECK (cardinality(avoid) <= 100),
  sun         text CHECK (sun IS NULL OR sun IN ('daily', 'sometimes', 'rarely')),
  activity    text CHECK (activity IS NULL OR activity IN ('sedentary', 'light', 'active')),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_food_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food preferences"
  ON public.user_food_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
