-- Extend webhook_events for idempotent processing and linking to payment intents

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS event_key TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

-- Deduplicate callbacks
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_key_uniq
  ON public.webhook_events (provider, event_key)
  WHERE event_key IS NOT NULL;
