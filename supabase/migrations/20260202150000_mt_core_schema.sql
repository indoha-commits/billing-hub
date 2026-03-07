-- Multi-tenant (MT) core schema (new tables, separate from single-company schema)

create extension if not exists pgcrypto;

-- Tenants
create table if not exists public.mt_tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  subdomain text not null,
  status text not null default 'pending_payment' check (status in ('pending_payment','ready_to_provision','provisioning','active','suspended')),
  currency text not null default 'RWF',
  country text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mt_tenants_subdomain_uniq on public.mt_tenants (subdomain);
create index if not exists mt_tenants_status_idx on public.mt_tenants (status);

-- Tenant membership
create table if not exists public.mt_tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists mt_tenant_users_user_tenant_idx on public.mt_tenant_users (user_id, tenant_id);

-- Cargo items (tenant-scoped)
create table if not exists public.mt_cargo_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  reference text,
  status text not null default 'draft' check (status in ('draft','submitted','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mt_cargo_items_tenant_created_idx on public.mt_cargo_items (tenant_id, created_at desc);
create index if not exists mt_cargo_items_tenant_status_created_idx on public.mt_cargo_items (tenant_id, status, created_at desc);

-- Pricing tiers
create table if not exists public.mt_pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  tier_code text not null unique,
  name text not null,
  cargo_min int not null default 0,
  cargo_max int,
  price_amount numeric(12,2) not null default 0,
  currency text not null default 'RWF',
  vat_included boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint mt_pricing_tiers_range_chk check (cargo_min >= 0 and (cargo_max is null or cargo_max >= cargo_min))
);

create index if not exists mt_pricing_tiers_active_idx on public.mt_pricing_tiers (active);
create index if not exists mt_pricing_tiers_range_idx on public.mt_pricing_tiers (cargo_min, cargo_max);

-- Subscriptions (cargo-driven)
create table if not exists public.mt_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.mt_tenants(id) on delete cascade,
  tier_id uuid references public.mt_pricing_tiers(id) on delete set null,
  monthly_amount numeric(12,2) not null default 0,
  currency text not null default 'RWF',
  status text not null default 'active' check (status in ('active','past_due','suspended','canceled')),
  cargo_used_current_period int not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_tier_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.mt_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  invoice_number text not null,
  invoice_type text not null default 'setup' check (invoice_type in ('setup','upgrade')),
  amount numeric(12,2) not null,
  currency text not null,
  status text not null default 'open' check (status in ('open','paid','void')),
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now()
);

create unique index if not exists mt_invoices_invoice_number_uniq on public.mt_invoices (invoice_number);
create index if not exists mt_invoices_tenant_created_idx on public.mt_invoices (tenant_id, created_at desc);

-- Payment intents
create table if not exists public.mt_payment_intents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  invoice_id uuid references public.mt_invoices(id) on delete set null,
  subscription_id uuid references public.mt_subscriptions(id) on delete set null,
  intent_type text not null check (intent_type in ('setup','upgrade')),
  provider text not null check (provider in ('momo','mpesa')),
  amount numeric(12,2) not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  external_reference text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mt_payment_intents_provider_ref_idx on public.mt_payment_intents (provider, external_reference);
create index if not exists mt_payment_intents_tenant_created_idx on public.mt_payment_intents (tenant_id, created_at desc);

-- Webhook events (dedupe)
create table if not exists public.mt_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('momo','mpesa')),
  event_key text not null,
  external_reference text,
  payload jsonb not null,
  processed boolean not null default false,
  error text,
  received_at timestamptz not null default now()
);

create unique index if not exists mt_webhook_events_dedupe_uniq on public.mt_webhook_events (provider, event_key);

-- Upgrade requests (dedupe per period + tier)
create table if not exists public.mt_plan_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  subscription_id uuid references public.mt_subscriptions(id) on delete set null,
  from_tier_id uuid references public.mt_pricing_tiers(id) on delete set null,
  to_tier_id uuid references public.mt_pricing_tiers(id) on delete set null,
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  invoice_id uuid references public.mt_invoices(id) on delete set null,
  payment_intent_id uuid references public.mt_payment_intents(id) on delete set null,
  status text not null default 'emailed' check (status in ('emailed','paid','canceled')),
  emailed_at timestamptz not null default now(),
  unique (tenant_id, to_tier_id, billing_period_start)
);
