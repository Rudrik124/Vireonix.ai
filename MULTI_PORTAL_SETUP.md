# Multi-Portal Implementation Checklist

## Setup Steps

### Step 1: Database Setup ✓

Create the testing credentials table in Supabase SQL Editor:

```sql
-- Create testing_credentials table
CREATE TABLE IF NOT EXISTS testing_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_testing_credentials_email 
  ON testing_credentials(email);
CREATE INDEX IF NOT EXISTS idx_testing_credentials_created_by 
  ON testing_credentials(created_by);
CREATE INDEX IF NOT EXISTS idx_testing_credentials_is_active 
  ON testing_credentials(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE testing_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all credentials"
  ON testing_credentials FOR SELECT
  USING (
    (SELECT role FROM app_profiles WHERE id = auth.uid())::text = 'admin'
    OR (SELECT role FROM app_profiles WHERE id = auth.uid())::text = 'super_admin'
  );

CREATE POLICY "Admins can create credentials"
  ON testing_credentials FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND ((SELECT role FROM app_profiles WHERE id = auth.uid())::text = 'admin'
      OR (SELECT role FROM app_profiles WHERE id = auth.uid())::text = 'super_admin')
  );
```

### Step 2: Update Supabase Auth Configuration ✓

In Supabase Dashboard → Authentication → Providers:

1. Ensure Email/Password auth is enabled
2. Configure email templates
3. Set redirect URLs:
   - `http://localhost:5173/auth/callback`
   - `https://yourdomain.com/auth/callback`

### Step 3: Code Updates ✓

All code changes have been implemented:

- ✅ Auth types updated
- ✅ Permissions system updated
- ✅ Portal folder structures created
- ✅ Pages created for all portals
- ✅ Routes configured
- ✅ Route guards updated
- ✅ Testing credentials service created

### Step 4: Test the Implementation

1. **Test Admin Portal**
   - Log in as admin user
   - Navigate to `/admin/dashboard`
   - Go to "Testing Credentials"
   - Create test credentials
   - Verify credentials are saved

2. **Test Tester Portal**
   - Use created credentials to log in
   - Navigate to `/tester/dashboard`
   - Verify access to test environment
   - Test all features

3. **Test Developer Portal**
   - Log in as developer
   - Navigate to `/developer/dashboard`
   - Verify access to workflows and logs

4. **Test User Portal**
   - Log in as regular user
   - Navigate to `/user/dashboard`
   - Verify can only see user portal

### Step 5: Create Test Users in Supabase

In Supabase Dashboard → Authentication → Users:

1. Create admin user:
   - Email: `admin@vireonix.ai`
   - Password: (set secure password)

2. Create developer user:
   - Email: `developer@vireonix.ai`
   - Password: (set secure password)

3. Create regular user:
   - Email: `user@vireonix.ai`
   - Password: (set secure password)

### Step 6: Update User Profiles

In Supabase Dashboard → SQL Editor, update app_profiles:

```sql
-- Assuming you have an app_profiles table
-- Update existing users with roles

-- Make sure the role column exists in app_profiles
ALTER TABLE app_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update test users
UPDATE app_profiles 
SET role = 'admin' 
WHERE email = 'admin@vireonix.ai';

UPDATE app_profiles 
SET role = 'developer' 
WHERE email = 'developer@vireonix.ai';

UPDATE app_profiles 
SET role = 'user' 
WHERE email = 'user@vireonix.ai';
```

## File Structure Created

```
src/
├── portals/
│   ├── admin/
│   │   └── pages/
│   │       ├── admin-auth-page.tsx          [CREATED]
│   │       ├── admin-dashboard-page.tsx     [CREATED]
│   │       └── testing-credentials-page.tsx [CREATED]
│   ├── tester/
│   │   └── pages/
│   │       ├── tester-auth-page.tsx               [CREATED]
│   │       ├── tester-dashboard-page.tsx         [CREATED]
│   │       └── tester-test-environment-page.tsx  [CREATED]
│   ├── developer/
│   │   └── pages/
│   │       ├── developer-access-page.tsx        [EXISTING]
│   │       ├── developer-dashboard-page.tsx     [EXISTING]
│   │       ├── developer-logs-page.tsx          [EXISTING]
│   │       ├── developer-operations-page.tsx    [EXISTING]
│   │       └── developer-workflow-lab-page.tsx  [EXISTING]
│   └── user/
│       └── pages/
│           ├── user-auth-page.tsx        [EXISTING]
│           └── user-dashboard-page.tsx   [EXISTING]
├── services/
│   └── testing-credentials.service.ts   [CREATED]
├── shared/
│   ├── auth/
│   │   └── permissions.ts               [UPDATED]
│   ├── routing/
│   │   └── route-guards.tsx             [UPDATED]
│   └── types/
│       └── auth.ts                      [UPDATED]
└── app/
    └── routes.tsx                       [UPDATED]

[NEW FILES]
├── PORTAL_ARCHITECTURE.md                [CREATED]
└── MULTI_PORTAL_SETUP.md                 [CREATED]
```

## API Endpoints for Testing Credentials

The service provides the following functions:

```typescript
// Create new testing credentials
createTestingCredentials(
  email: string,
  password: string,
  description: string,
  expiresAt?: string,
  createdBy?: string
): Promise<TestingCredentials | null>

// Get credentials (optionally filtered by creator)
getTestingCredentials(createdBy?: string): Promise<TestingCredentials[]>

// Delete credentials
deleteTestingCredentials(id: string): Promise<boolean>

// Update credentials
updateTestingCredentials(
  id: string,
  updates: Partial<TestingCredentials>
): Promise<TestingCredentials | null>

// Validate credentials
validateTestingCredentials(
  email: string,
  password: string
): Promise<boolean>
```

## Environment Variables (No changes needed)

The `.env` file already contains all necessary keys. No additional configuration needed.

## Next Steps for Your Team

1. **For Admins**:
   - Log into `/admin/dashboard`
   - Create testing credentials for team members
   - Share credentials securely

2. **For Testers**:
   - Receive credentials from admin
   - Log into `/tester/auth`
   - Test features in `/tester/test-environment`
   - Report bugs in tester portal

3. **For Developers**:
   - Log into `/developer/dashboard`
   - Access logs and operations
   - Run workflow tests

## Troubleshooting

### Issue: "Access Denied" when accessing portal

**Solution**: 
- Check user role in Supabase (app_profiles table)
- Verify role has required permissions
- Clear browser cache and re-login

### Issue: Testing credentials not showing up

**Solution**:
- Verify `testing_credentials` table exists in Supabase
- Check RLS policies are not blocking reads
- Verify user is logged in as admin/super_admin

### Issue: Can't see admin portal

**Solution**:
- User must have `admin` or `super_admin` role
- Update role in app_profiles table
- Log out and back in to refresh permissions

## Support

For issues or questions:
1. Check this documentation
2. Review the PORTAL_ARCHITECTURE.md file
3. Check browser console for errors
4. Review Supabase logs for backend errors

---

**Created**: May 27, 2026
**Status**: Ready for implementation
