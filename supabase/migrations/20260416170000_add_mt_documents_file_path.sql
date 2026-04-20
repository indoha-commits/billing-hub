-- Add legacy-compatible file_path column for mt_documents.
-- Some services / dashboards may write/read file_path even when provider_path/source_storage_path exist.

alter table public.mt_documents
  add column if not exists file_path text;

create index if not exists mt_documents_tenant_file_path_idx
  on public.mt_documents (tenant_id, file_path)
  where file_path is not null;

