-- Add container_id field to mt_cargo table for human-readable cargo identifiers
alter table public.mt_cargo 
  add column if not exists container_id text;

-- Add unique constraint to ensure container_id is unique within a tenant
create unique index if not exists mt_cargo_tenant_container_id_key 
  on public.mt_cargo (tenant_id, container_id) 
  where container_id is not null;

-- Add index for lookups by container_id
create index if not exists mt_cargo_container_id_idx 
  on public.mt_cargo (container_id) 
  where container_id is not null;

-- Add comment to explain the field
comment on column public.mt_cargo.container_id is 'Human-readable cargo/container identifier (e.g., CONTAINER-2024-001)';
