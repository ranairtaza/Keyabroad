import { test, expect } from '@playwright/test';

/**
 * Student Journey Tests
 *
 * Requires environment variables:
 * - STUDENT_EMAIL: test student email
 * - STUDENT_PASSWORD: test student password
 * - WEB_URL: base URL of the web portal
 *
 * Skip gracefully if credentials not provided.
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const STUDENT_EMAIL = process.env.STUDENT_EMAIL || '';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || '';

const hasCredentials = STUDENT_EMAIL && STUDENT_PASSWORD;

test.describe('Student Journey', () => {
  test.skip(!hasCredentials, 'Skipped: Set STUDENT_EMAIL and STUDENT_PASSWORD env vars to enable');

  test('student can log in successfully', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to student area after login
    await expect(page).not.toHaveURL(/login/);
  });

  test('student can view dashboard after login', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/student|dashboard/);

    await page.goto(`${WEB_URL}/student/dashboard`);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('student cannot access admin portal', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');

    const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
    await page.goto(ADMIN_URL);

    // Should be blocked — either redirect to login or 403
    const url = page.url();
    const bodyText = await page.textContent('body');
    const isBlocked = url.includes('login') || bodyText?.includes('403') || bodyText?.includes('Forbidden');
    expect(isBlocked).toBe(true);
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', 'completely_wrong_password_12345');
    await page.click('button[type="submit"]');

    // Should stay on login page with error
    await expect(page).toHaveURL(/login/);
  });

  test('eligibility checker page renders', async ({ page }) => {
    await page.goto(`${WEB_URL}/eligibility`);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('university search page renders', async ({ page }) => {
    await page.goto(`${WEB_URL}/universities`);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });
});
