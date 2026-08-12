# Data Mapping (Old -> New)

## Identity & Roles
| Legacy Table | Target Table | Migration Logic |
|---|---|---|
| `team_members` | `profiles` | Move `role`, `department`, `salary` into `profiles` or a secure 1:1 `hr_records` table. |
| `students` | `students` | Add `user_id` mapping when students register on the new portal. Maintain existing UUIDs. |

## Leads & Admissions
| Legacy Table | Target Table | Migration Logic |
|---|---|---|
| `enquiries` | `enquiries` | Direct mapping. Parse JSON/text fields into normalized `academic_records`. |
| `applications` | `student_applications` | Rename to clarify scope. Add `program_id` reference instead of text descriptions. |
| `appointments` | `appointments` | Direct mapping. Ensure FKs are strict UUIDs instead of text. |

## Content
| Legacy Source | Target Table | Migration Logic |
|---|---|---|
| `src/data/destinations.ts` | `countries`, `universities`, `programs` | Write a one-off Node.js seed script to parse the TypeScript array and INSERT into the database. |
| `blogs` | `blogs` | Direct mapping. |
