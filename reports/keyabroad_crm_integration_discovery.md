# KeyAbroad CRM Integration Discovery

## Architecture
- **Frontend Framework**: Next.js (App Router, React 19)
- **Backend/API Framework**: Next.js API Routes (limited to webhooks/export) + Supabase PostgREST for direct client-to-database communication.
- **Database Technology**: PostgreSQL (managed via Supabase).
- **Deployment Architecture**: Hosted on Vercel (monorepo using Turborepo).
- **Local Development**: Supabase Local CLI + Next.js development server.

## Database
- Schema is managed via Supabase migrations (`supabase/migrations`).
- TypeScript interfaces acting as the source of truth are maintained in `packages/database/src/index.ts`.
- The database uses Row Level Security (RLS) to enforce access control.

## Authentication
- Handled entirely by Supabase Auth (`@supabase/ssr` / `@supabase/auth-helpers-nextjs`).
- Uses cookie-based session management.
- Enforced via Next.js middleware which checks for active sessions and user roles (blocking `student` roles from the admin panel).

## Existing APIs
- Next.js API routes are sparse and mostly for webhooks and background tasks:
  - `/api/leads/webhook` (Incoming leads)
  - `/api/export` (Data export)
  - `/api/health`
- **There is NO existing REST API or GraphQL endpoint intended for general read-access consumption by third parties.** The frontend interacts directly with the Supabase PostgREST API.

## CRM Entities
Based on the TypeScript definitions, the core CRM concepts are represented as:
- **Leads**: `Enquiry`
- **Contacts/Deals**: `Student`
- **Applications**: `StudentApplication`
- **Activities**: `FollowUp`, `OfficeTask`, `ActivityLog`
- **Companies**: Does not exist as a standard B2B entity (only `University` as a destination).
- **Invoices/Fees**: `Invoice`, `FeeLog`
- **Users/Employees**: `Profile`, `TeamMember`

## LeadMachine Field Mapping

| KeyAbroad Field | Entity | LeadMachine Field | Transformation | Available? |
| :--- | :--- | :--- | :--- | :--- |
| `Student.name` / `Enquiry.full_name` | Contact | Contact Name | Direct map | Yes |
| `Student.email` / `Enquiry.email` | Contact | Email | Direct map | Yes |
| `Student.phone` / `Enquiry.mobile` | Contact | Phone | Direct map | Yes |
| `Enquiry.status` | Lead | Lead Status | Map Enum to LeadMachine statuses | Yes |
| `Student.admissions_stage` | Deal | Pipeline Stage | Direct map | Yes |
| `Enquiry.total_budget_pkr` | Deal | Deal/Application Value | Cast string to numeric | Yes |
| `Student.assigned_counselor_id` | Deal | Owner | Map UUID to LeadMachine User | Yes |
| `created_at` | All | Created Date | Direct map | Yes |
| `updated_at` | StudentApplication | Updated Date | Direct map | Yes (only on some entities) |
| N/A | Deal | Expected Close Date | - | **No** |
| `FollowUp.notes` / `ActivityLog` | Activity | Activity Notes | Extract and append | Yes |
| N/A | Company | Company Identity | - | **No** |

## Recommended Integration Method
**Option A/B: Dedicated Read-Only Integration API in KeyAbroad CRM**

Given the lack of a suitable existing API and the risks of giving a third-party service direct database connection/PostgREST access, we should build a dedicated read-only integration endpoint within the KeyAbroad Next.js API (e.g., `/api/integrations/leadmachine`).

*Data Flow:* KeyAbroad CRM → authenticated read-only integration API → LeadMachine CRM adapter → normalized LeadMachine data.

Do NOT give LeadMachine direct Supabase Service Role Keys, as this grants unrestricted write access by default and bypasses RLS.

## Security Risks
- **PII Exposure**: The CRM contains highly sensitive student data (passports, phone numbers, birth dates).
- **Service-to-Service Auth**: Does not currently exist. We must implement a secure Bearer token or API key mechanism specifically for LeadMachine.
- **Tenant Isolation**: KeyAbroad is a single-tenant application, so isolation is not a factor natively, but LeadMachine must securely map to this specific tenant.

## Required Changes
1. Create a secure API route in the KeyAbroad `admin` app: `/app/api/integrations/leadmachine/route.ts`.
2. Implement API key authentication for this route via headers (e.g., `x-api-key`).
3. Shape the response payload to only expose necessary, non-sensitive fields (exclude `file_urls`, passports, dob).

## Local Setup
To run the integration locally, LeadMachine would need to communicate with the local KeyAbroad instance:
- **Required Local Services**: Next.js Dev Server (Admin App), Supabase Local.
- **Required Ports**: Usually `3000` (Next.js) and `54321` (Supabase API).
- **Required Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INTEGRATION_API_KEY` (to be created).
- **Authentication Requirements**: An API key header passed to the newly built local API route.

## Production Considerations
- The API route should be heavily rate-limited on Vercel to prevent abuse.
- The API key should be injected via Vercel Environment Variables.
- Pagination must be implemented in the API to prevent Vercel serverless function timeouts (10-15s limit) when fetching large lists of leads.

## Blockers
- None. Discovery is complete.

## Exact Next Implementation Step
1. In KeyAbroad CRM, create the dedicated, authenticated Next.js API route (`/api/integrations/leadmachine`) that exposes a paginated list of mapped `Enquiry` and `Student` records securely.

---
STATUS: READY

RECOMMENDED INTEGRATION:
Dedicated Authenticated Read-Only Integration API Endpoint in KeyAbroad CRM Next.js backend.

NEXT IMPLEMENTATION TASK:
Implement `/api/integrations/leadmachine` read-only API endpoint in KeyAbroad CRM with simple API key authentication.
