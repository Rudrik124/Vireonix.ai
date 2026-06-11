-- Revenue and Profit Tracking Tables
-- Created 2026-06-11

CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month int NOT NULL,
  year int NOT NULL,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_profit numeric NOT NULL DEFAULT 0,
  subscription_revenue numeric NOT NULL DEFAULT 0,
  usage_revenue numeric NOT NULL DEFAULT 0,
  server_expenses numeric NOT NULL DEFAULT 0,
  domain_expenses numeric NOT NULL DEFAULT 0,
  api_expenses numeric NOT NULL DEFAULT 0,
  active_users int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_profiles (id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions (id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method text,
  transaction_id text UNIQUE,
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_year_month
ON public.monthly_snapshots (year, month DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date
ON public.payments (payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON public.payments (status);
