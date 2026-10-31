import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 1 404 Remediation & Redirects Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const nextConfigPath = path.join(rootDir, 'apps/web/next.config.ts');
  const pagePath = path.join(rootDir, 'apps/web/src/app/page.tsx');

  test('next.config.ts exists and contains all required Phase 1 redirects', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const content = fs.readFileSync(nextConfigPath, 'utf8');

    const expectedRedirects = [
      { source: '/student', destination: '/student/login' },
      { source: '/team', destination: '/teams' },
      { source: '/home', destination: '/' },
      { source: '/home-page', destination: '/' },
      { source: '/contactus', destination: '/contact' },
      { source: '/blogs', destination: '/blog' },
      { source: '/team-1', destination: '/teams' },
      { source: '/icef-agency-status', destination: '/about' },
      { source: '/dubai', destination: '/destinations/dubai' },
      { source: '/new-zealand', destination: '/destinations/new-zealand' },
      { source: '/malta', destination: '/destinations/malta' },
      { source: '/united-kingdom', destination: '/destinations/united-kingdom' },
      { source: '/cyprus', destination: '/destinations/cyprus' },
      { source: '/united-states', destination: '/destinations/united-states' },
      { source: '/ireland', destination: '/destinations/ireland' },
      { source: '/australia', destination: '/destinations/australia' },
      { source: '/australia-1', destination: '/destinations/australia' },
      { source: '/canada', destination: '/destinations/canada' },
      { source: '/ielts', destination: '/language-tests/ielts' },
      { source: '/pte-1', destination: '/language-tests/pte' },
      { source: '/pte', destination: '/language-tests/pte' },
    ];

    for (const r of expectedRedirects) {
      expect(content).toContain(`source: '${r.source}'`);
      expect(content).toContain(`destination: '${r.destination}'`);
    }

    // Verify all redirects specify permanent: true
    expect(content).toContain('permanent: true');
  });

  test('all redirect sources are distinct and do not point to themselves', () => {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    const redirectsBlockMatch = content.match(/async\s+redirects\(\)\s*\{([\s\S]*?)\}\s*,\s*async\s+headers/);
    expect(redirectsBlockMatch).not.toBeNull();
    const redirectsBlock = redirectsBlockMatch![1];

    const sourceMatches = [...redirectsBlock.matchAll(/source:\s*'([^']+)'/g)].map(m => m[1]);
    const destMatches = [...redirectsBlock.matchAll(/destination:\s*'([^']+)'/g)].map(m => m[1]);

    expect(sourceMatches.length).toBe(destMatches.length);
    expect(sourceMatches.length).toBe(21);

    // No duplicate sources
    const uniqueSources = new Set(sourceMatches);
    expect(uniqueSources.size).toBe(sourceMatches.length);

    // No self-redirect loops
    for (let i = 0; i < sourceMatches.length; i++) {
      expect(sourceMatches[i]).not.toBe(destMatches[i]);
    }
  });

  test('homepage has no broken /ielts link and points to /language-tests/ielts', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
    const content = fs.readFileSync(pagePath, 'utf8');

    // Ensure broken link is completely removed
    expect(content).not.toContain('href="/ielts"');

    // Ensure corrected link is present
    expect(content).toContain('href="/language-tests/ielts"');
  });
});
