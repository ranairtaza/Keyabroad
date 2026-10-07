# LeadMachine Integration API Audit Report

## Security Model
The API (`/api/integrations/leadmachine/route.ts`) operates strictly as a read-only endpoint. It relies on a dedicated `supabaseAdmin` client bypassing RLS, but ensures safety by explicitly hardcoding the queried tables (`enquiries`, `students`) and explicitly allowing only specific `select()` columns. It does not accept any user-controlled table or column names, nor does it expose any mutation operations (no INSERT, UPDATE, DELETE).

## Authentication
Authentication strictly enforces a Bearer token provided in the `Authorization` header. It is compared in constant time (`crypto.timingSafeEqual`) against the server-side environment variable `LEADMACHINE_INTEGRATION_SECRET`. The secret is never exposed in responses or logs. Missing, malformed, or incorrect tokens yield a `401 Unauthorized`.

## Database Access
The endpoint uses the Supabase service role key to query data. However, the service role key is retrieved securely via server-side environment variables and never leaves the backend execution context.

## Exposed Fields
The API returns a deterministic schema:
- `id`: The UUID of the record (`id`).
- `type`: Enum ('lead' or 'contact').
- `name`: `Enquiry.full_name` or `Student.name`.
- `email`: `email`.
- `phone`: `Enquiry.mobile` or `Student.phone`.
- `status`: `Enquiry.status` (for leads).
- `pipeline_stage`: `Student.admissions_stage` (for contacts).
- `value`: `Enquiry.total_budget_pkr` (cast to numeric) or `0`.
- `currency`: Defaulted safely to 'PKR'.
- `owner_id`: `Student.assigned_counselor_id` (for contacts).
- `created_at`: `created_at` (used as both create and update timestamp).
- `updated_at`: Replicated from `created_at`.

## Excluded Fields
All sensitive PII explicitly excluded by strict column selection:
- No passports (`passport_available`).
- No dates of birth (`dob`).
- No file uploads or document URLs.
- No Supabase Auth UUIDs other than assigned counselors.

## Pagination Semantics
Pagination employs a sequential, concatenated logic combining total counts from both tables (`enquiries` followed by `students`). It correctly utilizes exact database bounds (`totalRecords`), resolving previous overlap issues. Global pagination limits (max 500) and `page` + `limit` semantics accurately manage deterministic offset logic.

## Incremental Sync Semantics
The endpoint accepts an optional `updated_since` ISO-8601 query parameter. If provided, both underlying database queries dynamically append `.gte('created_at', updatedSince)`. Validations prevent malformed parameters (`400 Bad Request`). Note: Due to schema constraints, `updated_since` falls back to `created_at`.

## Rate Limiting
Reuses the native `@keyabroad/auth/rate-limit` utility, ensuring IP-based limits (30 requests/minute). The limiter functions efficiently within Edge/Vercel boundaries, returning a standardized `429 Too Many Requests` when triggered.

## Audit Logging
Successful reads invoke a fire-and-forget `audit_logs` insert with `user_email: 'leadmachine@integration'` and the pagination metadata. Crucially, the Bearer token and returned records are not logged, maintaining PII and credential safety.

## Tests
- Tested implicit 401 bounds on omitted `LEADMACHINE_INTEGRATION_SECRET` and malformed headers.
- Tested pagination fallback maxes (limit > 500 reverts to 500).
- Handled invalid `updated_since` inputs safely with standard 400 responses.

## Build
Verified successful linting and TypeScript checking via standard CI tools.

## Known Limitations
- Real `updated_at` timestamps are unavailable on core `enquiries` and `students` tables; incremental sync heavily depends on row creation order (`created_at`).
- Expected close date is unsupported within the current CRM schema.

The endpoint is application-level read-only. The underlying Supabase service-role credential remains privileged and must never be exposed to LeadMachine.
