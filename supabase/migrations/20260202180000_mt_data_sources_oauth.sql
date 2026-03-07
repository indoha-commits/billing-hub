-- MT: tenant data sources + OAuth connections (Google Drive/Dropbox/OneDrive)

create extension if not exists pgcrypto;

create table if not exists public.mt_tenant_data_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,

  provider text not null check (provider in ('google_drive','dropbox','onedrive','supabase_storage','local')),
  status text not null default 'not_started' check (status in ('not_started','pending_auth','connected','error','disabled')),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (tenant_id)
);

create index if not exists mt_tenant_data_sources_provider_idx on public.mt_tenant_data_sources(provider);
create index if not exists mt_tenant_data_sources_status_idx on public.mt_tenant_data_sources(status);

create table if not exists public.mt_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,

  provider text not null check (provider in ('google_drive','dropbox','onedrive')),
  status text not null default 'pending' check (status in ('pending','connected','revoked','error')),

  access_token text,
  refresh_token text,
  expires_at timestamptz,

  external_account_id text,
  external_account_email text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (tenant_id, provider)
);

create index if not exists mt_oauth_connections_status_idx on public.mt_oauth_connections(status);

-- Optional job table for reliable push/retry
create table if not exists public.mt_storage_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.mt_tenants(id) on delete cascade,
  document_id uuid not null references public.mt_documents(id) on delete cascade,
  job_type text not null check (job_type in ('push_verified_document')),
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, job_type)
);

create index if not exists mt_storage_jobs_status_idx on public.mt_storage_jobs(status, created_at);

-- Extend mt_documents to store provider destination details (keep drive_url for backward compat)
alter table public.mt_documents
  add column if not exists storage_provider text not null default 'supabase_storage'
    check (storage_provider in ('supabase_storage','google_drive','dropbox','onedrive')),
  add column if not exists provider_file_id text,
  add column if not exists provider_path text,
  add column if not exists source_storage_path text;
