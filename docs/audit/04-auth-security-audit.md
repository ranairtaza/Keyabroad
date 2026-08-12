# Authentication & Security Audit

## Authentication Configuration
- **Provider**: Supabase Auth (Email/Password primarily).
- **Admin App**: Protected via Next.js Middleware (`keyabroad-admin/src/utils/supabase/middleware.ts`) ensuring users are authenticated.
- **Public App**: Currently lacks functional authentication. The `/student` page uses a hardcoded `setTimeout` mock login.
- **API Routes**: Relies on Supabase service role key (or falls back to anon key, which is dangerous) for elevated privileges (e.g., in `/api/chat`).

## Row Level Security (RLS)
- **Status**: Enabled on most tables, but poorly configured initially.
- **Vulnerabilities**: Several critical tables (`team_members`, `appointments`, `activity_logs`) had `FOR ALL USING (true)` meaning public read/write access. 
- **Remediation**: Phase 0 migrations (001 and 002) have been prepared to lock down these tables to `authenticated` users only, and introduce strict Role-Based Access Control (RBAC).

## Secrets & API Keys
- OpenAI API key is currently stored in the `integrations` table. While accessible only to authenticated users (post-migration), database storage of API keys is generally less secure than environment variables or a dedicated secrets manager like Supabase Vault.

## Client-Side Trust
- Admin panel UI heavily relies on client-side role checks (`currentUser.role === 'admin'`). While UI gating is fine, the backend APIs and RLS must independently verify these roles to prevent unauthorized access via direct API calls.
