-- Align MT document statuses with the existing dashboard expectations
-- Existing dashboards expect: UPLOADED, VERIFIED, REJECTED

alter table public.mt_documents drop constraint if exists mt_documents_status_check;

alter table public.mt_documents
  add constraint mt_documents_status_check
  check (status in ('UPLOADED','VERIFIED','REJECTED'));

-- Backfill any old values
update public.mt_documents set status = 'UPLOADED' where status = 'submitted';
update public.mt_documents set status = 'VERIFIED' where status = 'verified';
update public.mt_documents set status = 'REJECTED' where status = 'rejected';
