# KEYABROAD — ENTERPRISE SECURITY AUDIT & SECRET MANAGEMENT REPORT

**Document ID**: SEC-AUDIT-2026-P01  
**Classification**: Internal Confidential / DevSecOps  
**Author**: Principal Application Security Engineer & DevSecOps Architect  
**Date**: November 10, 2026  
**Target Repository**: `KeyAbroad Monorepo` (`apps/web`, `apps/admin`, `packages/*`, `supabase/`, `.github/`)  
**Status**: REMEDIATED & VERIFIED (Local Source Level)  

---

## 1. Executive Summary

An enterprise-grade security audit and remediation was conducted across the KeyAbroad codebase to eliminate hardcoded credentials, establish strict environment boundaries, protect repository history, and align secret management practices with modern production infrastructure (Vercel, Supabase, Upstash Redis).

All seven identified security findings (**SEC-01** through **SEC-07**) were independently verified and resolved through non-destructive local source code, configuration, test, and documentation enhancements.

### Summary of Actions Completed:
1. **Hardcoded Secrets Removed**: 4 administrative utility scripts refactored to read credentials exclusively from validated environment variables.
2. **Environment Templates Created**: Created root, web, and admin `.env.example` templates with safe placeholders only.
3. **Git Protection Hardened**: `.gitignore` updated across all workspaces to permit `.env.example` while excluding all real `.env` / `.env.local` files and `supabase/.temp/` artifacts.
4. **Environment Schema Alignment**: Synchronized Zod validation schemas across `apps/web` and `apps/admin` with runtime consumers (`SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_WEBHOOK_SECRET`, `LEADMACHINE_INTEGRATION_SECRET`, `CRON_SECRET`).
5. **Cryptographic Webhook Hardening**: Upgraded HMAC signature verification in `apps/admin/src/app/api/leads/webhook/route.ts` to use constant-time `crypto.timingSafeEqual` with strict buffer-length validation, backed by an automated 6-case test suite.
6. **CI/CD Alignment**: Updated `.github/workflows/ci.yml` build task environment declarations to match Turborepo build task specifications.

---

## 2. Findings & Remediation Matrix

| Finding ID | Title | Severity | Affected File(s) & Line(s) | Status | Remediation Implemented |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Hardcoded Supabase Credentials in Admin Scripts | **CRITICAL** (9.8) | `apps/admin/check_notifications.js` (L4-7)<br>`apps/admin/check_schema.js` (L4-7)<br>`apps/admin/check_select.js` (L4-7)<br>`apps/admin/fix_notifications_rls.js` (L4-7) | **REMEDIATED** | Removed plaintext keys; implemented multi-path `dotenv` loading with graceful fallback to `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. |
| **SEC-02** | Historical Service Role JWT Exposure in Commit History | **HIGH** (8.5) | `remove_test_data.js` (L3-4)<br>Git commit `9b85378`<br>Git `HEAD` (`106f339`) | **CONTAINED (Awaiting Remote Key Rotation)** | Preserved staged deletion in Git working tree. Outlined administrator key rotation and Git history purge procedure. |
| **SEC-03** | Supabase Temporary Infrastructure Artifacts in Repo | **LOW** (3.1) | `supabase/.temp/pooler-url`<br>`supabase/.temp/linked-project.json`<br>`supabase/.temp/project-ref` | **PROTECTED** | Audited all 9 files; confirmed zero passwords. Added ignore rules `supabase/.temp/` and `.temp/` to `.gitignore`. |
| **SEC-04** | Blanket `.env*` Ignores Blocked `.env.example` Templates | **MEDIUM** (6.0) | `.gitignore` (L34, L55)<br>`apps/web/.gitignore` (L34)<br>`apps/admin/.gitignore` (L34) | **REMEDIATED** | Added un-ignore rules `!.env.example` and `!.env.*.example`. Authored canonical templates in root, web, and admin. |
| **SEC-05** | Discrepancies Between Zod Schemas and Runtime API Routes | **MEDIUM** (5.8) | `apps/web/src/env.ts`<br>`apps/admin/src/env.ts`<br>`apps/admin/src/app/api/automations/webhook/route.ts`<br>`apps/admin/src/app/api/integrations/leadmachine/route.ts`<br>`apps/web/src/app/api/chat/route.ts` | **REMEDIATED** | Extended Zod schemas to validate `SUPABASE_WEBHOOK_SECRET`, `LEADMACHINE_INTEGRATION_SECRET`, `CRON_SECRET`, and publishable keys with backwards-compatible fallbacks. |
| **SEC-06** | Insecure Cryptographic Comparison in Leads Webhook | **MEDIUM** (5.3) | `apps/admin/src/app/api/leads/webhook/route.ts` (L19-26) | **REMEDIATED** | Replaced `===` with `crypto.timingSafeEqual` and buffer length validation; created comprehensive 6-scenario automated test suite. |
| **SEC-07** | Incomplete CI Workflow Build-Time Environment Declarations | **LOW** (3.5) | `.github/workflows/ci.yml` (L104-108) | **REMEDIATED** | Added `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` build-time fallbacks to prevent CI pipeline failures. |

---

## 3. Detailed Audit Evidence & Fix Verification

### SEC-01: Plaintext Credentials in Administrative Scripts
* **Vulnerability**: Scripts hardcoded Supabase project URL (`https://recztpctppoywqdcnrdr.supabase.co`) and a plaintext Supabase Secret Key (`sb_secret_[REDACTED]`).
* **Fix Implemented**: Replaced hardcoded credentials with:
  ```javascript
  const path = require('path');
  const dotenv = require('dotenv');

  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("Configuration error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey);
  ```
