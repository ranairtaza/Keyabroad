import { test, expect } from '@playwright/test';

/**
 * Public Visitor Journey Tests
 *
 * Tests the web portal from an unauthenticated visitor perspective.
 * Covers: homepage, blog, enquiry form, protected route redirects.
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Public Visitor', () => {
  test('homepage loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(WEB_URL);
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
    await expect(page).toHaveTitle(/.+/);
  });

  test('homepage renders key content', async ({ page }) => {
    await page.goto(WEB_URL);
    // Check that the page has meaningful content (not a blank error)
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('blog page renders', async ({ page }) => {
    await page.goto(`${WEB_URL}/blog`);
    await expect(page).not.toHaveURL(/error|500/);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('universities page renders', async ({ page }) => {
    await page.goto(`${WEB_URL}/universities`);
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('programs page renders', async ({ page }) => {
    await page.goto(`${WEB_URL}/programs`);
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('/student/dashboard redirects unauthenticated visitor to /login', async ({ page }) => {
    await page.goto(`${WEB_URL}/student/dashboard`);
    await expect(page).toHaveURL(/login/);
  });

  test('/book-appointment redirects unauthenticated visitor to /login', async ({ page }) => {
    await page.goto(`${WEB_URL}/book-appointment`);
    await expect(page).toHaveURL(/login/);
  });

  test('health endpoint returns UP', async ({ request }) => {
    const res = await request.get(`${WEB_URL}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('UP');
  });

  test('no server secrets in rendered HTML', async ({ page }) => {
    await page.goto(WEB_URL);
    const html = await page.content();
    // Service role key must never appear in client HTML
    expect(html).not.toContain('service_role');
    expect(html).not.toContain('SUPABASE_SERVICE_ROLE');
    expect(html).not.toContain('WEBHOOK_SECRET');
  });
});
