-- Group-level cargo metadata (Bill of Lading)
create table if not exists public.mt_cargo_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  client_id uuid not null references public.mt_clients(id) on delete restrict,
  bill_of_lading text not null,
  category text,
  container_count int not null default 1,
  origin text,
  destination text,
  route text,
  vessel text,
  expected_arrival_date date,
  eta timestamptz,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, bill_of_lading)
);

create index if not exists mt_cargo_groups_tenant_created_idx on public.mt_cargo_groups (tenant_id, created_at desc);
create index if not exists mt_cargo_groups_tenant_client_created_idx on public.mt_cargo_groups (tenant_id, client_id, created_at desc);
