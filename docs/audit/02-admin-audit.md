# Admin Application Audit (keyabroad-admin)

## Overview
- **URL**: https://admin.keyabroad.com
- **Purpose**: Internal CRM, pipeline management, HR, finance, and content management.
- **Framework**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts.

## Core Modules & Analysis

### 1. Dashboard (`/`)
* **Purpose**: High-level overview of business KPIs.
* **Current UI**: KPI cards, line charts (Recharts), live activity feed, pending follow-ups.
* **Current Problems**: Unoptimized data fetching; RLS vulnerabilities mean any authenticated user could potentially view data meant for managers.
* **Action**: MODIFY (Add strict RBAC filtering and Shadcn/ui charts).

### 2. CRM & Leads (`/leads`, `/database`, `/master-records`)
* **Purpose**: Manage student inquiries, leads, and master database.
* **Current UI**: Complex tables and forms (e.g., 37KB `page.tsx` for leads).
* **Current Problems**: Monolithic files; lack of strict type safety (`any` types used); missing form validation (Zod).
* **Action**: REBUILD (Split into smaller components, implement React Hook Form + Zod, use Shadcn DataTable).

### 3. Pipeline Board (`/pipeline`, `/visas`)
* **Purpose**: Kanban-style tracking of admissions and visas.
* **Current UI**: Drag-and-drop columns (doc-prep, applied, interview, approved).
* **Current Problems**: UI state management can be fragile; potential race conditions with Supabase updates.
* **Action**: MODIFY (Enhance optimistic UI updates and error boundaries).

### 4. HR & Team Management (`/team`, `/hr-operations`, `/attendance`)
* **Purpose**: Employee directory, attendance tracking, and HR operations.
* **Current Problems**: Critical Security Flaw - `team_members` table has public RLS, exposing salary and personal data to anyone.
* **Action**: REBUILD (Enforce strict Row Level Security, integrate properly with Supabase Auth metadata).

### 5. Finance (`/fees`, `/invoices`, `/receipt`)
* **Purpose**: Track payments and generate PDF receipts (jsPDF).
* **Current Problems**: Lacks integration with standard accounting workflows; manual entry prone to errors.
* **Action**: MODIFY (Improve validation, secure access to finance roles only).

### 6. Settings & Integrations (`/settings`, `/integrations`, `/automations`)
* **Purpose**: Manage system-wide config (e.g., OpenAI API keys).
* **Current Problems**: API keys stored in plaintext in the database (even if access is restricted).
* **Action**: MODIFY (Move sensitive keys to environment variables or Supabase Vault).

## General Architecture Issues
* **Authentication**: Uses a central `RoleContext.tsx` which manages state and realtime presence. Contains warnings about multiple tabs causing Supabase hangs.
* **Authorization**: Gating is done on the client side based on `currentUser.role`, but backend RLS policies were found to be overly permissive (`FOR ALL USING (true)`).
* **UI Consistency**: Lacks a cohesive design system (currently using raw Tailwind classes).
