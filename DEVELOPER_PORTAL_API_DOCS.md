# Developer Portal Backend APIs

## Overview

The Developer Portal now has complete backend APIs that connect to your Supabase database. All data shown on the Developer Portal is now **real-time and synchronized** with actual user activity.

## API Structure

All APIs are located in `developer-portal-api.js` and are prefixed with `/api/developer/`.

### Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer {SUPABASE_AUTH_TOKEN}
```

The token must be from a user with one of these roles:
- `admin`
- `super_admin`
- `developer`

## Endpoints

### Dashboard Stats
**`GET /api/developer/dashboard/stats`**

Returns overview statistics for the dashboard.

**Response:**
```json
{
  "totalUsers": 1234,
  "activeUsers": 456,
  "newUsers": 78,
  "creditsConsumed": 45678,
  "aiRequests": 2345,
  "revenue": 45.68
}
```

**Data Source:**
- `totalUsers` - Count of all users in app_profiles table
- `activeUsers` - Count of unique users who made requests in last 7 days
- `newUsers` - Count of users registered in last 24 hours
- `creditsConsumed` - Sum of all credits_charged from usage_logs
- `aiRequests` - Count of production usage logs
- `revenue` - creditsConsumed × $0.001 per credit

---

### Users Management

#### List Users
**`GET /api/developer/users?page=1&limit=20`**

Returns paginated list of all users.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "status": "active",
      "credits": 1000,
      "videos": 5,
      "joinDate": "5/20/2026"
    }
  ],
  "totalCount": 1234,
  "page": 1,
  "limit": 20,
  "totalPages": 62
}
```

#### Get User Details
**`GET /api/developer/users/:userId`**

Returns detailed information about a specific user.

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "status": "active",
  "userCredits": 1000,
  "developerCredits": 0,
  "totalRequests": 45,
  "totalCreditsUsed": 3500,
  "joinedDate": "5/20/2026",
  "lastActive": "2026-05-29T10:30:00Z"
}
```

#### Add Credits to User
**`POST /api/developer/users/:userId/credits/add`**

Adds credits to a user's account.

**Request Body:**
```json
{
  "amount": 500,
  "reason": "Promotion credits"
}
```

**Response:**
```json
{
  "success": true,
  "newBalance": 1500
}
```

**Records:**
- Updates `user_credits` in app_profiles
- Logs transaction in usage_logs with metadata

#### Suspend User
**`POST /api/developer/users/:userId/suspend`**

Suspends a user account (prevents login).

**Response:**
```json
{
  "success": true,
  "message": "User suspended"
}
```

**Updates:**
- Sets `subscription_status` to "suspended"

---

### Credits Management

#### Get Credits Statistics
**`GET /api/developer/credits/stats`**

Returns overview of credit usage.

**Response:**
```json
{
  "userCreditsTotal": 567890,
  "developerCreditsTotal": 12345,
  "dailyConsumption": 1234,
  "averagePerUser": 45
}
```

**Data Source:**
- `userCreditsTotal` - Sum of all user_credits from app_profiles
- `developerCreditsTotal` - Sum of all developer_credits from app_profiles
- `dailyConsumption` - Sum of credits_charged from last 24 hours
- `averagePerUser` - dailyConsumption ÷ active users (24h)

#### Get Credit Transactions
**`GET /api/developer/credits/transactions?page=1&limit=50`**

Returns paginated credit transaction history.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 50)

**Response:**
```json
{
  "transactions": [
    {
      "id": "log-uuid",
      "user": "user@example.com",
      "type": "usage",
      "amount": 45,
      "reason": "ai_generated_video",
      "date": "5/29/2026, 10:30:45 AM"
    }
  ],
  "page": 1,
  "limit": 50
}
```

---

### Analytics

#### Get Analytics Data
**`GET /api/developer/analytics?timeRange=7d`**

Returns user activity analytics.

**Query Parameters:**
- `timeRange` - "today", "7d" (default), "30d", "all"

**Response:**
```json
{
  "dau": 234,
  "wau": 456,
  "mau": 789,
  "retentionRate": 65
}
```

**Metrics:**
- `dau` - Daily Active Users (last 24 hours)
- `wau` - Weekly Active Users (last 7 days)
- `mau` - Monthly Active Users (last 30 days)
- `retentionRate` - Percentage of users with multiple sessions (%)

**Calculation:**
- Active users = unique users with at least one usage_log entry
- Retention = (users with 2+ logs ÷ total unique users) × 100

---

### Error Logs

#### Get Error Logs
**`GET /api/developer/error-logs?timeRange=all&severity=critical,high&status=open&search=query`**

Returns error logs with filtering.

**Query Parameters:**
- `timeRange` - "today", "last7days", "all" (default)
- `severity` - Comma-separated: "critical", "high", "medium", "low"
- `status` - Comma-separated: "open", "resolved"
- `search` - Search in error_message, module, route

**Response:**
```json
{
  "errorLogs": [
    {
      "id": "error-uuid",
      "timestamp": "2026-05-29T10:30:00Z",
      "module": "api_request",
      "route": "/api/videos",
      "user_id": "user-uuid",
      "error_message": "Connection timeout",
      "stack_trace": "...",
      "severity": "high",
      "browser": "Chrome",
      "device": "Desktop",
      "status": "open",
      "additional_context": {}
    }
  ]
}
```

---

### Feedback

#### Get User Feedback
**`GET /api/developer/feedback`**

Returns all user feedback (if feedback_logs table exists).

**Response:**
```json
{
  "feedback": [
    {
      "id": "feedback-uuid",
      "user_id": "user-uuid",
      "type": "bug|suggestion|feature",
      "title": "Feedback title",
      "description": "Detailed feedback",
      "status": "open|resolved",
      "votes": 12,
      "created_at": "2026-05-29T10:30:00Z"
    }
  ]
}
```

---

### Settings

#### Get Developer Settings
**`GET /api/developer/settings`**

Returns current developer settings.

**Response:**
```json
{
  "aiModel": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000,
  "creditMultiplier": 1.0,
  "dailyBudget": 100000,
  "enableBeta": true,
  "notifyOnErrors": true
}
```

#### Update Settings
**`POST /api/developer/settings`**

Updates developer settings.

**Request Body:**
```json
{
  "aiModel": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000,
  "creditMultiplier": 1.0,
  "dailyBudget": 100000,
  "enableBeta": true,
  "notifyOnErrors": true
}
```

**Response:**
```json
{
  "success": true,
  "settings": { ... }
}
```

---

## Frontend Integration

### Service Layer
All API calls are abstracted through `src/services/developer-portal-api.service.ts`:

```typescript
import {
  fetchDashboardStats,
  fetchUsers,
  fetchCreditsStats,
  fetchAnalytics,
  // ... etc
} from '../services/developer-portal-api.service';

