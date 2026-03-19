create table if not exists public.health_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  steps integer default 0,
  distance_meters double precision default 0,
  active_calories double precision default 0,
  total_calories double precision default 0,
  resting_heart_rate integer,
  avg_heart_rate integer,
  sleep_duration_seconds integer default 0,
  sleep_stages jsonb,
  weight_kg double precision,
  source text default 'health_connect',
  raw_payload jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.health_data enable row level security;

create policy "Users can manage their own health data"
  on public.health_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
