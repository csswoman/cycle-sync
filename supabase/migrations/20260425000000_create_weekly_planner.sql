-- Weekly planner: meals and workouts planned per day, grocery checks and pantry.
-- Everything is private to the user (RLS on user_id).

CREATE TABLE IF NOT EXISTS public.meal_plan_entries (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date   date NOT NULL,
  slot        text NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'snack', 'dinner')),
  title       text NOT NULL,
  recipe_id   uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  done        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date, slot)
);

CREATE TABLE IF NOT EXISTS public.workout_plan_entries (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date        date NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('video', 'gym', 'rest')),
  video_id         uuid REFERENCES public.workout_videos(id) ON DELETE SET NULL,
  title            text NOT NULL,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  done             boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

-- Grocery items the user already ticked for a given week (list itself is derived from the meals).
CREATE TABLE IF NOT EXISTS public.grocery_checks (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  item_key   text NOT NULL,
  PRIMARY KEY (user_id, week_start, item_key)
);

CREATE TABLE IF NOT EXISTS public.pantry_items (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS meal_plan_entries_user_date_idx ON public.meal_plan_entries (user_id, plan_date);
CREATE INDEX IF NOT EXISTS workout_plan_entries_user_date_idx ON public.workout_plan_entries (user_id, plan_date);

ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meal plan" ON public.meal_plan_entries;
CREATE POLICY "Users manage own meal plan"
  ON public.meal_plan_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own workout plan" ON public.workout_plan_entries;
CREATE POLICY "Users manage own workout plan"
  ON public.workout_plan_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own grocery checks" ON public.grocery_checks;
CREATE POLICY "Users manage own grocery checks"
  ON public.grocery_checks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own pantry" ON public.pantry_items;
CREATE POLICY "Users manage own pantry"
  ON public.pantry_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
