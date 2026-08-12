# Target Architecture

## Application Structure

The target architecture will move from a monolithic repository setup to a **Monorepo** structure. The current structure consists of two separate Next.js apps (`keyabroad-app` and `keyabroad-admin`) that manually duplicate types and utilities. We will implement a standard monorepo using Turborepo (or NPM Workspaces) to share code effectively while keeping deployment separate.

### Proposed Directory Structure
```
/
├── apps/
│   ├── web/               # Public Website + Student Portal (Next.js)
│   └── admin/             # Counselor, Admin, Super Admin Portal (Next.js)
├── packages/
│   ├── ui/                # Shared shadcn/ui components
│   ├── database/          # Shared database types, clients, queries
│   ├── auth/              # Shared authentication utilities
│   ├── validation/        # Shared Zod schemas
│   └── ai/                # Shared LLM pipeline and prompts
└── supabase/
    ├── migrations/        # SQL Migrations
    ├── functions/         # Edge Functions
    └── seed/              # Seed data for local dev
```

*Reasoning*: While maintaining two existing repos is possible, a monorepo avoids the risk of types/schemas falling out of sync between the public app and the admin app. It drastically reduces duplication of the shadcn/ui components we just built. If migrating the existing codebase into a monorepo structure is too disruptive right now, we will maintain the existing `keyabroad-app` and `keyabroad-admin` structure but abstract shared logic into a local `packages/` directory referenced by both apps.

## Application Roles

1. **Public Website (`apps/web`)**: Focused on SEO, lead generation, destination discovery, and the AI advisor. Fast, statically generated where possible, and heavily cached.
2. **Student Portal (`apps/web/student`)**: Authenticated zone within the web app. Focused on application tracking, messaging, and document uploads.
3. **Admin Portal (`apps/admin`)**: Highly secure operational CRM. Focused on pipeline management, visas, billing, and HR. Gated by strict RBAC. (Serves Counselors, Admins, and Super Admins via UI gating).

## Data Flow
- **Supabase PostgreSQL**: The single source of truth. All data (including previously hardcoded destination data) lives here.
- **Supabase Auth**: Manages identities. Both apps use SSR (Server-Side Rendering) auth middleware.
- **Supabase Storage**: Manages all file uploads with explicit RLS policies (public for avatars/assets, private for student documents).
- **Supabase Realtime**: Powers the chat messaging system and instant pipeline notifications.
- **AI Services**: Centralized in the `packages/ai` module. Uses Supabase pgvector for Retrieval-Augmented Generation (RAG) to ensure the AI only recommends verified universities and programs.
