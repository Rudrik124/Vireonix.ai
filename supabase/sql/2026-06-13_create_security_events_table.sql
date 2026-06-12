-- Migration: Create security_events table for comprehensive security and audit logging
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Security event categories
CREATE TYPE IF NOT EXISTS security_event_category AS ENUM (
  'AUTH',
  'PROMPT',
  'FILE_UPLOAD',
  'RATE_LIMIT',
  'API',
  'ADMIN',
  'AI_COST',
  'SECURITY_ALERT'
);

-- Security event actions
CREATE TYPE IF NOT EXISTS security_event_action AS ENUM (
  -- AUTH
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'PASSWORD_RESET',
  
  -- PROMPT
  'PROMPT_SUBMITTED',
  'PROMPT_BLOCKED',
  'NSFW_DETECTION',
  'PROMPT_INJECTION',
  
  -- FILE_UPLOAD
  'UPLOAD_SUCCESS',
  'UPLOAD_REJECTED',
  'WRONG_MIME_TYPE',
  'FILE_TOO_LARGE',
  
  -- RATE_LIMIT
  'USER_HIT_LIMIT',
  'REQUEST_BLOCKED',
  
  -- API
  'INVALID_REQUEST',
  'BOT_ACTIVITY',
  'SERVER_ERROR',
  
  -- ADMIN
  'ROLE_CHANGE',
  'USER_BAN',
  'USER_DELETE',
  
  -- AI_COST
  'VIDEO_GENERATED',
  'RUNWAY_REQUEST',
  
  -- SECURITY_ALERT
  'CRITICAL_SECURITY_EVENT'
);

-- Severity levels
CREATE TYPE IF NOT EXISTS security_event_severity AS ENUM (
  'INFO',
  'WARNING',
  'CRITICAL'
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields
  user_id uuid REFERENCES public.app_profiles (id) ON DELETE SET NULL,
  category security_event_category NOT NULL,
  action security_event_action NOT NULL,
  severity security_event_severity NOT NULL DEFAULT 'INFO',
  
  -- Event details
  event_message text,
  event_source text, -- e.g., 'server.js', 'developer-portal-api.js'
  ip_address text,
  user_agent text,
  request_id text,
  
  -- Security context
  resource_type text, -- e.g., 'video', 'file', 'prompt', 'user'
  resource_id text, -- e.g., video_id, file_id, user_id being modified
  actor_role text, -- role of user performing action
  affected_user_id uuid, -- user being affected (for admin actions)
  
  -- Additional metadata
  metadata jsonb, -- arbitrary context data
  status text DEFAULT 'logged', -- logged, acknowledged, resolved, escalated
  response_code integer, -- HTTP status code if applicable
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  
  -- Audit trail
  notes text,
  resolved_by uuid REFERENCES public.app_profiles (id) ON DELETE SET NULL,
  
  updated_at timestamptz DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_category ON public.security_events (category);
CREATE INDEX IF NOT EXISTS idx_security_events_action ON public.security_events (action);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events (severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON public.security_events (status);
CREATE INDEX IF NOT EXISTS idx_security_events_affected_user ON public.security_events (affected_user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_category_action ON public.security_events (category, action);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON public.security_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_critical ON public.security_events (severity, created_at DESC) WHERE severity = 'CRITICAL';

-- RLS Policies

-- Users can view their own security events
CREATE POLICY "Users can view own security events"
  ON public.security_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Internal users (admin, developer, tester) can view all security events
CREATE POLICY "Internal users can view all security events"
  ON public.security_events
  FOR SELECT
  USING (
    (SELECT role FROM public.app_profiles WHERE id = auth.uid()) IN ('admin', 'developer', 'tester', 'super_admin')
  );

-- System/backend can insert security events (using service role key)
CREATE POLICY "System can insert security events"
  ON public.security_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can acknowledge/resolve security events
CREATE POLICY "Admins can update security events"
  ON public.security_events
  FOR UPDATE
  USING (
    (SELECT role FROM public.app_profiles WHERE id = auth.uid()) IN ('admin', 'developer', 'super_admin')
  );

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_security_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_events_updated_at_trigger
BEFORE UPDATE ON public.security_events
FOR EACH ROW
EXECUTE FUNCTION update_security_events_updated_at();
