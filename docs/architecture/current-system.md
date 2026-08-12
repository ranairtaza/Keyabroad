# Architecture: Current System

## System Boundary
KeyAbroad operates as a digital consultancy platform consisting of two main Next.js web applications interfacing with a centralized Supabase backend.

## Components

### 1. Public App (`keyabroad-app`)
- **Hosting**: Vercel (`www.keyabroad.com`)
- **Framework**: Next.js 16 (App Router)
- **Role**: Lead generation, marketing, brand presence.
- **Key Features**: Multi-step enquiry wizard, destination catalog, AI chatbot, blog reader.

### 2. Admin App (`keyabroad-admin`)
- **Hosting**: Vercel (`admin.keyabroad.com`)
- **Framework**: Next.js 16 (App Router)
- **Role**: Internal CRM, operational management, HR, finance.
- **Key Features**: Kanban pipeline, lead management, real-time notifications, invoice generation, attendance tracking.

### 3. Backend (Supabase)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (Email/Password)
- **Storage**: Used for student documents and avatars.
- **Realtime**: Used for presence tracking and instant task notifications.

## Data Flow
1. **Lead Generation**: A user submits an enquiry on the Public App. The data is inserted into the `enquiries` table in Supabase.
2. **Notification**: Supabase Realtime pushes an event to the Admin App.
3. **Processing**: An Admin or Counselor logs into the Admin App, views the lead, assigns it, and moves it through the pipeline (`students`, `visas`, `invoices` tables).
4. **AI Chat**: User interacts with the chatbot on the Public App; an API route securely calls OpenAI using a key stored in the `integrations` table.

## Architectural Debt
- **Missing Shared Package**: The two Next.js apps currently duplicate types, configurations, and utilities.
- **Weak Database Security**: Heavy reliance on client-side role checks with overly permissive database RLS.
- **Hardcoded State**: Critical business data (e.g., countries, universities) is hardcoded in the frontend repository rather than residing in the database.
