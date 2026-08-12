# Rollback Plan

The migration strategy strictly follows an **additive, side-by-side** approach. We do NOT destroy the old data until KeyAbroad 2.0 has been stable in production for 30 days.

## Strategy: View-Based Facade (If necessary)
If migrating existing tables in-place causes breaking changes to the legacy admin panel, we will create the new tables (e.g., `student_applications`) alongside the old ones (`applications`), or use PostgreSQL Views to mimic the old schema structure for the old codebase.

## Execution Steps for Rollback
If a critical failure occurs during deployment of KeyAbroad 2.0:
1. Revert DNS settings on Vercel to point back to the legacy `keyabroad-app` and `keyabroad-admin` commits.
2. Since the old database tables/columns (e.g., `team_members`) were NOT dropped, the legacy application will continue functioning exactly as before.
3. Any data written exclusively to the *new* tables during the failed window will need to be manually backported to the legacy tables.

**Rule**: `DROP TABLE` or `DROP COLUMN` commands are strictly forbidden during the initial Phase 2 migration.
