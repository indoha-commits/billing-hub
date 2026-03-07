-- Create a cargo registry view that always exposes container_id as cargo_id
create or replace view public.mt_cargo_registry as
select
  c.tenant_id,
  c.client_id,
  cl.name as client_name,
  c.container_id as cargo_id,
  c.id as cargo_uuid,
  c.created_at
from public.mt_cargo c
join public.mt_clients cl on cl.id = c.client_id;

comment on view public.mt_cargo_registry is 'Registry view exposing container_id as cargo_id while keeping uuid in cargo_uuid';
