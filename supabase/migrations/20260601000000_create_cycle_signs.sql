-- cycle_signs: per-day body signs that are not a period.
-- spotting (light bleeding outside the period, never counted as a period), basal body temperature,
-- cervical mucus and sexual activity. One row per user and day.
-- Sexual activity is sensitive: it is only readable by its owner (RLS) and is not included in
-- exports or AI context.
CREATE TABLE IF NOT EXISTS public.cycle_signs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date            date NOT NULL,
  spotting        boolean NOT NULL DEFAULT false,
  bbt_celsius     numeric(4,2) CHECK (bbt_celsius IS NULL OR bbt_celsius BETWEEN 34 AND 40),
  -- Short sleep, illness, alcohol or a different time: the reading is kept but not used to detect ovulation.
  bbt_disturbed   boolean NOT NULL DEFAULT false,
  cervical_mucus  text CHECK (cervical_mucus IS NULL OR cervical_mucus IN ('dry', 'sticky', 'creamy', 'watery', 'eggwhite')),
  sex_count       smallint NOT NULL DEFAULT 0 CHECK (sex_count BETWEEN 0 AND 10),
  sex_protection  text CHECK (sex_protection IS NULL OR sex_protection IN ('protected', 'unprotected')),
  notes           text CHECK (notes IS NULL OR char_length(notes) <= 300),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS cycle_signs_user_date_idx ON public.cycle_signs (user_id, date DESC);

ALTER TABLE public.cycle_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cycle signs"
  ON public.cycle_signs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
