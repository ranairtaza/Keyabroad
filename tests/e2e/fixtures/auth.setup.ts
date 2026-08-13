import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Auth Fixtures — Playwright storageState
 *
 * Runs once before all tests via the `setup` project.
 * Saves authenticated browser states for each role so individual
 * spec files can reuse them without re-logging in.
 *
 * Requires env vars:
 *   WEB_URL, ADMIN_URL
 *   STUDENT_EMAIL, STUDENT_PASSWORD
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *   COUNSELOR_EMAIL, COUNSELOR_PASSWORD
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

export const STORAGE_STATE_DIR = path.join(__dirname, '.auth');

export const AUTH_PATHS = {
  student: path.join(STORAGE_STATE_DIR, 'student.json'),
  admin: path.join(STORAGE_STATE_DIR, 'admin.json'),
  counselor: path.join(STORAGE_STATE_DIR, 'counselor.json'),
};

function ensureAuthDir() {
  if (!fs.existsSync(STORAGE_STATE_DIR)) {
    fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });
  }
}

// ─── Student Auth Setup ───────────────────────────────────────────────────────

setup('authenticate as student', async ({ page }) => {
  ensureAuthDir();

  const email = process.env.STUDENT_EMAIL;
  const password = process.env.STUDENT_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  STUDENT_EMAIL / STUDENT_PASSWORD not set — skipping student auth setup');
    // Write empty state so dependent tests skip gracefully
    fs.writeFileSync(AUTH_PATHS.student, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto(`${WEB_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.includes('/login'), { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_PATHS.student });
});

// ─── Admin Auth Setup ─────────────────────────────────────────────────────────

setup('authenticate as admin', async ({ page }) => {
  ensureAuthDir();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin auth setup');
    fs.writeFileSync(AUTH_PATHS.admin, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.includes('/login'), { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_PATHS.admin });
});

// ─── Counselor Auth Setup ─────────────────────────────────────────────────────

setup('authenticate as counselor', async ({ page }) => {
  ensureAuthDir();

  const email = process.env.COUNSELOR_EMAIL;
  const password = process.env.COUNSELOR_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  COUNSELOR_EMAIL / COUNSELOR_PASSWORD not set — skipping counselor auth setup');
    fs.writeFileSync(AUTH_PATHS.counselor, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.includes('/login'), { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_PATHS.counselor });
});
