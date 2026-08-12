# Performance Audit

## Key Metrics & Observations
- **Framework**: Next.js App Router provides a good baseline for performance (React Server Components).
- **Images**: Next.js Image component is utilized, but some large hero assets could be further optimized or served with priority.
- **Client-Side JavaScript**: The admin panel has monolithic components (e.g., `leads/page.tsx` is 37KB) which could impact Time to Interactive (TTI).
- **Data Fetching**: Heavy reliance on client-side Supabase fetching (`useEffect` + `createBrowserClient`) causes waterfall loading and "layout shift" as data arrives.
- **Caching**: Minimal use of Next.js caching/revalidation features.

## Recommendations
1. **Move to Server Components**: Fetch data on the server in the App Router to reduce client-side JavaScript and eliminate loading spinners for initial data.
2. **Component Splitting**: Break down large admin pages into smaller, lazy-loaded components.
3. **Optimistic UI**: Use React's `useOptimistic` or standard optimistic state updates for immediate feedback (especially in Kanban boards).
4. **Bundle Analysis**: Run `@next/bundle-analyzer` to identify heavy dependencies.
