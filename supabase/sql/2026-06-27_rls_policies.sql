-- Enable Row Level Security and policies for application tables
-- Run this on your Supabase/Postgres instance as an administrative migration.

-- Enable RLS for each table
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['users','projects','videos','images','audio','uploads','prompts','activity_logs','api_usage','subscriptions'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END$$;

-- Policy: users can select/insert/update/delete their own rows (where applicable)
-- Uses auth.uid() from Supabase JWT for identification

-- Users table
CREATE POLICY users_self_access ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Projects
CREATE POLICY projects_owner ON projects
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id OR auth.role() = 'admin');

-- Videos
CREATE POLICY videos_owner ON videos
  FOR ALL
  USING (auth.uid() = owner_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = owner_id OR auth.role() = 'admin');

-- Images
CREATE POLICY images_owner ON images
  FOR ALL
  USING (auth.uid() = owner_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = owner_id OR auth.role() = 'admin');

-- Audio
CREATE POLICY audio_owner ON audio
  FOR ALL
  USING (auth.uid() = owner_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = owner_id OR auth.role() = 'admin');

-- Uploads
CREATE POLICY uploads_owner ON uploads
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'admin');

-- Prompts
CREATE POLICY prompts_owner ON prompts
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'admin');

-- Activity logs: users can only see their own activity; admins can see all
CREATE POLICY activity_logs_user ON activity_logs
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- API Usage
CREATE POLICY api_usage_user ON api_usage
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'admin');

-- Subscriptions
CREATE POLICY subscriptions_owner ON subscriptions
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'admin');

-- NOTE: Service role key should be used only by server-side administrative jobs.
-- Ensure your application uses the Supabase client with user JWTs for normal requests.
