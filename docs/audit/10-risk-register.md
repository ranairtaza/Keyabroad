# Risk Register

| Risk | Impact | Probability | Mitigation Strategy |
|---|---|---|---|
| **Data Loss during Migration** | High | Low | Never use destructive SQL (DROP/DELETE). Use additive migrations only. Take regular Supabase backups. |
| **SEO Ranking Drop** | High | Medium | Strictly adhere to the URL migration map. Implement 301 redirects, `sitemap.xml`, and preserve existing meta tags. |
| **Security Breach (RLS)** | High | Low | Already addressed via Phase 0 migrations. Ensure all new tables have strict RLS policies defaulting to `DENY`. |
| **AI Hallucinations** | Medium | Medium | Transition chatbot from generic OpenAI prompt to a strict RAG pipeline using only verified Supabase data. |
| **Admin Panel Downtime** | High | Low | Maintain separate deployments for Admin and Public apps, or use robust error boundaries. |
| **UI Regression** | Medium | Low | Adopt shadcn/ui to ensure consistent, tested components instead of ad-hoc Tailwind classes. |
