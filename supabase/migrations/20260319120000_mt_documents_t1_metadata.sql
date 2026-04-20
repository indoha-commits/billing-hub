alter table public.mt_documents
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists mt_documents_metadata_idx
  on public.mt_documents using gin (metadata);
