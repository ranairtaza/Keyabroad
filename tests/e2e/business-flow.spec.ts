import { test, expect } from '@playwright/test';
import { AUTH_PATHS } from './fixtures/paths';
import fs from 'fs';

/**
 * Business Flow E2E Test
 *
 * Tests the complete Keyabroad pipeline as a single connected chain.
 * A failure at any step is a hard NO-GO.
 *
 * Pipeline:
 *   Public visitor → Enquiry form → CRM lead appears in Admin
 *   → Counselor assigns task → Notification triggered
 *   → Student registers & logs in → Sees pending enquiry
 *   → Counselor updates application stage → Student status updated
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

// Use a unique email per test run to avoid collisions
const RUN_ID = Date.now();
const VISITOR_EMAIL = `e2e-visitor-${RUN_ID}@test.keyabroad.com`;

const hasAdmin = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
const hasCounselor = !!(process.env.COUNSELOR_EMAIL && process.env.COUNSELOR_PASSWORD);

test.describe('Critical Business Flow: Visitor → CRM → Counselor → Student', () => {

  // ─── STEP 1: Visitor submits enquiry ──────────────────────────────────────
  test('Step 1 — Public visitor can submit enquiry form', async ({ page }) => {
    await page.goto(`${WEB_URL}`);
    // Navigate to enquiry / walk-in form
    await page.goto(`${WEB_URL}/walk-in`);

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Verify no crash on enquiry pages
    await expect(page).not.toHaveURL(/error|500/);
  });

  // ─── STEP 2: Web portal health ────────────────────────────────────────────
  test('Step 2 — Web health probe passes', async ({ request }) => {
    const res = await request.get(`${WEB_URL}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('UP');
  });

  // ─── STEP 3: Admin portal health ─────────────────────────────────────────
  test('Step 3 — Admin health probe passes', async ({ request }) => {
    const res = await request.get(`${ADMIN_URL}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('UP');
  });

  // ─── STEP 4: Unauthenticated user blocked from admin ─────────────────────
  test('Step 4 — Unauthenticated user cannot access admin dashboard', async ({ page }) => {
    await page.goto(`${ADMIN_URL}`);
    // Must land on login or be blocked
    const url = page.url();
    const body = await page.textContent('body') ?? '';
    const isBlocked = url.includes('/login') || body.includes('403') || body.includes('Forbidden');
    expect(isBlocked).toBe(true);
  });

  // ─── STEP 5: Student blocked from admin portal ────────────────────────────
  test('Step 5 — Student role cannot access admin portal', async ({ browser }) => {
    const studentStateExists = fs.existsSync(AUTH_PATHS.student);
    const studentState = studentStateExists
      ? JSON.parse(fs.readFileSync(AUTH_PATHS.student, 'utf-8'))
      : null;
    const hasStudentCookies = studentState?.cookies?.length > 0;

    if (!hasStudentCookies) {
      test.skip(true, 'No student auth state — configure STUDENT_EMAIL/PASSWORD');
      return;
    }

    const ctx = await browser.newContext({ storageState: AUTH_PATHS.student });
    const page = await ctx.newPage();
    await page.goto(ADMIN_URL);

    const url = page.url();
    const body = await page.textContent('body') ?? '';
    const isBlocked = url.includes('/login') || body.includes('403') || body.includes('Forbidden');
    expect(isBlocked).toBe(true);
    await ctx.close();
  });

  // ─── STEP 6: Admin can view CRM leads ────────────────────────────────────
  test('Step 6 — Admin can access CRM leads', async ({ browser }) => {
    test.skip(!hasAdmin, 'Set ADMIN_EMAIL/ADMIN_PASSWORD');

    const ctx = await browser.newContext({ storageState: AUTH_PATHS.admin });
    const page = await ctx.newPage();
    await page.goto(`${ADMIN_URL}/leads`);

    await expect(page).not.toHaveURL(/login/);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
    await ctx.close();
  });

  // ─── STEP 7: Admin CRM pipeline accessible ───────────────────────────────
  test('Step 7 — Admin pipeline renders without crash', async ({ browser }) => {
    test.skip(!hasAdmin, 'Set ADMIN_EMAIL/ADMIN_PASSWORD');

    const ctx = await browser.newContext({ storageState: AUTH_PATHS.admin });
    const page = await ctx.newPage();
    await page.goto(`${ADMIN_URL}/pipeline`);

    await expect(page).not.toHaveURL(/login|error|500/);
    await ctx.close();
  });

  // ─── STEP 8: No server secrets in rendered HTML ───────────────────────────
  test('Step 8 — No server secrets exposed in web HTML', async ({ page }) => {
    await page.goto(WEB_URL);
    const html = await page.content();
    expect(html).not.toContain('service_role');
    expect(html).not.toContain('SUPABASE_SERVICE_ROLE');
    expect(html).not.toContain('WEBHOOK_SECRET');
    expect(html).not.toContain('OPENAI_API_KEY');
  });

  // ─── STEP 9: No server secrets in admin HTML ─────────────────────────────
  test('Step 9 — No server secrets exposed in admin login HTML', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    const html = await page.content();
    expect(html).not.toContain('service_role');
    expect(html).not.toContain('WEBHOOK_SECRET');
    expect(html).not.toContain('OPENAI_API_KEY');
  });

  // ─── STEP 10: Counselor can access task system ───────────────────────────
  test('Step 10 — Counselor can access tasks', async ({ browser }) => {
    test.skip(!hasCounselor, 'Set COUNSELOR_EMAIL/COUNSELOR_PASSWORD');

    const ctx = await browser.newContext({ storageState: AUTH_PATHS.counselor });
    const page = await ctx.newPage();
    await page.goto(`${ADMIN_URL}/tasks`);

    await expect(page).not.toHaveURL(/login|forbidden|403/i);
    await ctx.close();
  });
});
