# Target Database Schema

*Note: Existing tables will be migrated to this normalized structure.*

## Core Entities

### `profiles` (Replaces `team_members` and legacy `profiles`)
- **Purpose**: Unified staff profile and authentication mapping.
- **Columns**: `id` (UUID, PK, references `auth.users`), `email` (TEXT), `full_name` (TEXT), `staff_role` (ENUM), `branch_id` (UUID, FK), `is_active` (BOOLEAN, default true), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Soft Delete**: `is_active = false`.

### `students` (Extends legacy `students`)
- **Purpose**: Core CRM and student portal identity.
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK references `auth.users`, nullable for offline leads), `assigned_counselor_id` (UUID, FK), `status` (ENUM), `created_at`, `updated_at`.

### `academic_records` & `english_tests` & `work_experience`
- **Purpose**: Normalized 1-to-many relationships replacing JSON or hardcoded columns in the `enquiries` table.
- **Columns**: `id` (UUID, PK), `student_id` (UUID, FK), structured data fields, `created_at`.

## Master Data (New / Replaces hardcoded TS files)

### `countries` & `cities`
- **Purpose**: Destination hierarchy.
- **Columns**: `id` (UUID, PK), `name` (TEXT), `slug` (TEXT, UNIQUE), `description` (TEXT), `image_url` (TEXT).

### `universities` & `campuses`
- **Purpose**: Catalog of partner institutions.
- **Columns**: `id` (UUID, PK), `country_id` (UUID, FK), `name` (TEXT), `slug` (TEXT, UNIQUE), `logo_url` (TEXT), `commission_structure` (JSONB - admin only).

### `programs`
- **Purpose**: Specific study programs for course matching.
- **Columns**: `id` (UUID, PK), `university_id` (UUID, FK), `name` (TEXT), `degree_level` (ENUM), `tuition_fee` (NUMERIC), `duration` (TEXT).

### `scholarships`
- **Purpose**: Discoverable scholarships linked to universities or countries.

## CRM & Operations

### `enquiries` (Leads)
- **Purpose**: Raw incoming leads before conversion to active students.
- **Columns**: `id`, `full_name`, `email`, `phone`, `status`, `source`, `created_at`.

### `student_applications` (Replaces `applications` / `visas`)
- **Purpose**: Tracks application to a specific program.
- **Columns**: `id`, `student_id` (UUID, FK), `program_id` (UUID, FK), `status` (ENUM: draft, submitted, offer, rejected), `managed_by` (UUID, FK).

### `student_documents`
- **Purpose**: Secure document vault.
- **Columns**: `id`, `student_id` (FK), `category` (ENUM), `storage_path` (TEXT), `status` (ENUM: pending, verified, rejected).

### `student_conversations` & `student_messages`
- **Purpose**: In-app chat between student and counselor.

## System

### `audit_logs`
- **Purpose**: Immutable ledger of critical actions.
- **Columns**: `id`, `user_id`, `action`, `resource_type`, `resource_id`, `details` (JSONB).
