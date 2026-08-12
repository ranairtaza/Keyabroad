# Content Audit

## Current Content Assets
- **Destinations Data**: Hardcoded in `src/data/destinations.ts` (17 countries). Includes images, descriptions, top universities, courses, and benefits.
- **Blog Posts**: Managed via Supabase `blogs` table.
- **Copywriting**: Homepage and service pages contain static marketing copy.

## Content Weaknesses
- **Inflexibility**: Because destinations and universities are hardcoded, adding a new university requires a developer to deploy code.
- **Inconsistent Terminology**: Mixing of terms like "Counselor", "Agent", "Advisor".
- **AI Content Risks**: The OpenAI chatbot serves as a source of truth for queries, but lacks guardrails linking it strictly to verified KeyAbroad database content.

## Content Strategy for 2.0
- **Database-Driven**: Migrate all hardcoded destination and university data into Supabase tables (`universities`, `programs`, `countries`).
- **CMS Module**: Expand the admin panel to allow marketing staff to edit landing page copy, FAQs, and destination details without code changes.
- **Verified Grounding**: AI chatbot must be upgraded to a RAG (Retrieval-Augmented Generation) pipeline grounded *only* in verified database content.
