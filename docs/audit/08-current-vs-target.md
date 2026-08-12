# Current System vs Target System

## What We Have (Current State)
- **Monolithic Frontend/Backend Separation**: Two distinct Next.js codebases (`keyabroad-app` and `keyabroad-admin`) sharing a single database.
- **Incomplete Portal**: A student portal login page exists but uses mock functionality.
- **UI Framework**: Raw Tailwind CSS without a standardized component library like shadcn/ui.
- **Security**: Weak Row Level Security (RLS) leading to public exposure of sensitive data (addressed via Phase 0 migrations).
- **Data Management**: Mix of hardcoded data (destinations) and database-driven data (blogs, leads).
- **Tooling**: Next.js App Router, Supabase, basic Tailwind.

## Target State (KeyAbroad 2.0)
- **Unified Architecture**: Potentially consolidate into a single Next.js app with distinct routing zones (`/admin`, `/student`, `/`), or maintain the split but with a robust shared `@keyabroad/shared` package.
- **Premium UX/UI**: Fully integrated shadcn/ui and Radix UI components, consistent design tokens, micro-animations (Framer Motion).
- **Data Integrity**: 100% database-driven content. Strict Zod validation on all forms.
- **Security**: Granular Role-Based Access Control (RBAC) with 10 distinct staff roles and isolated student accounts.
- **AI Integration**: Grounded RAG (Retrieval-Augmented Generation) chatbot that relies purely on verified database content.
- **SEO & Performance**: Server-side rendered content, dynamic metadata, structured data, optimized images.
