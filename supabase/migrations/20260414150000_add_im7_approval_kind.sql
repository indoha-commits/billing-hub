-- Add IM7 as a valid customs approval kind for MT flow
alter table public.mt_cargo_approvals
drop constraint if exists mt_cargo_approvals_kind_check;

alter table public.mt_cargo_approvals
add constraint mt_cargo_approvals_kind_check
check (kind in ('DECLARATION_DRAFT', 'ASSESSMENT', 'WH7_DOC', 'EXIT_NOTE', 'T1_FORM', 'IM4', 'IM7', 'IM8'));

comment on column public.mt_cargo_approvals.kind is
'Approval kind: DECLARATION_DRAFT, ASSESSMENT, WH7_DOC, EXIT_NOTE, T1_FORM, IM4, IM7, IM8';
