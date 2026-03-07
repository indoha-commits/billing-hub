-- Add admin email to mt_tenants so we can send billing + credential emails after payment.

alter table public.mt_tenants
  add column if not exists admin_email text;

create index if not exists mt_tenants_admin_email_idx on public.mt_tenants (admin_email);
