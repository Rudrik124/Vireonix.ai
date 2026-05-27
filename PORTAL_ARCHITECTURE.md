# Multi-Portal Architecture Guide

## Overview

Vireonix.ai now implements a comprehensive multi-portal architecture with four distinct portals, each designed for specific user roles and access levels:

1. **User Portal** - Standard user access for video generation
2. **Tester Portal** - Testing environment for QA and beta testers
3. **Developer Portal** - Development tools and API access
4. **Admin Portal** - System administration and credential management

## Portal Structure

### Directory Structure

```
src/
├── portals/
│   ├── user/
│   │   └── pages/
│   │       ├── user-auth-page.tsx
│   │       └── user-dashboard-page.tsx
│   ├── tester/
│   │   └── pages/
│   │       ├── tester-auth-page.tsx
│   │       ├── tester-dashboard-page.tsx
│   │       └── tester-test-environment-page.tsx
│   ├── developer/
│   │   └── pages/
│   │       ├── developer-access-page.tsx
│   │       ├── developer-dashboard-page.tsx
│   │       ├── developer-logs-page.tsx
│   │       ├── developer-operations-page.tsx
│   │       └── developer-workflow-lab-page.tsx
│   └── admin/
│       └── pages/
│           ├── admin-auth-page.tsx
│           ├── admin-dashboard-page.tsx
│           └── testing-credentials-page.tsx
```

## Roles and Permissions

### Role Hierarchy

1. **super_admin** - Full system access across all portals
2. **admin** - Administrative access, can manage users and credentials
3. **developer** - Development tools and API access
4. **tester** - Testing environment access
5. **user** - Standard user portal access

### Role Permissions

#### super_admin
- ✅ Access all portals: Developer, Admin, Tester, User
- ✅ User management
- ✅ Testing credential management
- ✅ System logs view
- ✅ Admin operations
- ✅ Bypass credit checks
- ✅ Billing management

#### admin
- ✅ Access all portals: Developer, Admin, Tester, User
- ✅ User management
- ✅ Testing credential management
- ✅ System logs view
- ✅ Admin operations
- ✅ Bypass credit checks
- ✅ Billing management

#### developer
- ✅ Developer portal
- ✅ Tester portal
- ✅ User portal
- ✅ Access developer tools
- ✅ View logs
- ✅ Run tests
- ✅ View billing

#### tester
- ✅ Tester portal
- ✅ User portal
- ✅ Run tests
- ✅ View logs

#### user
- ✅ User portal only
- ✅ Generate videos
- ✅ Access user features

## Portal Access Routes

### User Portal
- **Login**: `/user/auth`
- **Dashboard**: `/user/dashboard`
- **Legacy Routes**: `/login`, `/app` (backward compatibility)

### Developer Portal
- **Login**: `/developer/auth`
- **Dashboard**: `/developer/dashboard`
- **Workflows**: `/developer/workflows`
- **Logs**: `/developer/logs`
- **Operations**: `/developer/operations` (admin only)
- **Legacy Routes**: `/internal/login`, `/internal/*` (backward compatibility)

### Admin Portal
- **Login**: `/admin/auth`
- **Dashboard**: `/admin/dashboard`
- **Testing Credentials**: `/admin/testing-credentials`

### Tester Portal
- **Login**: `/tester/auth`
- **Dashboard**: `/tester/dashboard`
- **Test Environment**: `/tester/test-environment`

## Testing Credentials System

### Overview

The Testing Credentials system allows admins to create temporary credentials for testers without creating new user accounts.

### Creating Testing Credentials

1. Navigate to `/admin/dashboard`
2. Click "Testing Credentials"
3. Click "+ Create New Credentials"
4. Fill in:
   - **Tester Email**: Email for testing account
   - **Password**: Use "Generate" button for secure password
   - **Description**: Purpose of credentials (e.g., "Backend team testing")
   - **Expires At**: Optional expiration date

### Features

- **Auto-generate Passwords**: Secure 24-character passwords
- **Expiration Dates**: Auto-deactivate credentials on specified date
- **Toggle Status**: Enable/disable credentials without deleting
- **Audit Trail**: Track which admin created each credential