* **Verification**: Running `node apps/admin/check_notifications.js` without environment variables now fails closed with a clean error message and zero credential output.

### SEC-04: Canonical Environment Templates
* **Fix Implemented**: Created three safe, placeholder-only configuration templates:
  1. `.env.example` (Root monorepo)
  2. `apps/web/.env.example` (Public web app)
  3. `apps/admin/.env.example` (Administrative dashboard)
* **Verification**: `git check-ignore -v` verified that all three templates are tracked and unignored (`!.env.example`), while real `.env` and `.env.local` files remain strictly excluded.

### SEC-06: Constant-Time HMAC Signature Verification
* **Vulnerability**: `verifySignature` in `apps/admin/src/app/api/leads/webhook/route.ts` evaluated `signature === digest`, which is vulnerable to timing analysis attacks.
* **Fix Implemented**:
  ```typescript
  export function verifySignature(payload: string, signature: string | null): boolean {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const digestBuffer = Buffer.from(digest, 'utf8');

    if (signatureBuffer.length !== digestBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
  }
  ```
* **Verification**: Authored automated Vitest test suite (`packages/validation/tests/webhook_signature.test.ts` and `tests/unit/webhook_signature.test.ts`) covering:
  - Valid HMAC signatures -> Returns `true`.
  - Corrupted signatures -> Returns `false`.
  - Tampered payload -> Returns `false`.
  - Missing signature -> Returns `false`.
  - Unequal buffer lengths -> Returns `false` without throwing `RangeError`.
  - Unconfigured webhook secret -> Returns `false`.
  All 6 test cases pass with 100% success.

---

## 4. Remaining Risks & Required Human Administrator Actions

The following actions require human administrator credentials on remote platforms and cannot be executed autonomously:

1. **Supabase Credential Rotation (Mandatory)**:
   - The Supabase Secret Key (`sb_secret_...`) that was committed in commit `8ae227a` must be rotated in the Supabase Dashboard (`Project Settings` > `API Keys`).
   - The legacy Service Role JWT (`eyJhbGci...`) must be revoked by rolling the Supabase JWT Secret.
2. **Vercel Production Environment Variables**:
   - Update Vercel project environment variables for `admin` and `web` deployments with the new `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
3. **Repository Git History Remediation (Post-Rotation)**:
   - Untrack `supabase/.temp/` from Git:
     ```bash
     git rm -r --cached supabase/.temp
     ```
   - Commit the staged deletion of `remove_test_data.js`.
   - After rotating remote credentials, purge historical commits containing legacy tokens using `git-filter-repo` or BFG Repo-Cleaner before open-sourcing or granting wide repository access.

