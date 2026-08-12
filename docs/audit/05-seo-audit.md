# SEO Audit

## Current State
- **Metadata**: Basic title and description present in the root layout (`layout.tsx`), but missing page-specific metadata for dynamic routes like `/destinations/[country]`.
- **Sitemap**: No `sitemap.xml` exists.
- **Robots**: No `robots.txt` exists.
- **Canonical URLs**: Not implemented.
- **Structured Data (Schema.org)**: None found.
- **Image Optimization**: Uses Next.js `<Image>` component, which is good, but `alt` text is sometimes generic or missing.

## Migration & Preservation
- The old URLs must be strictly preserved or 301 redirected to avoid losing existing SEO equity.
- A comprehensive URL migration map (`09-url-migration-map.md`) is required.

## Recommendations
1. Implement dynamic `generateMetadata` for all destination and blog pages.
2. Auto-generate `sitemap.xml` and `robots.txt` using Next.js conventions.
3. Inject `EducationalOrganization` and `Article` JSON-LD structured data.
4. Ensure highly semantic HTML (proper `h1`, `h2` hierarchy).
