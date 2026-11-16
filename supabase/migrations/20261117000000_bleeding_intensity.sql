-- Bleeding intensity and pain per day. Lives in cycle_signs, which already has one row per user and day.
-- flow: light / medium / heavy / very_heavy ("soaking a pad or tampon every 1 to 2 hours").
-- pain: 0 to 10.
ALTER TABLE public.cycle_signs
  ADD COLUMN IF NOT EXISTS flow  text CHECK (flow IS NULL OR flow IN ('light', 'medium', 'heavy', 'very_heavy')),
  ADD COLUMN IF NOT EXISTS clots boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pain  smallint CHECK (pain IS NULL OR pain BETWEEN 0 AND 10);