// Usage
const stats = await fetchDashboardStats();
const users = await fetchUsers(page, limit);
const credits = await fetchCreditsStats();
```

### Component Integration
Each developer portal page is updated to use real APIs:

- **Dashboard** - Fetches stats on mount
- **Users** - Fetches paginated user list
- **Credits** - Fetches stats and transactions
- **Analytics** - Fetches time-range filtered analytics
- **Error Logs** - Already using real error_logs table
- **Feedback** - Fetches feedback data
- **Settings** - Fetches/updates settings

## Data Flow

```
User Action (e.g., AI video generation)
  ↓
Create usage_log entry
  ↓
Update app_profiles (credits)
  ↓
Developer Portal API queries aggregate data
  ↓
Frontend component displays real data
```

## Example: Real-Time Tracking

When a user generates a video:

1. **Backend** logs the action to `usage_logs`:
   - user_id, credits_charged, feature_key, etc.

2. **Dashboard Stats API** automatically includes it:
   - aiRequests count increases
   - creditsConsumed total increases
   - revenue updates

3. **Frontend** refreshes and shows updated numbers

## Authentication Flow

```javascript
// Automatic token handling
const token = localStorage.getItem('sb-auth-token');
const response = await fetch('/api/developer/dashboard/stats', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

Token is automatically included in all calls via the service layer.

## Error Handling

All endpoints return proper HTTP status codes:

- **200** - Success
- **400** - Bad request (invalid parameters)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not found
- **500** - Server error

Error responses:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Next Steps

1. ✅ Backend APIs created and connected to database
2. ✅ Frontend pages updated to use real data
3. ⏳ **Optional**: Add WebSocket real-time updates for live data
4. ⏳ **Optional**: Create admin dashboard to manage API keys
5. ⏳ **Optional**: Add analytics charts and visualizations

## Testing

To test the APIs:

```bash
# Get dashboard stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/developer/dashboard/stats

# List users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/developer/users?page=1&limit=20

# Get credits stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/developer/credits/stats
```

---

## Summary

✅ **All developer portal features now connected to real database data**
✅ **Automatic data aggregation and calculation**
✅ **Real-time statistics as users interact with the system**
✅ **Admin controls for user management and credits**
✅ **Complete audit trail via usage_logs and error_logs**
