-- MT: Leads intake + user dashboard type

-- Leads from indataflow.com contact form
create table if not exists public.mt_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  country text not null,
  email text not null,
  monthly_volume text,
  source text not null default 'indataflow.com',
  created_at timestamptz not null default now()
);

create index if not exists mt_leads_created_idx on public.mt_leads (created_at desc);

-- Distinguish whether a user should land on client dashboard or internal/ops dashboard
alter table public.mt_tenant_users
  add column if not exists dashboard_type text not null default 'client'
  check (dashboard_type in ('client','ops'));

create index if not exists mt_tenant_users_user_dashboard_idx
  on public.mt_tenant_users (user_id, dashboard_type);
