-- Create bug_reports table
create type public.bug_severity as enum ('critical', 'high', 'medium', 'low');
create type public.bug_status as enum ('open', 'in-review', 'fixed', 'verified');

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.app_profiles (id) on delete set null,
  tester_name text not null,
  assigned_developer text not null default 'RUDRIK' check (assigned_developer in ('RUDRIK', 'MOHAN', 'MANJITH', 'HARSHITHA', 'UDAY', 'SASWATEE')),
  title text not null,
  description text not null,
  severity public.bug_severity not null default 'medium',
  component text not null,
  status public.bug_status not null default 'open',
  os text not null,
  browser text not null,
  device text not null,
  attachment_count integer not null default 0,
  attachment_urls text[] default array[]::text[],
  notes text,
  reviewed_by uuid references public.app_profiles (id) on delete set null,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create trigger for updated_at
drop trigger if exists set_bug_reports_updated_at on public.bug_reports;
create trigger set_bug_reports_updated_at
before update on public.bug_reports
for each row
execute function public.set_updated_at();

-- Create indexes for better performance
create index bug_reports_submitted_by on public.bug_reports(submitted_by);
create index bug_reports_status on public.bug_reports(status);
create index bug_reports_severity on public.bug_reports(severity);
create index bug_reports_created_at on public.bug_reports(created_at desc);

-- Enable RLS
alter table public.bug_reports enable row level security;

-- RLS policies
-- Testers can submit and view their own reports
create policy "tester_insert_bug_reports" on public.bug_reports for insert
  with check (
    auth.uid() = submitted_by
    and public.is_internal_user()
  );

-- Testers can view all bug reports (for context)
create policy "tester_view_bug_reports" on public.bug_reports for select
  using (public.is_internal_user());

-- Developers can view all bug reports
create policy "developer_view_bug_reports" on public.bug_reports for select
  using (public.is_internal_user());

-- Developers can update bug reports
create policy "developer_update_bug_reports" on public.bug_reports for update
  using (public.is_internal_user())
  with check (public.is_internal_user());

-- Admins can delete
create policy "admin_delete_bug_reports" on public.bug_reports for delete
  using (public.is_internal_user());
