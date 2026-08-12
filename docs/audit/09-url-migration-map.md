# URL Migration Map

## Strategy
To preserve existing SEO equity, all current public URLs must be maintained. If architectural changes require a URL to change, a 301 (Permanent) redirect must be implemented in Next.js `next.config.ts`.

## Current Public URLs -> Target Handling

| Existing URL | Target URL | Action / Notes |
|---|---|---|
| `/` | `/` | Keep |
| `/destinations` | `/destinations` | Keep |
| `/destinations/[country]` | `/destinations/[country]` | Keep (Move to dynamic DB slug) |
| `/about` | `/about` | Keep |
| `/services` | `/services` | Keep |
| `/counseling` | `/counseling` | Keep |
| `/language-tests` | `/language-tests` | Keep |
| `/blog` | `/blog` | Keep |
| `/book-appointment` | `/book-appointment` | Keep |
| `/feedback` | `/feedback` | Keep |
| `/walk-in` | `/walk-in` | Keep |
| `/teams` | `/teams` | Keep |
| `/login` | `/login` (or `/admin/login`) | Keep / Redirect if consolidated |
| `/student` | `/student/login` | Redirect to standard login route |

## Implementation
Redirects will be managed in `nextConfig.redirects()`:
```javascript
async redirects() {
  return [
    {
      source: '/student',
      destination: '/student/login',
      permanent: true,
    },
    // Add any others as architecture evolves
  ];
}
```