### Testing Credentials Database Schema

```sql
CREATE TABLE testing_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
```

## Implementation Guide

### Adding a New Portal

1. **Create portal folder**: `src/portals/[portal-name]/pages/`
2. **Create pages**: Auth page and dashboard page minimum
3. **Update auth types**: Add portal to `PORTALS` constant in `src/shared/types/auth.ts`
4. **Update permissions**: Add role permissions in `src/shared/auth/permissions.ts`
5. **Add routes**: Update `src/app/routes.tsx` with new routes
6. **Create route guards**: Use `<PortalGate>` component

### Example: Adding Admin Portal Routes

```tsx
import { AdminAuthPage } from "../portals/admin/pages/admin-auth-page";
import { AdminDashboardPage } from "../portals/admin/pages/admin-dashboard-page";

// In router configuration:
{
  path: "/admin/auth",
  Component: AdminAuthPage,
},
{
  path: "/admin/dashboard",
  element: (
    <PortalGate portal="admin" allowedRoles={["super_admin", "admin"]}>
      <AdminDashboardPage />
    </PortalGate>
  ),
},
```

### Using PortalGate Component

```tsx
import { PortalGate } from "../shared/routing/route-guards";

// Basic usage - requires portal access
<PortalGate portal="developer">
  <DeveloperDashboardPage />
</PortalGate>

// With role restrictions
<PortalGate 
  portal="developer" 
  allowedRoles={["super_admin", "admin", "developer"]}
>
  <DeveloperOperationsPage />
</PortalGate>
```

### Checking Permissions in Components

```tsx
import { useAuth } from "../app/context/auth-context";
import { hasPermission, canAccessPortal } from "../shared/auth/permissions";

function MyComponent() {
  const { profile } = useAuth();
  
  // Check specific permission
  if (hasPermission(profile, "admin.users.manage")) {
    // Show admin features
  }
  
  // Check portal access
  if (canAccessPortal(profile, "admin")) {
    // Show admin portal
  }
  
  return <div>Content</div>;
}
```

## Testing Workflow

### For Admins

1. Go to Admin Portal → Testing Credentials
2. Create credentials for tester team members
3. Share email and password securely
4. Monitor usage in credentials list

### For Testers

1. Receive credentials from admin
2. Log in via `/tester/auth` with provided credentials
3. Access Tester Dashboard at `/tester/dashboard`
4. Use Test Environment at `/tester/test-environment`
5. Report bugs via Bug Reports section

## Database Setup

### Required Tables

You'll need to create the `testing_credentials` table in Supabase:

```sql
CREATE TABLE testing_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_testing_credentials_email ON testing_credentials(email);
CREATE INDEX idx_testing_credentials_created_by ON testing_credentials(created_by);
CREATE INDEX idx_testing_credentials_is_active ON testing_credentials(is_active);
```

## Migration from Old Portal Structure

### Old Structure
- `/internal` → Internal (developer) portal
- `/user` → User portal

### New Structure
- `/developer` → Developer portal (replaces `/internal`)
- `/admin` → Admin portal (new)
- `/tester` → Tester portal (new)
- `/user` → User portal (unchanged)

### Backward Compatibility

All old routes are maintained for backward compatibility:
- `/internal/login` → `/developer/auth`
- `/internal` → `/developer/dashboard`
- `/login` → `/user/auth`
- `/app` → `/user/dashboard`

## Security Considerations

1. **Testing Credentials**: Treated as temporary, not permanent user accounts
2. **Expiration**: Set automatic expiration dates for test credentials
3. **Audit Trail**: Track all credential creation and usage
4. **Access Control**: Use PortalGate to enforce access rules
5. **Permission Validation**: Always check permissions server-side

## Future Enhancements

- Two-factor authentication for sensitive portals
- Credential rotation policies
- Advanced audit logging
- Role-based API access
- Team-based permission groups
- SSO integration for enterprise

---

For questions or issues, please contact the development team.
