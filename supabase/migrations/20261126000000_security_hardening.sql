-- Security hardening.
-- 1. Webhook tokens: keep only a SHA-256 hash, never the plain secret.
-- 2. AI quota: per-user daily counter so one account cannot burn the Gemini quota.
-- 3. Avatars: stop anonymous listing of the bucket (files stay reachable by their public URL).

-- 1. Webhook tokens ---------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

alter table public.health_webhook_tokens
  add column if not exists secret_hash text,
  add column if not exists secret_prefix text;

update public.health_webhook_tokens
set secret_hash = encode(extensions.digest(secret, 'sha256'), 'hex'),
    secret_prefix = left(secret, 6)
where secret_hash is null and secret is not null;

alter table public.health_webhook_tokens alter column secret_hash set not null;
create unique index if not exists health_webhook_tokens_secret_hash_key
  on public.health_webhook_tokens (secret_hash);

alter table public.health_webhook_tokens drop column if exists secret;

-- 2. AI quota ----------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Users may read their own counter; writes only go through consume_ai_quota().
create policy "Users read own ai usage"
  on public.ai_usage for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.consume_ai_quota(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_ai_quota(integer) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;

-- 3. Avatars -------------------------------------------------------------------
-- A public bucket serves files by URL without any SELECT policy; this policy
-- only allowed anyone to LIST the bucket (and so enumerate user ids).
drop policy if exists "Avatar images are publicly readable" on storage.objects;
