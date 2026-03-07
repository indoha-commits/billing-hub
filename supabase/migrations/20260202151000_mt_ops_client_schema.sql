-- MT schema to support existing single-company dashboard endpoint shapes
-- Endpoints observed:
-- Client: /client/shipments, /client/cargo/:id, /client/documents, signed urls, approvals
-- Ops: /ops/dashboard, /ops/pending-documents, /ops/cargo-registry, /ops/cargo/:id/timeline,
--      /ops/activity-log, /ops/validation-queue, /ops/verify-document,
--      /ops/clients, /ops/cargo, /ops/cargo/:id, /ops/cargo/:id/approvals, signed urls

create extension if not exists pgcrypto;

-- Business clients under tenant (importers/exporters)
create table if not exists public.mt_clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mt_clients_tenant_created_idx on public.mt_clients (tenant_id, created_at desc);

-- Cargo (shipment) registry
create table if not exists public.mt_cargo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  client_id uuid not null references public.mt_clients(id) on delete restrict,

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
  updated_at timestamptz not null default now()
);

create index if not exists mt_cargo_tenant_created_idx on public.mt_cargo (tenant_id, created_at desc);
create index if not exists mt_cargo_tenant_client_created_idx on public.mt_cargo (tenant_id, client_id, created_at desc);

-- Cargo events timeline
create table if not exists public.mt_cargo_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  cargo_id uuid not null references public.mt_cargo(id) on delete cascade,

  event_type text not null,
  event_time timestamptz not null,
  actor_type text not null default 'system',
  actor_id uuid,
  location_id uuid,
  recorded_at timestamptz not null default now()
);

create index if not exists mt_cargo_events_tenant_cargo_time_idx on public.mt_cargo_events (tenant_id, cargo_id, event_time desc);

-- Client-submitted documents
create table if not exists public.mt_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  cargo_id uuid not null references public.mt_cargo(id) on delete cascade,

  document_type text not null,
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),

  drive_url text,
  file_path text,

  uploaded_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists mt_documents_tenant_cargo_created_idx on public.mt_documents (tenant_id, cargo_id, created_at desc);
create index if not exists mt_documents_tenant_status_created_idx on public.mt_documents (tenant_id, status, created_at desc);

-- Cargo approvals (assessment / declaration drafts)
create table if not exists public.mt_cargo_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  cargo_id uuid not null references public.mt_cargo(id) on delete cascade,

  kind text not null check (kind in ('DECLARATION_DRAFT','ASSESSMENT','WH7_DOC','EXIT_NOTE')),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXPIRED')),

  file_url text,
  file_path text,
  notes text,

  created_at timestamptz not null default now(),
  created_by uuid,

  decided_at timestamptz,
  decided_by uuid,
  rejection_reason text
);

create index if not exists mt_cargo_approvals_tenant_cargo_created_idx on public.mt_cargo_approvals (tenant_id, cargo_id, created_at desc);

-- Activity log (ops)
create table if not exists public.mt_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mt_audit_log_tenant_created_idx on public.mt_audit_log (tenant_id, created_at desc);

-- Validation queue view can be built later; for now documents.status='submitted' represent pending.
