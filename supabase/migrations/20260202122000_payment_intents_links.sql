-- Link payment_intents to invoices/subscriptions for easy joins in the dashboard

ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payment_intents_invoice_id_idx ON public.payment_intents (invoice_id);
CREATE INDEX IF NOT EXISTS payment_intents_subscription_id_idx ON public.payment_intents (subscription_id);
