-- Manager dashboard access model:
-- - mt_tenant_users.dashboard_type can be 'manager'
-- - mt_tenant_users.membership_status gates access ('active' allows manager dashboard + ops APIs for managers)

-- 1) Extend dashboard_type constraint to include manager
alter table public.mt_tenant_users
drop constraint if exists mt_tenant_users_dashboard_type_check;

alter table public.mt_tenant_users
add constraint mt_tenant_users_dashboard_type_check
check (dashboard_type in ('client', 'ops', 'manager'));

-- 2) Add membership status (defaults to active for existing rows)
alter table public.mt_tenant_users
add column if not exists membership_status text not null default 'active'
check (membership_status in ('invited', 'active', 'suspended', 'revoked'));

comment on column public.mt_tenant_users.membership_status is
'Access status for tenant membership. Manager dashboard requires dashboard_type=manager AND membership_status=active.';

create index if not exists mt_tenant_users_tenant_dashboard_status_idx
  on public.mt_tenant_users (tenant_id, dashboard_type, membership_status);

-- 3) Example: grant a specific Supabase Auth user manager access for a tenant
-- Replace the UUIDs before running.
/*
insert into public.mt_tenant_users (tenant_id, user_id, role, dashboard_type, membership_status)
values (
  '98925b25-ca62-48de-ab24-b9d27d6488cb'::uuid, -- tenant_id
  '00000000-0000-0000-0000-000000000000'::uuid, -- auth user id (Supabase auth.users.id)
  'member',
  'manager',
  'active'
)
on conflict (tenant_id, user_id) do update
set dashboard_type = excluded.dashboard_type,
    membership_status = excluded.membership_status,
    role = excluded.role;
*/
