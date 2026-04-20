-- Add is_import flag to mt_cargo to distinguish ops-registered (imported) cargo
-- from client-created cargo. Imported cargo has docs pre-verified by ops.
alter table public.mt_cargo
  add column if not exists is_import boolean not null default false;

comment on column public.mt_cargo.is_import is
  'True when this cargo was registered via the ops import flow (docs pre-verified). False for standard client-created cargo.';
