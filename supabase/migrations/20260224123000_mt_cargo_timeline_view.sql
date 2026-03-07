-- Cargo timeline view exposing container_id for lookups
create or replace view public.mt_cargo_timeline as
select
  e.tenant_id,
  c.container_id as cargo_id,
  e.cargo_id as cargo_uuid,
  e.event_type,
  e.event_time,
  e.actor_type,
  e.actor_id,
  e.location_id,
  e.recorded_at
from public.mt_cargo_events e
join public.mt_cargo c on c.id = e.cargo_id;

comment on view public.mt_cargo_timeline is 'Timeline events view exposing container_id as cargo_id with underlying cargo_uuid';
