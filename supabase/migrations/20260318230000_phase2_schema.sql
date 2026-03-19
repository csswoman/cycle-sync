-- ─────────────────────────────────────────
-- 1. cycle_config  (perfil del ciclo)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cycle_config (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cycle_length    int  NOT NULL DEFAULT 28,
  last_period_start date,
  workout_prefs   text[] DEFAULT '{}',
  dietary_prefs   text[] DEFAULT '{}',
  archetype       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.cycle_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cycle_config"
  ON public.cycle_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 2. daily_logs  (registro diario)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  mood          text,
  energy_level  int  CHECK (energy_level BETWEEN 1 AND 10),
  sleep_hours   numeric(3,1),
  sleep_quality text,
  symptoms      text[] DEFAULT '{}',
  notes         text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily_logs"
  ON public.daily_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 3. pcos_symptoms  (tracking PCOS)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pcos_symptoms (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date         date NOT NULL DEFAULT CURRENT_DATE,
  acne         int DEFAULT 0 CHECK (acne BETWEEN 0 AND 3),
  fatigue      int DEFAULT 0 CHECK (fatigue BETWEEN 0 AND 3),
  hirsutism    int DEFAULT 0 CHECK (hirsutism BETWEEN 0 AND 3),
  hair_loss    int DEFAULT 0 CHECK (hair_loss BETWEEN 0 AND 3),
  mood_swings  int DEFAULT 0 CHECK (mood_swings BETWEEN 0 AND 3),
  bloating     int DEFAULT 0 CHECK (bloating BETWEEN 0 AND 3),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.pcos_symptoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pcos_symptoms"
  ON public.pcos_symptoms FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 4. habits  (definición de hábitos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'custom',
  goal       numeric,
  unit       text,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits"
  ON public.habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 5. habit_logs  (registro diario de hábitos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id   uuid REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  value      numeric,
  completed  boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habit_logs"
  ON public.habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 6. RLS en la tabla periods existente
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'periods' AND policyname = 'Users manage own periods'
  ) THEN
    ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users manage own periods"
      ON public.periods FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
