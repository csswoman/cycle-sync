-- Phase 7: appointments, diagnosis card, health events and medication side effects.
-- Every table is per user with RLS auth.uid() = user_id.

CREATE TABLE IF NOT EXISTS public.appointments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        date NOT NULL,
  time        time,
  specialty   text CHECK (specialty IS NULL OR char_length(specialty) <= 100),
  doctor      text CHECK (doctor IS NULL OR char_length(doctor) <= 150),
  place       text CHECK (place IS NULL OR char_length(place) <= 200),
  notes       text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  summary     text CHECK (summary IS NULL OR char_length(summary) <= 2000),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_user_date_idx ON public.appointments (user_id, date DESC);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own appointments" ON public.appointments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.doctor_questions
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.pmos_diagnosis (
  user_id                       uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  diagnosed_on                  date,
  irregular_cycles              boolean NOT NULL DEFAULT false,
  clinical_hyperandrogenism     boolean NOT NULL DEFAULT false,
  biochemical_hyperandrogenism  boolean NOT NULL DEFAULT false,
  polycystic_ovaries            boolean NOT NULL DEFAULT false,
  notes                         text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  updated_at                    timestamptz DEFAULT now()
);
ALTER TABLE public.pmos_diagnosis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own diagnosis" ON public.pmos_diagnosis FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.health_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        date NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('ultrasound', 'procedure', 'other')),
  summary     text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS health_events_user_date_idx ON public.health_events (user_id, date DESC);
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health events" ON public.health_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.medication_side_effects (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id  uuid REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  date           date NOT NULL,
  effect         text NOT NULL CHECK (char_length(effect) BETWEEN 1 AND 100),
  severity       smallint NOT NULL CHECK (severity BETWEEN 1 AND 3),
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medication_side_effects_user_idx ON public.medication_side_effects (user_id, date DESC);
ALTER TABLE public.medication_side_effects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own side effects" ON public.medication_side_effects FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dose changes the user enters by hand: new dose, start date and for how many weeks to watch for side effects.
CREATE TABLE IF NOT EXISTS public.medication_dose_changes (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id  uuid REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  date           date NOT NULL,
  dose           text NOT NULL CHECK (char_length(dose) BETWEEN 1 AND 100),
  weeks          smallint NOT NULL DEFAULT 8 CHECK (weeks BETWEEN 1 AND 26),
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medication_dose_changes_user_idx ON public.medication_dose_changes (user_id, date DESC);
ALTER TABLE public.medication_dose_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dose changes" ON public.medication_dose_changes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
