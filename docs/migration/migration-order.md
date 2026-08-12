# Migration Order

Data migration must follow strict foreign-key dependency order.

## Phase 1: Reference Data
1. Seed `countries` and `cities`.
2. Seed `universities` and `campuses`.
3. Seed `programs`.

## Phase 2: Identities
1. Migrate `team_members` to `profiles`.
2. Verify `staff_role` enums.

## Phase 3: Core Business Data
1. Migrate `students` (depends on `profiles` for assigned counselor).
2. Migrate `enquiries`.
3. Normalize student academic data into `academic_records`.

## Phase 4: Relational Data
1. Migrate `applications` to `student_applications` (depends on `students` and `programs`).
2. Migrate `appointments`.
3. Migrate `follow_ups` and `office_tasks`.

## Phase 5: Storage
1. Migrate document metadata into `student_documents`.
2. Ensure physical files in Supabase Storage remain untouched; update path references if necessary.
