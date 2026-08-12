# Information Architecture

## 1. Public Website (Unauthenticated)
The public site is structured around discovery and lead capture.
- **Discovery**: `/destinations`, `/universities`, `/programs`, `/scholarships`
- **Utility**: `/calculator`, `/eligibility`
- **Trust/Brand**: `/about`, `/team`, `/success-stories`, `/blog`
- **Conversion**: `/contact`, `/book-appointment`

## 2. Student Portal (Authenticated)
Designed for clarity and progression. The primary navigation is a left sidebar (desktop) or bottom tab bar (mobile).
- **Dashboard (`/student/dashboard`)**: The single pane of glass. Next steps, upcoming appointments, application status summary.
- **Profile (`/student/profile`)**: Academic records, English test scores, work experience.
- **Applications (`/student/applications`)**: Detailed tracking of submitted university applications.
- **Documents (`/student/documents`)**: Secure vault for passports, transcripts, SOPs.
- **Messages (`/student/messages`)**: Direct communication with the assigned counselor.

## 3. Admin & Counselor Portal (Authenticated + RBAC)
Designed for high-density data management and rapid workflow execution.
- **Pipeline (`/leads`, `/applications`, `/visas`)**: Kanban boards or dense data tables for tracking entities through their lifecycles.
- **CRM (`/students`)**: 360-degree view of a student (integrates their profile, documents, and messages in one unified view).
- **Master Data (`/master/*`)**: Management of the underlying university and destination catalog (Admin/Content roles only).
- **System (`/system/*`)**: RBAC, staff management, audit logs (Super Admin only).
