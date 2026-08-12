# Security Architecture

## Authentication
- **Provider**: Supabase Auth (Email/Password & Magic Links).
- **Session Strategy**: Server-Side Rendering (SSR) via cookies. Next.js Middleware verifies sessions on every request to protected routes.
- **Role Assignment**: `auth.users` maps to either the `profiles` table (staff) or the `students` table (customers).

## Authorization (RBAC)
- **Frontend Gating**: UI components (buttons, links, pages) are hidden or shown based on the user's role and associated permissions (defined in `packages/validation/permissions.ts`).
- **Backend Enforcement**: Row Level Security (RLS) is the ultimate gatekeeper. Every table has strict policies that verify `auth.uid()` and cross-reference the user's role in the `profiles` table before allowing SELECT, INSERT, UPDATE, or DELETE.

## Data Isolation
- **Student Data**: Isolated by `user_id`. A student can strictly only view rows where `user_id = auth.uid()`.
- **Counselor Data**: Counselors can only view/modify students where `assigned_counselor_id = auth.uid()`, plus leads they are assigned to.
- **Admin/Super Admin**: Have broad access but actions are logged.

## API Security
- **Edge Functions / Route Handlers**: Protected by verifying the session cookie before processing.
- **Service Role Keys**: Never exposed to the frontend. Used exclusively in secure server environments (e.g., webhook handlers) where RLS bypass is intentionally required.

## Secret Management
- API keys (OpenAI, email providers) are stored in server-side environment variables (`.env.local`), NOT in the database `integrations` table as they currently are, to prevent exposure via database dumps or SQL injection.

## Application Security Headers
Configured in `next.config.ts`:
- **Content Security Policy (CSP)**: Restricts script sources.
- **X-Frame-Options**: `DENY` to prevent clickjacking.
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS.
- **X-Content-Type-Options**: `nosniff`.
