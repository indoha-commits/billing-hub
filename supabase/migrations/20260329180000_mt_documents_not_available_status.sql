-- Add NOT_AVAILABLE as a valid document status
-- This allows ops to mark documents that don't exist for a shipment,
-- which is then shown to the client as "Not Available" instead of "Required".

alter table public.mt_documents drop constraint if exists mt_documents_status_check;

alter table public.mt_documents
  add constraint mt_documents_status_check
  check (status in ('UPLOADED', 'VERIFIED', 'REJECTED', 'NOT_AVAILABLE'));
