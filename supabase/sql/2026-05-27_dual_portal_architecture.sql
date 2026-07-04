create extension if not exists pgcrypto;

create type public.portal_id as enum ('user', 'internal');
create type public.usage_type as enum ('production', 'test');

create table if not exists public.app_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_profiles (id) on delete cascade,
  plan_code text not null,
  status text not null default 'active',
  billing_provider text,
  renewal_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_profiles (id) on delete cascade,
  balance integer not null default 0,
  is_unlimited boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_profiles (id) on delete set null,
  portal public.portal_id not null,
  usage_type public.usage_type not null,
  feature_key text not null,
  credits_requested integer not null default 0,
  credits_charged integer not null default 0,
  status text not null default 'started',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  usage_log_id uuid references public.usage_logs (id) on delete cascade,
  endpoint text not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  status_code integer,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.testing_logs (
  id uuid primary key default gen_random_uuid(),
  usage_log_id uuid references public.usage_logs (id) on delete cascade,
  experiment_key text,
  notes text,
  log_level text not null default 'info',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  enabled boolean not null default false,
  internal_only boolean not null default true,
  created_at timestamptz not null default now()
);

create type public.error_severity as enum ('critical', 'high', 'medium', 'low');
create type public.error_status as enum ('open', 'resolved');

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  module text not null,
  route text not null,
  user_id uuid references public.app_profiles (id) on delete set null,
  error_message text not null,
  stack_trace text,
  severity public.error_severity not null default 'medium',
  browser text,
  device text,
  status public.error_status not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid references public.app_profiles (id) on delete set null,
  additional_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_profiles_updated_at on public.app_profiles;
create trigger set_app_profiles_updated_at
before update on public.app_profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_internal_user()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.app_profiles
    where id = auth.uid()
      and email in ('admin@veytrix.ai', 'security@veytrix.ai', 'developer@veytrix.ai', 'tester@veytrix.ai', 'tester@veeytrix.ai')
  );
$$;

create or replace function public.consume_credits(
  target_user uuid,
  target_wallet public.credit_wallet_type,
  amount integer,
  allow_bypass boolean default false
)
returns integer
language plpgsql
security definer
as $$
declare
  current_balance integer;
  unlimited_mode boolean;
begin
  select balance, is_unlimited
  into current_balance, unlimited_mode
  from public.credit_wallets
  where user_id = target_user
    and wallet_type = target_wallet
  for update;

  if unlimited_mode or allow_bypass then
    return coalesce(current_balance, 0);
  end if;

  if current_balance is null then
    raise exception 'Credit wallet not found';
  end if;

  if current_balance < amount then
    raise exception 'Insufficient credits';
  end if;

  update public.credit_wallets
  set balance = balance - amount,
      updated_at = now()
  where user_id = target_user
    and wallet_type = target_wallet;

  return current_balance - amount;
end;
$$;

alter table public.app_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.usage_logs enable row level security;
alter table public.api_logs enable row level security;
alter table public.testing_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.error_logs enable row level security;

drop policy if exists "profiles_select_self_or_internal" on public.app_profiles;
create policy "profiles_select_self_or_internal"
on public.app_profiles
for select
using (id = auth.uid() or public.is_internal_user());

drop policy if exists "profiles_update_internal_only" on public.app_profiles;
create policy "profiles_update_internal_only"
on public.app_profiles
for update
using (public.current_app_role() in ('super_admin', 'admin'))
with check (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists "subscriptions_self_or_internal" on public.subscriptions;
create policy "subscriptions_self_or_internal"
on public.subscriptions
for select
using (user_id = auth.uid() or public.is_internal_user());

drop policy if exists "wallets_self_or_internal" on public.credit_wallets;
create policy "wallets_self_or_internal"
on public.credit_wallets
for select
using (user_id = auth.uid() or public.is_internal_user());

drop policy if exists "wallets_internal_manage" on public.credit_wallets;
create policy "wallets_internal_manage"
on public.credit_wallets
for all
using (public.current_app_role() in ('super_admin', 'admin', 'developer'))
with check (public.current_app_role() in ('super_admin', 'admin', 'developer'));

drop policy if exists "usage_logs_self_or_internal" on public.usage_logs;
create policy "usage_logs_self_or_internal"
on public.usage_logs
for select
using (user_id = auth.uid() or public.is_internal_user());

drop policy if exists "usage_logs_insert_authenticated" on public.usage_logs;
create policy "usage_logs_insert_authenticated"
on public.usage_logs
for insert
with check (auth.uid() = user_id or public.is_internal_user());

drop policy if exists "api_logs_internal_only" on public.api_logs;
create policy "api_logs_internal_only"
on public.api_logs
for select
using (public.is_internal_user());

drop policy if exists "testing_logs_internal_only" on public.testing_logs;
create policy "testing_logs_internal_only"
on public.testing_logs
for select
using (public.is_internal_user());

drop policy if exists "feature_flags_internal_only" on public.feature_flags;
create policy "feature_flags_internal_only"
on public.feature_flags
for select
using (public.is_internal_user());

drop trigger if exists set_error_logs_updated_at on public.error_logs;
create trigger set_error_logs_updated_at
before update on public.error_logs
for each row
execute function public.set_updated_at();

drop policy if exists "error_logs_authenticated_insert" on public.error_logs;
create policy "error_logs_authenticated_insert"
on public.error_logs
for insert
with check (auth.uid() = user_id or public.is_internal_user() or auth.jwt() ->> 'role' = 'authenticated');

drop policy if exists "error_logs_internal_view_all" on public.error_logs;
create policy "error_logs_internal_view_all"
on public.error_logs
for select
using (public.is_internal_user());

drop policy if exists "error_logs_internal_update" on public.error_logs;
create policy "error_logs_internal_update"
on public.error_logs
for update
using (public.current_app_role() in ('super_admin', 'admin'))
with check (public.current_app_role() in ('super_admin', 'admin'));
