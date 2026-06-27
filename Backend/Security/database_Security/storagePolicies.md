# Supabase Storage Policies

## Required storage policy behavior

- Authenticated users may upload files to private buckets.
- Users may read only files stored under their own user folder.
- Users may delete or replace only files stored under their own user folder.
- Anonymous users may not access private buckets.
- Admins may read and manage all files.

## Example policy rules

1. Authenticated upload rule
   - `authenticated` role can upload to `user-assets`.

2. Owner read/delete rule
   - Users can read/delete objects where `bucket_id = 'user-assets'` and `name` starts with `auth.uid()/`.

3. Admin access rule
   - Admins may read/delete any object in `user-assets`.

4. Anonymous access denied
   - `anon` role is denied read/write access to `user-assets`.
