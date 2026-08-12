# Database Audit (Supabase)

## Schema Overview
The database currently consists of roughly 18 primary tables managing HR, CRM, Content, and Financials.

### Core Tables & Classification

| Table Name | Purpose | Classification | Reason |
|---|---|---|---|
| `profiles` | Staff user metadata | KEEP | Essential for Auth integration |
| `team_members` | Extended HR data (salary, etc) | MERGE | Should be merged into `profiles` to avoid duplicate user data and state sync issues |
| `students` | Core student CRM records | RESTRUCTURE | Needs `user_id` foreign key for self-service portal access |
| `enquiries` | Lead capture from website | KEEP | Good foundation, needs stricter schema validation |
| `registrations` | Event/Walk-in registrations | MERGE | Consolidate with `enquiries` using a `source` column |
| `appointments` | Booked counseling sessions | RESTRUCTURE | Needs proper foreign keys to `students` and `profiles` |
| `follow_ups` | CRM task reminders | KEEP | |
| `office_tasks` | Internal team tasks | KEEP | |
| `fee_logs` | Student payment history | KEEP | |
| `invoices` | Generated invoices | KEEP | |
| `blogs` | CMS for public website | KEEP | |
| `student_feedbacks` | Public reviews | KEEP | |
| `notifications` | In-app alerts | KEEP | |
| `universities` | Master data for institutions | RESTRUCTURE | Currently only has 5 dummy rows; needs massive expansion and proper relation to `programs` |
| `activity_logs` | System audit trail | KEEP | |
| `website_visits` | Custom analytics | DEPRECATE | Use PostHog or Google Analytics instead of reinventing web analytics in PostgreSQL |
| `applications` | Generic lead tracking | MERGE | Redundant with `enquiries` and `students` pipeline |
| `employee_attendance`| HR time tracking | KEEP | |

## Security & Architecture Issues
* **Critical RLS Vulnerabilities**: Prior to Phase 0 migrations, `team_members`, `follow_ups`, `appointments`, `notifications`, `activity_logs`, and `universities` had `FOR ALL USING (true)` policies.
* **Missing Foreign Keys**: Many tables use `TEXT` fields for relationships (e.g., `student_name` instead of `student_id UUID REFERENCES students(id)`), leading to data anomalies if a name changes.
* **Missing Enums**: Statuses (like "New", "In Progress", "doc-prep") are stored as raw text, risking typos.
* **Data Duplication**: The static frontend `destinations.ts` file duplicates concept of Universities that should live in the database.

*Note: Database Relationship Diagram will be generated in subsequent architectural phases after schema normalization.*
