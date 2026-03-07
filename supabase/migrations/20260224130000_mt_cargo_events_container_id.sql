-- Add container_id to cargo events for direct lookup
alter table public.mt_cargo_events
  add column if not exists container_id text;

-- Backfill container_id from mt_cargo
update public.mt_cargo_events e
set container_id = c.container_id
from public.mt_cargo c
where c.id = e.cargo_id
  and (e.container_id is null or e.container_id = '');

-- Index for fast lookups
create index if not exists mt_cargo_events_tenant_container_time_idx
  on public.mt_cargo_events (tenant_id, container_id, event_time desc);
