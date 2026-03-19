create table if not exists public.fitbit_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  fitbit_user_id text,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fitbit_tokens enable row level security;

create policy "Users can manage their own Fitbit tokens"
  on public.fitbit_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function update_fitbit_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fitbit_tokens_updated_at
  before update on public.fitbit_tokens
  for each row
  execute function update_fitbit_tokens_updated_at();
