-- Add container_id to documents for direct lookup
alter table public.mt_documents
  add column if not exists container_id text;

-- Backfill container_id from mt_cargo
update public.mt_documents d
set container_id = c.container_id
from public.mt_cargo c
where c.id = d.cargo_id
  and (d.container_id is null or d.container_id = '');

-- Index for fast lookups
create index if not exists mt_documents_tenant_container_idx
  on public.mt_documents (tenant_id, container_id);
