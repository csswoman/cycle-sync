-- Secret token so HC Webhook (Android) can POST without browser cookies.
-- Row is created via app when user generates a token.

create table if not exists public.health_webhook_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  secret text not null unique,
  created_at timestamptz default now()
);

alter table public.health_webhook_tokens enable row level security;

create policy "Users can manage their own webhook token"
  on public.health_webhook_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypasses RLS and is used by Next.js /api/health/webhook to resolve secret -> user_id.
