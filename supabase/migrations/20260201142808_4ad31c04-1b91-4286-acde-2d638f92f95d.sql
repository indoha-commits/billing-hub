-- Create enum types for statuses
CREATE TYPE public.tenant_status AS ENUM (
  'pending_payment', 'ready_to_provision', 'provisioning', 'active', 'past_due', 'suspended'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'cancelled'
);

CREATE TYPE public.payment_provider AS ENUM (
  'momo', 'mpesa', 'stripe', 'manual'
);

CREATE TYPE public.invoice_status AS ENUM (
  'draft', 'open', 'paid', 'void', 'uncollectible'
);

CREATE TYPE public.subscription_status AS ENUM (
  'active', 'past_due', 'canceled', 'paused', 'trialing'
);

CREATE TYPE public.provisioning_status AS ENUM (
  'queued', 'running', 'completed', 'failed'
);

CREATE TYPE public.notification_type AS ENUM (
  'payment_confirmed', 'provisioning_failed', 'payment_failed', 'webhook_issue', 'cargo_limit_exceeded'
);

CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'viewer');

-- Tenants table (clients)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  admin_phone TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  monthly_plan_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cargo_limit INTEGER NOT NULL DEFAULT 100,
  cargo_usage INTEGER NOT NULL DEFAULT 0,
  company_logo_url TEXT,
  subdomain TEXT UNIQUE,
  status tenant_status NOT NULL DEFAULT 'pending_payment',
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment intents table
CREATE TABLE public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  intent_type TEXT NOT NULL DEFAULT 'subscription', -- setup/subscription
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  provider payment_provider NOT NULL,
  external_reference TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status invoice_status NOT NULL DEFAULT 'open',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  payment_link TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status subscription_status NOT NULL DEFAULT 'active',
  next_charge_at TIMESTAMPTZ NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provisioning jobs table
CREATE TABLE public.provisioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  status provisioning_status NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  logs JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications/Inbox table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendar events table (for Google Calendar integration)
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  google_event_id TEXT UNIQUE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  meeting_link TEXT,
  is_attended BOOLEAN DEFAULT false,
  walkthrough_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhook events table
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies - Allow authenticated users with admin/operator role to access data
CREATE POLICY "Users with admin or operator role can view tenants"
  ON public.tenants FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users with admin or operator role can manage tenants"
  ON public.tenants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view payment_intents"
  ON public.payment_intents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can manage payment_intents"
  ON public.payment_intents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view provisioning_jobs"
  ON public.provisioning_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can manage provisioning_jobs"
  ON public.provisioning_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view calendar_events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can manage calendar_events"
  ON public.calendar_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view webhook_events"
  ON public.webhook_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();