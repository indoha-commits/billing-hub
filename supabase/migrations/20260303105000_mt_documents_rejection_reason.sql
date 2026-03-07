-- Add rejection reason to MT documents
alter table public.mt_documents
  add column if not exists rejection_reason text;
