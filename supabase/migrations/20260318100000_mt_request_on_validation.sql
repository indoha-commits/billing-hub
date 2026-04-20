create table if not exists public.mt_request_on_validation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  client_id uuid not null references public.mt_clients(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  document_type text not null default 'BILL_OF_LADING',
  file_path text not null,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text
);

create index if not exists mt_request_on_validation_tenant_created_idx
  on public.mt_request_on_validation (tenant_id, created_at desc);
create index if not exists mt_request_on_validation_tenant_client_created_idx
  on public.mt_request_on_validation (tenant_id, client_id, created_at desc);
