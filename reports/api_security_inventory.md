# API Security Inventory (Phase 6C)

## Canonical Authorization Utility
The repository has been updated to use a centralized authorization utility located at `apps/admin/src/lib/auth/authorization.ts`. This utility exposes standard functions like:
- `requireAuthenticatedUser()`
- `requireAnyRole()`
- `requireRole()`

These utilities extract the user's role definitively from the database (via canonical sources) rather than relying on arbitrary string matching or user-provided parameters.

## API Hardening Status

### Team & General APIs
- `apps/admin/src/app/api/create-employee/route.ts`: ✅ Hardened to use `requireAnyRole(['owner', 'admin', 'hr', 'operations head'])`.
- `apps/admin/src/app/api/team/delete/route.ts`: ✅ Hardened to use `requireAnyRole(['owner', 'admin', 'hr'])`.
- `apps/admin/src/app/api/team/role/route.ts`: ✅ Hardened to use `requireAnyRole(['owner', 'admin', 'hr'])`.
- `apps/admin/src/app/api/attendance/route.ts`: ✅ Hardened to use `requireAuthenticatedUser()`.

### HR APIs (Leave & Shifts)
- `apps/admin/src/app/api/hr/shifts/route.ts`: ✅ Hardened to use `requireAnyRole` for writes and `requireAuthenticatedUser` for reads.
- `apps/admin/src/app/api/hr/leave/requests/route.ts`: ✅ Hardened to use `requireAuthenticatedUser` (employees fetching requests) or `requireAnyRole` (managers viewing all).
- `apps/admin/src/app/api/hr/leave/requests/[id]/review/route.ts`: ✅ Hardened. Uses `requireAuthenticatedUser()` to get identity, restricts to admins/HR, delegates to RPC `review_leave_request` to prevent self-approval.
- `apps/admin/src/app/api/hr/leave/balances/route.ts`: ✅ Hardened. Uses `requireAuthenticatedUser()` and restricts unauthorized querying of balances.

### Biometrics APIs
- `apps/admin/src/app/api/biometrics/mappings/route.ts`: ✅ Hardened. No insecure string matching.
- `apps/admin/src/app/api/biometrics/events/route.ts`: (Webhook) Validates via Api-Key headers (edge hardware).
- `apps/admin/src/app/api/biometrics/events/reprocess/route.ts`: ✅ Hardened. Uses `requireAnyRole(['owner', 'admin', 'hr', 'operations head'])` + mandatory `audit_logs` entry.
- `apps/admin/src/app/api/biometrics/devices/route.ts`: ✅ Hardened. Uses `requireAnyRole(['owner', 'admin', 'hr', 'operations head'])` for setup/query.
- `apps/admin/src/app/api/biometrics/devices/[id]/route.ts`: ✅ Hardened. Centralized auth and mandatory `audit_logs` tracking.
- `apps/admin/src/app/api/biometrics/devices/[id]/rotate-key/route.ts`: ✅ Hardened. Centralized auth and mandatory `audit_logs` tracking.
- `apps/admin/src/app/api/biometrics/devices/[id]/revoke-key/route.ts`: ✅ Hardened. Centralized auth and mandatory `audit_logs` tracking.

## General Observations & Remediations
1. **Self-Approval Bug Fixed**: A major security issue where admins could approve their own leave requests was addressed atomically inside a `SECURITY DEFINER` function (`review_leave_request`).
2. **Audit Logging Enforced**: Key biometrics endpoints and hardware lifecycle events now enforce `audit_logs` insertion, throwing errors and aborting state changes if the audit log insertion fails.
3. **No Insecure Roles**: Substring matches like `role.includes('admin')` have been thoroughly audited and removed.
4. **Vercel Build Stability**: `npm run typecheck` passes, ensuring the codebase contains no broken types or shadow variable syntax errors after refactoring.
