# Admin Journey (Branch Manager / Super Admin)

## 1. Operational Oversight
The Admin needs to see the macro-level health of the business.
**UX Focus**: High-level charts (Recharts integration) and aggregated data.
**Key Questions**: How many leads this week? What is the conversion rate? Are counselors hitting SLAs on document verification?

## 2. Exception Management
Admins step in when things break or escalate.
**UI Pattern**: Advanced data tables with powerful filtering, sorting, and bulk actions.
Example: Finding all applications stuck in "Draft" for more than 14 days and assigning them to a specific senior counselor.

## 3. Master Data Management
Admins and Content Managers maintain the platform's core data.
**UX Focus**: Data integrity.
Adding a new University or Program requires complex forms.
**Components**: Multi-step modals or full-page forms using React Hook Form + Zod to ensure no invalid data corrupts the database.

## 4. Staff Management & Security
Super Admins manage the team.
**UI Pattern**: Role assignment matrices and audit logs.
**UX Focus**: High friction for destructive actions (e.g., requiring typing "CONFIRM" to delete a user or change a role).
