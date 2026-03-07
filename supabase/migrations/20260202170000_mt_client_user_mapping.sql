-- MT: Map dashboard users to a single business client within a tenant

create table if not exists public.mt_client_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  client_id uuid not null references public.mt_clients(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists mt_client_users_user_idx
  on public.mt_client_users (user_id);

create index if not exists mt_client_users_tenant_client_idx
  on public.mt_client_users (tenant_id, client_id);
