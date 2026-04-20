-- Add clearance pathway support to mt_cargo
-- Two pathways: PORT_CLEARANCE (pay tax at port) or T1_TRANSIT (pay tax after transport)

-- Add clearance_pathway column
alter table public.mt_cargo
add column if not exists clearance_pathway text default 'PORT_CLEARANCE'
check (clearance_pathway in ('PORT_CLEARANCE', 'T1_TRANSIT'));

-- Add comment
comment on column public.mt_cargo.clearance_pathway is 
'Customs clearance pathway: PORT_CLEARANCE (immediate tax at port: Draft+Assessment+Exit Note) or T1_TRANSIT (deferred tax: T1 Form+IM8 Form+Exit Note)';

-- Update mt_cargo_approvals to support T1_FORM, IM4, and IM8
alter table public.mt_cargo_approvals
drop constraint if exists mt_cargo_approvals_kind_check;

alter table public.mt_cargo_approvals
add constraint mt_cargo_approvals_kind_check 
check (kind in ('DECLARATION_DRAFT','ASSESSMENT','WH7_DOC','EXIT_NOTE','T1_FORM','IM8','IM4'));

-- Update comment
comment on column public.mt_cargo_approvals.kind is 
'Approval kind: DECLARATION_DRAFT, ASSESSMENT, WH7_DOC, EXIT_NOTE, IM8 (for PORT_CLEARANCE) or T1_FORM, EXIT_NOTE, IM4 (for T1_TRANSIT).';

-- Update document type comment
comment on column public.mt_documents.document_type is 
'Document type: BILL_OF_LADING, COMMERCIAL_INVOICE, PACKING_LIST, TYPE_APPROVAL, IMPORT_LICENSE, CERTIFICATE_OF_ORIGIN, INSURANCE_CERTIFICATE, WH7, DRAFT_DECLARATION, ASSESSMENT, EXIT_NOTE, T1_FORM, IM8_FORM, etc.';

-- Create indexes for performance
create index if not exists idx_mt_cargo_clearance_pathway 
on public.mt_cargo(clearance_pathway);

create index if not exists idx_mt_cargo_approvals_kind 
on public.mt_cargo_approvals(kind);

-- Drop and recreate mt_cargo_registry view to include clearance_pathway
drop view if exists public.mt_cargo_registry;

create view public.mt_cargo_registry as
select
  c.tenant_id,
  c.client_id,
  cl.name as client_name,
  c.container_id as cargo_id,
  c.id as cargo_uuid,
  c.category,
  c.clearance_pathway,
  c.bill_of_lading,
  c.created_at
from public.mt_cargo c
join public.mt_clients cl on cl.id = c.client_id;

comment on view public.mt_cargo_registry is 'Registry view exposing container_id as cargo_id while keeping uuid in cargo_uuid';
