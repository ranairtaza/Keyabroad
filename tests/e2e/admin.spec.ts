import { test, expect } from '@playwright/test';

/**
 * Admin & Counselor Journey Tests
 *
 * Requires environment variables:
 * - ADMIN_EMAIL / ADMIN_PASSWORD
 * - COUNSELOR_EMAIL / COUNSELOR_PASSWORD
 * - ADMIN_URL: base URL of the admin portal
 */

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const COUNSELOR_EMAIL = process.env.COUNSELOR_EMAIL || '';
const COUNSELOR_PASSWORD = process.env.COUNSELOR_PASSWORD || '';

const hasAdmin = ADMIN_EMAIL && ADMIN_PASSWORD;
const hasCounselor = COUNSELOR_EMAIL && COUNSELOR_PASSWORD;

// ─── Admin Journey ────────────────────────────────────────────────────────────

test.describe('Admin Journey', () => {
  test.skip(!hasAdmin, 'Skipped: Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to enable');

  test('admin health endpoint returns UP', async ({ request }) => {
    const res = await request.get(`${ADMIN_URL}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('UP');
  });

  test('admin login redirects to dashboard', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/login/);
  });

  test('admin can access CRM leads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*login).*/);

    await page.goto(`${ADMIN_URL}/leads`);
    await expect(page).not.toHaveURL(/login/);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('admin can access pipeline', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*login).*/);

    await page.goto(`${ADMIN_URL}/pipeline`);
    await expect(page).not.toHaveURL(/login/);
  });

  test('admin can access analytics', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*login).*/);

    await page.goto(`${ADMIN_URL}/analytics`);
    await expect(page).not.toHaveURL(/login/);
  });

  test('no server secrets in admin HTML', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*login).*/);

    const html = await page.content();
    expect(html).not.toContain('service_role');
    expect(html).not.toContain('WEBHOOK_SECRET');
    expect(html).not.toContain('OPENAI_API_KEY');
  });
});

// ─── Counselor Journey ────────────────────────────────────────────────────────

test.describe('Counselor Journey', () => {
  test.skip(!hasCounselor, 'Skipped: Set COUNSELOR_EMAIL and COUNSELOR_PASSWORD env vars to enable');

  test('counselor can log in to admin portal', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', COUNSELOR_EMAIL);
    await page.fill('input[type="password"]', COUNSELOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/login/);
  });

  test('counselor can access leads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', COUNSELOR_EMAIL);
    await page.fill('input[type="password"]', COUNSELOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*login).*/);

    await page.goto(`${ADMIN_URL}/leads`);
    await expect(page).not.toHaveURL(/login|forbidden|403/i);
  });

  test('counselor can access tasks', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', COUNSELOR_EMAIL);
    await page.fill('input[type="password"]', COUNSELOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*login).*/);

    await page.goto(`${ADMIN_URL}/tasks`);
    await expect(page).not.toHaveURL(/login|forbidden|403/i);
  });
});
