-- Indexes required for subdomain-only tenant routing and membership checks

-- 1) Tenant lookup by subdomain must be fast and unique
CREATE UNIQUE INDEX IF NOT EXISTS tenants_subdomain_uniq
  ON public.tenants (subdomain)
  WHERE subdomain IS NOT NULL;

-- 2) Membership checks (auth user -> tenant) must be fast
CREATE INDEX IF NOT EXISTS tenant_users_user_tenant_idx
  ON public.tenant_users (user_id, tenant_id);

-- Optional (helps reverse lookups)
CREATE INDEX IF NOT EXISTS tenant_users_tenant_user_idx
  ON public.tenant_users (tenant_id, user_id);
