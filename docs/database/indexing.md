# Database Indexing Strategy

To ensure sub-second response times on dashboard and public website queries, the following indexing strategies will be implemented.

## Primary & Foreign Keys
PostgreSQL automatically indexes Primary Keys. We must explicitly index Foreign Keys used in `JOIN`s and `WHERE` clauses.
- `idx_students_user_id` on `students(user_id)`
- `idx_students_counselor` on `students(assigned_counselor_id)`
- `idx_applications_student` on `student_applications(student_id)`
- `idx_applications_program` on `student_applications(program_id)`

## Search Optimization
For the public website destination and university search:
- **Trigram Indexes (pg_trgm)**: Enable partial text matching on `universities.name` and `programs.name`.
  ```sql
  CREATE INDEX idx_universities_name_trgm ON universities USING GIN (name gin_trgm_ops);
  ```
- **Semantic Search (pgvector)**: Store embeddings of program descriptions to allow natural language search ("affordable IT degrees in London").
  ```sql
  CREATE INDEX idx_programs_embedding ON programs USING hnsw (embedding vector_cosine_ops);
  ```

## Status & Filtering
For Admin dashboards filtering by status:
- B-Tree indexes on `status` columns (`enquiries.status`, `student_applications.status`).
- Composite indexes for common query patterns (e.g., `(assigned_counselor_id, status)`).
