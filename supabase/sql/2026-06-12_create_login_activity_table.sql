-- Migration: Create login_activity table for tracking developer/admin sessions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  session_id text,
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz,
  device_name text,
  browser text,
  operating_system text,
  ip_address text,
  session_duration integer,
  status text DEFAULT 'active', -- active | logged_out
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_status ON login_activity (status);
CREATE INDEX IF NOT EXISTS idx_login_activity_login_time ON login_activity (login_time);
