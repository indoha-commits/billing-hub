-- Allow the same Bill of Lading + container_id to exist across different clients
-- within the same tenant, by scoping uniqueness to (tenant_id, client_id, ...).

-- mt_cargo_groups: change unique (tenant_id, bill_of_lading) -> (tenant_id, client_id, bill_of_lading)
do $$
begin
  alter table public.mt_cargo_groups
    drop constraint if exists mt_cargo_groups_tenant_id_bill_of_lading_key;
exception
  when undefined_table then
    null;
end $$;

-- Also drop any legacy unique index name if it exists (defensive).
drop index if exists public.mt_cargo_groups_tenant_bill_of_lading_key;
drop index if exists public.mt_cargo_groups_tenant_id_bill_of_lading_key;

alter table public.mt_cargo_groups
  add constraint mt_cargo_groups_tenant_client_bol_key unique (tenant_id, client_id, bill_of_lading);

-- mt_cargo: change unique (tenant_id, container_id) -> (tenant_id, client_id, container_id)
drop index if exists public.mt_cargo_tenant_container_id_key;

create unique index if not exists mt_cargo_tenant_client_container_id_key
  on public.mt_cargo (tenant_id, client_id, container_id)
  where container_id is not null;

