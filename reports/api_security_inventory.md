# KeyAbroad 2.0 API Security Inventory

## Overview
This document inventories the protected API routes and their authorization mechanisms after the Phase 6C security hardening.

## Core Authorization Service
All protected API routes now utilize the canonical server-side utility `resolveCurrentEmployee` defined in `apps/admin/src/lib/auth/authorization.ts`.

This service guarantees:
1. **Authenticated Session Verification**: Validates the JWT securely via Supabase.
2. **Canonical Role Lookup**: Cross-references the authenticated `email` with `team_members` to retrieve the canonical `role`.
3. **Type-Safe Access**: Enforces the `SecurityRole` type (`owner | admin | hr | operations head | employee`), replacing insecure arbitrary substring matching (`role.includes('admin')`).

## Protected Endpoints

### Team Management
- `POST /api/team/delete`
  - **Protection**: `role === 'owner'`
  - **Guards**: Prevents deletion if biometric historical records exist (legal audit protection).
- `POST /api/team/role`
  - **Protection**: `role === 'owner'`
  - **Purpose**: Server-side role assignment.
- `POST /api/team/resign`
  - **Protection**: `role === 'owner'`
  - **Purpose**: Marks employee as resigned.
- `POST /api/team/update-profile`
  - **Protection**: `role === 'owner'` OR updating self.
  - **Guards**: Self-updates strip sensitive fields (salary, joined, role, email).

### Employee Creation
- `POST /api/create-employee`
  - **Protection**: `role === 'owner'`

### Attendance & Biometrics
- `POST /api/attendance/correction`
  - **Protection**: `role === 'owner' || role === 'admin' || role === 'hr'`
- `POST /api/automations/mark-absent`
  - **Protection**: Service Role (internal automation) or `owner/admin/hr` for manual trigger.
- `POST /api/biometrics/events/reprocess`
  - **Protection**: `role === 'owner' || role === 'admin' || role === 'hr'`

### Database Row Level Security (RLS)
The migration `049_security_rls_hardening.sql` hardens direct database access using `public.get_canonical_role()`.

- **team_members**: Owners and HR can update, employees can only select their own data.
- **attendance_events**: Devices can insert, HR/Admins can select.
- **leave_requests**: HR/Admins can manage all, employees can insert/update their own pending requests.
- **shifts**: Admins/HR manage all, employees can select.

## Client-Side Hardening
- Direct `supabase.from('team_members').update()` removed from client-side pages (`team/page.tsx`, `settings/page.tsx`).
- Operations migrated to secure `/api/team/...` endpoints.

## Eradicated Vulnerabilities
- No string matching `role.includes(...)`.
- No hardcoded email bypasses (e.g., `user.email === '...'`).
- No client-side direct writes to sensitive HR tables.
