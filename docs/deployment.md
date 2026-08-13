# Production Deployment & Operational Runbook

This is the canonical, authoritative deployment document for Keyabroad 2.0. All staging and production operations must follow this procedure.

---

## 1. Environment Configuration

Each application owns its own environment boundary. Secrets are scoped strictly to the server execution context that requires them.

### apps/web (Vercel Project: `keyabroad-web`)
| Variable | Required | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Public (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public (client-safe) |
| `UPSTASH_REDIS_REST_URL` | Optional | Server-only |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Server-only |

### apps/admin (Vercel Project: `keyabroad-admin`)
| Variable | Required | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Public (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server-only. Never expose to client.** |
| `UPSTASH_REDIS_REST_URL` | Optional | Server-only |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Server-only |
| `WEBHOOK_SECRET` | Optional | Server-only |
| `OPENAI_API_KEY` | Optional | Server-only |

**Critical Rule**: Server-side variables must never be prefixed with `NEXT_PUBLIC_`. Only public Supabase keys use that prefix.

---

## 2. Vercel Monorepo Configuration

We use two independent Vercel projects linked to the same GitHub repository.

### Vercel Project Settings (apply to BOTH web and admin):
- **Root Directory**: `apps/web` for web project, `apps/admin` for admin project
- **Build Command**: (auto-detected via `package.json`)
- **Ignored Build Step**: `npx turbo-ignore`

`npx turbo-ignore` reads Turborepo's dependency graph and determines whether the current project's source or its shared package dependencies have changed. This guarantees:
- A commit that only touches `apps/web` will skip the `admin` deployment.
- A commit that touches `packages/ui` will trigger deployments for both `apps/web` and `apps/admin`.

---

## 3. CI/CD & Promotion Strategy

1. **Pull Request**: GitHub Actions runs `ci.yml`:
   - Migration safety validation (uncommitted files + dangerous operations)
   - `npm ci` (strict lockfile enforcement)
   - Typecheck → Lint → Security Audit → Build
   - PRs are **blocked** from merging until all checks pass.

2. **Branch Protection** (Manual — configure in GitHub):
   - Protect the `main` branch.
   - Require status checks: `validate-migrations`, `build-and-test`.
   - Require approvals before merge.
   - No force pushes.

3. **CI Concurrency Policy**:
   - PRs: `cancel-in-progress: true` — cancel stale builds on new push.
   - `main` branch pushes: `cancel-in-progress: false` — never cancel production deployments mid-flight.

4. **Staging**: Merging to `main` auto-deploys to Vercel Staging environments (connected to Supabase Staging project).

5. **Production Promotion**: After smoke tests pass on Staging, use Vercel Dashboard → "Promote to Production" to push the exact same immutable build artifact to Production. Never trigger a fresh build for production.

---

## 4. Database Migration Safety

**Rule: Never mutate any database manually via the Supabase UI.**
**Rule: Never run `supabase db push` without specifying an explicit `--project-ref`.**
**Rule: Only version-controlled, reviewed, committed migrations reach Production.**

### Workflow:
1. Create new migration: `npm run db:migration:new -w packages/database -- --name "description"`
2. Write SQL in the generated file.
3. Test locally: `npm run db:migrate:up -w packages/database`
4. Commit migration file. CI will automatically validate it.
5. **Dangerous operations** (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, etc.) will **fail CI** and require a maintainer to review and approve.
6. After merge, apply to Staging: `supabase db push --project-ref <staging-ref>`
7. Verify Staging is healthy via smoke tests.
8. Apply to Production: `supabase db push --project-ref <production-ref>`

---

## 5. Post-Deployment Smoke Tests

After every production promotion, execute:

```bash
WEB_URL=https://keyabroad.com \
ADMIN_URL=https://admin.keyabroad.com \
WEBHOOK_SECRET=<secret> \
node tests/smoke-test.js
```

Smoke tests verify:
- `GET /api/health` → `{ "status": "UP" }` (both apps)
- `GET /api/health/ready` → `{ "status": "READY" }` (admin, authenticated)
- Zero mutations to production data

---

## 6. Rollback Strategy

If a production deployment introduces a critical failure:

### Application Rollback (< 2 minutes)
1. Go to Vercel Dashboard → Project → Deployments.
2. Find the last healthy deployment.
3. Click "..." → **Promote to Production** (Instant Rollback).

### Database Rollback
1. If a migration caused the failure, revert it: `supabase migration down --project-ref <prod-ref>`
2. Verify the rollback with smoke tests.

---

## 7. Backup & Restore Verification

Supabase Pro includes automated Point-in-Time Recovery (PITR) backups.

### Monthly Restore Test (Manual):
1. Create a blank Supabase project for restore testing.
2. In Supabase dashboard, navigate to the Production project → Backups.
3. Select the most recent daily backup.
4. Restore to the blank test project.
5. Verify table counts and critical data integrity.
6. Destroy the test project after verification.

**This must be performed at minimum once per month to validate backup reliability.**
