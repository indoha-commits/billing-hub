-- Cargo-driven billing: cargo usage table + pricing tiers + upgrade request tracking

-- 1) Cargo table (tenant-scoped)
-- This is the canonical source for counting cargo usage per billing period.
-- You can extend fields later (origin/destination/etc.).
CREATE TABLE IF NOT EXISTS public.cargo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Business identifiers
  reference text,

  -- Status helps you decide what counts as usage (we'll count status='confirmed' by default)
  status text not null default 'draft' check (status in ('draft','submitted','confirmed','cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS cargo_items_tenant_created_idx
  ON public.cargo_items (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS cargo_items_tenant_status_created_idx
  ON public.cargo_items (tenant_id, status, created_at DESC);

-- 2) Pricing tiers (VAT included amounts)
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  tier_code text not null unique,         -- e.g. 'tier_0', 'tier_1'
  name text not null,                     -- e.g. 'Starter', 'Growth'
  cargo_min integer not null default 0,
  cargo_max integer,                      -- NULL = unlimited
  price_amount numeric(12,2) not null default 0, -- VAT included total
  currency text not null default 'RWF',
  vat_included boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint pricing_tiers_cargo_range_chk check (cargo_min >= 0 and (cargo_max is null or cargo_max >= cargo_min)),
  constraint pricing_tiers_price_chk check (price_amount >= 0)
);

CREATE INDEX IF NOT EXISTS pricing_tiers_active_idx ON public.pricing_tiers (active);
CREATE INDEX IF NOT EXISTS pricing_tiers_range_idx ON public.pricing_tiers (cargo_min, cargo_max);

-- Seed Tier 0 (free) if not exists
INSERT INTO public.pricing_tiers (tier_code, name, cargo_min, cargo_max, price_amount, currency, vat_included, active)
SELECT 'tier_0', 'Free', 0, 0, 0, 'RWF', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_tiers WHERE tier_code = 'tier_0');

-- 3) Extend subscriptions to store tier + usage snapshot
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS tier_id uuid references public.pricing_tiers(id) on delete set null,
  ADD COLUMN IF NOT EXISTS cargo_used_current_period integer not null default 0,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS last_tier_check_at timestamptz;

CREATE INDEX IF NOT EXISTS subscriptions_tier_id_idx ON public.subscriptions (tier_id);

-- 4) Extend invoices for upgrade invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_type text not null default 'setup'
  CHECK (invoice_type in ('setup','subscription','upgrade'));

-- 5) Extend payment_intents intent_type to include upgrade (if constraint exists, you may need to drop/recreate manually)
ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS intent_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_intents_intent_type_check'
  ) THEN
    ALTER TABLE public.payment_intents
      ADD CONSTRAINT payment_intents_intent_type_check
      CHECK (intent_type in ('setup','subscription','upgrade'));
  END IF;
END $$;

-- 6) Upgrade request tracking (prevents duplicate emails per period+tier)
CREATE TABLE IF NOT EXISTS public.plan_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  from_tier_id uuid references public.pricing_tiers(id) on delete set null,
  to_tier_id uuid references public.pricing_tiers(id) on delete set null,
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  status text not null default 'emailed' check (status in ('emailed','accepted','paid','canceled')),
  emailed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint plan_upgrade_requests_uniq unique (tenant_id, to_tier_id, billing_period_start)
);

CREATE INDEX IF NOT EXISTS plan_upgrade_requests_tenant_idx
  ON public.plan_upgrade_requests (tenant_id, created_at desc);
