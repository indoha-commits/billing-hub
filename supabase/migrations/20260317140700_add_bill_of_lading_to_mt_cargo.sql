-- Add bill_of_lading grouping identifier to mt_cargo
alter table public.mt_cargo
  add column if not exists bill_of_lading text;

comment on column public.mt_cargo.bill_of_lading is 'Grouping identifier for bulk cargo creation (bill of lading / container number group)';
