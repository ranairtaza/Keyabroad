import { describe, test, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import sitemap from '../../apps/web/src/app/sitemap';
import { destinations } from '../../apps/web/src/data/destinations';

describe('XML Sitemap & Technical SEO Validation Suite', () => {
  let generatedSitemap: Awaited<ReturnType<typeof sitemap>>;

  beforeAll(async () => {
    const rootDir = path.resolve(__dirname, '../../');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(path.join(rootDir, 'url.txt'))) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = fs.readFileSync(path.join(rootDir, 'url.txt'), 'utf-8').trim();
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && fs.existsSync(path.join(rootDir, 'key.txt'))) {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = fs.readFileSync(path.join(rootDir, 'key.txt'), 'utf-8').trim();
    }
    generatedSitemap = await sitemap();
  });

  test('sitemap generates a non-empty array of URL objects', () => {
    expect(Array.isArray(generatedSitemap)).toBe(true);
    expect(generatedSitemap.length).toBeGreaterThan(50);
  });

  test('all URLs in sitemap use canonical domain https://keyabroad.com and valid protocol', () => {
    for (const entry of generatedSitemap) {
      expect(entry.url).toMatch(/^https:\/\/keyabroad\.com(\/|$)/);
      expect(entry.url).not.toContain('www.keyabroad.com');
      expect(entry.url).not.toContain('localhost');
      expect(entry.url).not.toContain('undefined');
      expect(entry.url).not.toContain('null');
    }
  });

  test('sitemap URLs are completely unique with no duplicates', () => {
    const urls = generatedSitemap.map((e) => e.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  test('sitemap excludes changeFrequency and priority as per modern SEO requirements', () => {
    for (const entry of generatedSitemap) {
      expect((entry as any).changeFrequency).toBeUndefined();
      expect((entry as any).priority).toBeUndefined();
    }
  });

  test('lastModified is either undefined or a valid Date object', () => {
    for (const entry of generatedSitemap) {
      if (entry.lastModified !== undefined) {
        const date = new Date(entry.lastModified);
        expect(isNaN(date.getTime())).toBe(false);
        // Ensure it is not in the future beyond today + 1 day
        const now = Date.now() + 86400000;
        expect(date.getTime()).toBeLessThanOrEqual(now);
      }
    }
  });

  test('includes all essential public static catalog routes', () => {
    const urls = new Set(generatedSitemap.map((e) => e.url));
    const requiredRoutes = [
      'https://keyabroad.com',
      'https://keyabroad.com/universities',
      'https://keyabroad.com/destinations',
      'https://keyabroad.com/programs',
      'https://keyabroad.com/scholarships',
      'https://keyabroad.com/about',
      'https://keyabroad.com/services',
      'https://keyabroad.com/language-tests',
      'https://keyabroad.com/language-tests/ielts',
      'https://keyabroad.com/language-tests/pte',
      'https://keyabroad.com/language-tests/duolingo',
      'https://keyabroad.com/language-tests/other',
      'https://keyabroad.com/compare',
      'https://keyabroad.com/cost-calculator',
      'https://keyabroad.com/ai-advisor',
      'https://keyabroad.com/teams',
      'https://keyabroad.com/careers',
      'https://keyabroad.com/blog',
      'https://keyabroad.com/contact',
      'https://keyabroad.com/counseling',
      'https://keyabroad.com/eligibility',
      'https://keyabroad.com/feedback',
      'https://keyabroad.com/book-appointment',
      'https://keyabroad.com/walk-in',
    ];

    for (const route of requiredRoutes) {
      expect(urls.has(route)).toBe(true);
    }
  });

  test('includes all 17 destination country routes', () => {
    const urls = new Set(generatedSitemap.map((e) => e.url));
    expect(destinations.length).toBe(17);
    for (const country of destinations) {
      expect(urls.has(`https://keyabroad.com/destinations/${country.id}`)).toBe(true);
    }
  });

  test('excludes private, admin, login, and api routes', () => {
    const disallowedPrefixes = [
      'https://keyabroad.com/admin',
      'https://keyabroad.com/login',
      'https://keyabroad.com/student',
      'https://keyabroad.com/api',
    ];

    for (const entry of generatedSitemap) {
      for (const prefix of disallowedPrefixes) {
        expect(entry.url.startsWith(prefix)).toBe(false);
      }
    }
  });

  test('investigated duplicates: removes spurious duplicate slugs from sitemap', () => {
    const urls = new Set(generatedSitemap.map((e) => e.url));

    // Duplicate spurious records MUST be excluded
    expect(urls.has('https://keyabroad.com/universities/university-of-melbourne-1')).toBe(false);
    expect(urls.has('https://keyabroad.com/universities/university-of-toronto-1')).toBe(false);
    expect(urls.has('https://keyabroad.com/universities/university-of-toronto-2')).toBe(false);
    expect(urls.has('https://keyabroad.com/universities/university-of-toronto-uoft')).toBe(false);

    // Primary canonical targets MUST be present
    expect(urls.has('https://keyabroad.com/universities/university-of-melbourne')).toBe(true);
    expect(urls.has('https://keyabroad.com/universities/university-of-toronto')).toBe(true);
  });

  test('investigated distinct campuses: retains both De Montfort UK and Dubai in sitemap', () => {
    const urls = new Set(generatedSitemap.map((e) => e.url));
    expect(urls.has('https://keyabroad.com/universities/de-montfort-university')).toBe(true);
    expect(urls.has('https://keyabroad.com/universities/demontfort-university')).toBe(true);
  });
});
