# KEYABROAD — ENTERPRISE SECRET MANAGEMENT GUIDE

**Audience**: Software Engineers, DevOps / SRE, Security Administrators  
**Applies to**: `KeyAbroad Monorepo` (`apps/web`, `apps/admin`, `packages/*`, `supabase/`)  
**Standard**: SOC2 / ISO 27001 Secret Management Alignment  

---

## 1. Secret Architecture Overview

KeyAbroad employs a multi-tiered environment variable architecture designed to prevent credential leaks, maintain client/server isolation, and ensure high developer velocity without compromising security.

```
+-------------------------------------------------------------------------+
|                               Next.js Apps                              |
|                                                                         |
|  +-----------------------------+       +-----------------------------+  |
|  |     Browser / Client JS     |       |    Node.js Server Runtime   |  |
|  |  (NEXT_PUBLIC_* variables)  |       |   (Private Server Secrets)  |  |
|  +-----------------------------+       +-----------------------------+  |
|                 |                                     |                 |
+-----------------|-------------------------------------|-----------------+
                  |                                     |
                  v                                     v
       +--------------------+                +--------------------+
       |   Supabase Anon /  |                |   Supabase Secret  |
       |  Publishable Key   |                |     Role Key       |
       | (Enforces RLS)     |                | (RLS Bypass Admin) |
       +--------------------+                +--------------------+
```

### Core Security Rules:
1. **Never commit `.env` or `.env.local` files**: All local environment configuration must be stored in `.env.local`, which is strictly excluded in `.gitignore`.
2. **Never expose private credentials via `NEXT_PUBLIC_*`**: Only public endpoints and client-safe publishable keys may use the `NEXT_PUBLIC_` prefix.
3. **Fail Closed**: All server routes and privileged integrations must fail closed with clean 500/503 responses if required secrets are unconfigured.
4. **Timing-Safe Comparison**: All webhooks, API tokens, and cryptographic signatures must be verified using `crypto.timingSafeEqual` with buffer length pre-checks.

---

## 2. Canonical Environment Variable Registry

| Variable Name | Scope | Sensitivity | Description & Consumer |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client & Server) | Low | Base HTTPS URL of the Supabase project instance. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (Client & Server) | Low | Modern Supabase client key. Enforces Row Level Security (RLS). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client & Server) | Low | Legacy Supabase anon key. Retained as fallback. |
| `SUPABASE_SECRET_KEY` | Server-Only | **CRITICAL** | Modern administrative secret key. Bypasses RLS for backend tasks. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | **CRITICAL** | Legacy administrative key. Retained as fallback for older routes. |
| `SUPABASE_WEBHOOK_SECRET` | Server-Only | **HIGH** | Verifies `x-supabase-webhook-secret` headers on database webhooks. |
| `WEBHOOK_SECRET` | Server-Only | **HIGH** | Verifies `x-webhook-signature` HMAC-SHA256 signatures on ingest webhooks. |
| `CRON_SECRET` | Server-Only | **HIGH** | Bearer token protecting Vercel Cron and automated maintenance routes. |
| `LEADMACHINE_INTEGRATION_SECRET` | Server-Only | **HIGH** | Bearer token protecting LeadMachine server-to-server endpoints. |
| `OPENAI_API_KEY` | Server-Only | **HIGH** | API key for OpenAI GPT models in OCR and AI evaluations. |
| `UPSTASH_REDIS_REST_URL` | Server-Only | Medium | Upstash Redis connection URL for distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Server-Only | **HIGH** | Upstash Redis authentication token. |

---

## 3. Local Development Setup

### Initial Configuration:
1. Copy the canonical template for each workspace:
   ```bash
   # Root monorepo
   cp .env.example .env.local

   # Web application
   cp apps/web/.env.example apps/web/.env.local

   # Admin portal
   cp apps/admin/.env.example apps/admin/.env.local
   ```
2. Populate `.env.local` with your development/staging credentials.
3. Verify that Git ignores your local files:
   ```bash
   git status
   # Ensure .env.local does NOT appear in untracked files
   ```

---

## 4. Production Secret Management

### A. Vercel (Web & Admin Deployments)
Configure secrets in the Vercel Dashboard under **Project Settings > Environment Variables**:
* Target Environments: Select **Production**, **Preview**, and **Development** appropriately.
* Encrypt and lock sensitive values: Ensure `SUPABASE_SECRET_KEY`, `WEBHOOK_SECRET`, and `OPENAI_API_KEY` are not set to "Automatically expose System Environment Variables".

### B. Supabase Edge Functions & Webhooks
* Store secrets in Supabase via CLI or Dashboard:
  ```bash
  supabase secrets set SUPABASE_WEBHOOK_SECRET=your_secure_secret
  ```
* In Supabase Webhooks (`Database > Webhooks`), add the custom HTTP header:
  `x-supabase-webhook-secret: <your_configured_secret>`

### C. Azure Key Vault (Optional / Enterprise Hybrid Services)
For external enterprise microservices requiring Azure integration:
* Store keys as Azure Key Vault Secrets.
* Mount secrets as environment variables using Managed Identity in Azure App Service or Container Apps.
* Do not introduce Azure Key Vault for standard Vercel/Supabase deployments.

---

## 5. Production Credential Incident & Rotation Procedure

When credentials have been exposed in version control or compromised:

### Step 1: Generate New Credentials
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Project Settings > API Keys**.
3. Generate a new **Secret Key** (`sb_secret_...`) and note the new **Publishable Key**.

### Step 2: Deploy to Production
1. In the **Vercel Dashboard**, update the environment variables for both `apps/web` and `apps/admin`:
   - Set `SUPABASE_SECRET_KEY` = `<new_secret_key>`
   - Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `<new_publishable_key>`
2. Trigger a production redeployment in Vercel to ensure all running containers receive the new keys.

### Step 3: Verify Application Health
1. Test student authentication on `apps/web`.
2. Test staff authorization and dashboard queries on `apps/admin`.
3. Verify webhook receivers and AI endpoints.

### Step 4: Revoke Compromised Credentials
1. In the Supabase Dashboard, revoke the compromised **Secret Key**.
2. Under **Project Settings > API**, rotate the **JWT Secret** to immediately invalidate all historical Service Role JWT tokens.

### Step 5: Git History Remediation (Post-Rotation)
1. Ensure all team members have committed their local work.
2. In an isolated maintenance clone, remove the tracked legacy artifacts:
   ```bash
   # Untrack temporary CLI files
   git rm -r --cached supabase/.temp
   git commit -m "chore(security): untrack supabase temporary artifacts"
   ```
3. Purge historical secrets using `git-filter-repo`:
   ```bash
   # Example: purge remove_test_data.js from all commits
   git-filter-repo --path remove_test_data.js --invert-paths
   ```
4. Force-push the cleansed history to GitHub after team synchronization.

