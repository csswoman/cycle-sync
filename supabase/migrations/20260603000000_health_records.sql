-- Individual health records (device samples + manual entries).
-- health_data (daily summary) is recomputed from these rows, so re-sent
-- webhook batches are idempotent instead of being summed twice.
create table if not exists public.health_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  metric text not null check (metric in (
    'steps', 'distance', 'active_calories', 'total_calories',
    'heart_rate', 'resting_heart_rate', 'sleep', 'weight', 'activity'
  )),
  source text not null check (source in ('health_connect', 'manual')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  -- steps: count, distance: meters, *_calories: kcal, *heart_rate: bpm,
  -- sleep: seconds, weight: kg, activity: minutes
  value double precision not null,
  local_date date not null,
  details jsonb,
  created_at timestamptz default now(),
  unique (user_id, metric, source, start_time, end_time)
);

create index if not exists health_records_user_date_idx
  on public.health_records (user_id, local_date);

alter table public.health_records enable row level security;

create policy "Users can manage their own health records"
  on public.health_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Timezone used to assign webhook timestamps (UTC) to the user's local day.
alter table public.health_webhook_tokens
  add column if not exists timezone text;

-- Minutes of physical activity (from manual or device activity records).
alter table public.health_data
  add column if not exists active_minutes integer default 0;
