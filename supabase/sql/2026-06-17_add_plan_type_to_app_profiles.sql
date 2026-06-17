-- Add plan_type column to app_profiles table
-- Supports: 'FREE', 'PRO', 'PRO_MAX', or leave NULL for total users
ALTER TABLE app_profiles ADD COLUMN plan_type TEXT CHECK (plan_type IN ('FREE', 'PRO', 'PRO_MAX')) DEFAULT NULL;
