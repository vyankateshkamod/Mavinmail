# Backend Handoff Document: Dashboard Static

## 1. Project Overview
This project is a static frontend prototype for an **AI Email Assistant Dashboard**. It provides users with improved email productivity through AI-driven summarization, auto-replies, and task extraction.

**Target Audience:** Professionals managing high volumes of email across multiple providers (Gmail, Outlook).
**Core Problem Solved:** Reduces email overwhelm by aggregating accounts and automating routine actions.

## 2. Tech Stack (Frontend)
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI (using CSS variables for theming)
- **Icons:** Lucide React
- **Theme Management:** `next-themes` (Light/Dark/System support)

## 3. Screen & Feature Breakdown

| Screen | Route | Purpose | Key User Actions |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/dashboard` | Main overview of AI activity. | View stats, view recent tasks, quick actions (compose, schedule). |
| **Connected Accounts** | `/dashboard/accounts` | Manage linked email providers. | Add account, re-connect (re-auth), remove account, refresh status. |
| **Settings** | `/dashboard/settings` | Configure AI behavior. | Toggle auto-reply, draft mode, summaries, notifications. |
| **Profile** | `/dashboard/profile` | User personal details. | Update name/email/bio, change avatar. |
| **Subscription** | `/dashboard/subscription` | Billing and usage info. | View usage quotas, upgrade plan. |
| **Support** | `/dashboard/support` | Help center. | Submit support ticket, view FAQs. |

## 4. Data Requirements

### Dashboard Screen
**Read-Only Data:**
- **Stats:** Aggregated metrics (Total Emails, Time Saved, etc.).
- **Recent Tasks:** List of AI-generated tasks.

**Data Fields:**
```json
// Stats
{
  "title": "Total Emails Processed", // string
  "value": "12,345", // string or number
  "change": "+12% from last month", // string
  "trend": "up" | "down" // derived or explicit
}

// Tasks
{
  "id": "1", // string
  "title": "Review Q3 Report", // string
  "source": "Gmail", // "Gmail" | "Outlook"
  "status": "Pending" | "In Progress" | "Completed",
  "priority": "High" | "Medium" | "Low", // Optional
  "timestamp": "2023-10-27T10:00:00Z" // ISO string
}
```

### Connected Accounts Screen
**Mutable Data:**
- List of accounts (Add/Delete/Refresh).

**Data Fields:**
```json
{
  "id": "acc_123", // string
  "provider": "Gmail", // "Gmail" | "Outlook" | "IMAP"
  "email": "user@example.com", // string
  "status": "Active" | "Re-auth Needed" | "Error",
  "lastSync": "2023-10-27T10:30:00Z" // ISO string
}
```

### Settings Screen
**Mutable Data:**
- User preferences.

**Data Fields (All required):**
- `autoReplyEnabled`: boolean
- `draftModeEnabled`: boolean
- `smartSummaryEnabled`: boolean
- `emailAlertsEnabled`: boolean

### Profile Screen
**Mutable Data:**
- User details.

**Data Fields:**
- `firstName`: string (Required)
- `lastName`: string (Required)
- `email`: string (Read-only? or Mutable with verification?)
- `bio`: string (Optional)
- `avatarUrl`: string (Optional)

## 5. API Contract Expectations

The following are **suggested** REST endpoints based on the UI structure.

### Dashboard
- **GET** `/api/dashboard/summary`
    - **Response:** `{ stats: [], tasks: [] }`

### Accounts
- **GET** `/api/accounts`
    - **Response:** `[ { id, provider, email, status, lastSync } ]`
- **POST** `/api/accounts`
    - **Payload:** `{ provider: "Gmail", authCode: "..." }` (OAuth flow assumed)
- **DELETE** `/api/accounts/:id`
- **POST** `/api/accounts/:id/sync` (External action: Refresh)

### Settings
- **GET** `/api/settings`
    - **Response:** `{ autoReply: true, draftMode: true, ... }`
- **PATCH** `/api/settings`
    - **Payload:** `{ autoReply: false }` (Partial updates)

### Profile
- **GET** `/api/profile`
    - **Response:** `{ firstName, lastName, ... }`
- **PATCH** `/api/profile`
    - **Payload:** `{ bio: "New bio..." }`

## 6. Authentication & Authorization
- **Assumption:** All `/dashboard/*` routes require authentication.
- **Protocol:** Bearer Token (JWT) in Authorization header.
- **Session:** Session expiry should handle "Re-auth Needed" states gracefully, especially for connected accounts vs application login.

## 7. State & Update Flow
- **Loading:** Frontend will implement skeleton loaders while fetching initial data.
- **Updates:**
    - **Settings:** Optimistic UI updates recommended (toggle switches immediately, revert on error).
    - **Forms (Profile/Support):** Standard "Submitting..." state with disable buttons.
    - **Accounts:** "Syncing" state needed for individual cards when refreshing.

## 8. Validation Rules
**Backend Enforcement Required:**
- **Email:** Unique constraint on user profile email?
- **Bio:** Max length (e.g., 500 chars).
- **Accounts:** Prevent duplicate linking of the exact same email account?

## 9. Edge Cases & Failure States
- **Empty States:**
    - No connected accounts: Show "Add your first account" CTA.
    - No recent tasks: Show "All caught up" message.
- **Errors:**
    - API 500: Generic error toast.
    - API 401: Redirect to login.
    - API 403: Permission denied toast.

## 10. Open Questions for Backend Team
1.  **Auth Provider:** integrate with Auth0, Clerk, or custom?
2.  **Streaming:** Do we need streaming responses for AI Tasks generation, or is polling sufficient?
3.  **Real-time:** Do we need WebSockets for "Live" sync status, or is refresh-on-load okay?
4.  **Pagination:** Do we need pagination for the "Recent Tasks" list? (Currently showing top 5-10).
