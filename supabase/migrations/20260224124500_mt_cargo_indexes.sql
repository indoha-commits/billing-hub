-- Indexes for cargo timeline performance
create index if not exists mt_cargo_events_tenant_cargo_time_idx
  on public.mt_cargo_events (tenant_id, cargo_id, event_time desc);

create index if not exists mt_cargo_tenant_container_idx
  on public.mt_cargo (tenant_id, container_id);
