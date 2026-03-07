-- Add provider + phone fields needed to initiate MoMo/M-Pesa from subscriptions/tenants

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS billing_provider public.payment_provider DEFAULT 'momo';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider public.payment_provider DEFAULT 'momo',
  ADD COLUMN IF NOT EXISTS msisdn TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Backfill convenience defaults
UPDATE public.subscriptions s
SET msisdn = t.admin_phone,
    country = t.country,
    provider = COALESCE(t.billing_provider, 'momo')
FROM public.tenants t
WHERE s.tenant_id = t.id AND (s.msisdn IS NULL OR s.country IS NULL);
