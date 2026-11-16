-- recipes: shared catalog of app content (recipes generated with Gemini or imported
-- from PDFs) plus private recipes created by a user.
--   owner_id IS NULL  -> catalog recipe, visible to every signed-in user.
--                        Written only by the server with the service role key.
--   owner_id = user   -> private recipe created by that user.
CREATE TABLE IF NOT EXISTS public.recipes (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source           text NOT NULL CHECK (source IN ('gemini', 'pdf', 'custom')),
  language         text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  title            text NOT NULL,
  -- normalized title (accents, stop words and word order removed) used to detect duplicates
  title_key        text NOT NULL,
  description      text,
  image_url        text,
  ready_in_minutes integer,
  servings         integer,
  ingredients      jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps            jsonb NOT NULL DEFAULT '[]'::jsonb,
  nutrition        jsonb,
  tags             text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- One catalog recipe per normalized title and language.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_catalog_title_key_idx
  ON public.recipes (language, title_key) WHERE owner_id IS NULL;
CREATE INDEX IF NOT EXISTS recipes_owner_idx ON public.recipes (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS recipes_tags_idx ON public.recipes USING gin (tags);

CREATE OR REPLACE FUNCTION public.recipes_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recipes_set_updated_at ON public.recipes;
CREATE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.recipes_set_updated_at();

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read catalog and own recipes" ON public.recipes;
CREATE POLICY "Read catalog and own recipes"
  ON public.recipes FOR SELECT TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Create own recipes" ON public.recipes;
CREATE POLICY "Create own recipes"
  ON public.recipes FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND source = 'custom');

DROP POLICY IF EXISTS "Update own recipes" ON public.recipes;
CREATE POLICY "Update own recipes"
  ON public.recipes FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND source = 'custom');

DROP POLICY IF EXISTS "Delete own recipes" ON public.recipes;
CREATE POLICY "Delete own recipes"
  ON public.recipes FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Per-user state on top of any visible recipe: favorites and personal tags.
CREATE TABLE IF NOT EXISTS public.user_recipes (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id   uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own recipe state" ON public.user_recipes;
CREATE POLICY "Users manage own recipe state"
  ON public.user_recipes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recipe photos. Public read; uploads only with the service role key
-- (scripts/import-recipe-images.ts), so no write policies for regular users.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-images', 'recipe-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Recipe images are public" ON storage.objects;
CREATE POLICY "Recipe images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');
