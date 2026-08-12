# Data Validation Strategy

Before finalizing the migration, the following checks must be performed automatically via SQL assertions.

## 1. Record Counts
Verify that `SELECT COUNT(*)` on legacy tables exactly matches the target tables.
- `enquiries` -> `enquiries`
- `applications` -> `student_applications`

## 2. Foreign Key Integrity
Ensure no orphaned records exist.
```sql
-- Example validation query (should return 0)
SELECT id FROM student_applications WHERE student_id NOT IN (SELECT id FROM students);
```

## 3. Data Integrity
Verify that sensitive fields (like salaries previously in `team_members`) were correctly migrated to secure tables and are inaccessible to standard users.

## 4. UI Spot Checks
Run the Admin Dashboard against the migrated data in a staging environment to ensure KPIs (Total Leads, Active Students, Revenue) match the legacy production metrics perfectly.
