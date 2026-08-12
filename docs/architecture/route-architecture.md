# Route Architecture

## Apps/Web (Public & Student)

### Public Routes (SEO & Lead Gen)
- `/` - Homepage
- `/destinations` - Destination catalog (Dynamic from DB)
- `/destinations/[country]` - Specific country details
- `/universities` - University catalog
- `/universities/[slug]` - Specific university and its programs
- `/programs` - Program search & filters
- `/scholarships` - Scholarship catalog
- `/about`, `/services`, `/contact` - Static pages
- `/blog`, `/blog/[slug]` - Content
- `/calculator` - Study cost calculator
- `/eligibility` - AI-powered eligibility engine

### Auth Routes
- `/login` - Unified login page (determines routing based on role)
- `/register` - Student registration

### Student Portal (Protected)
- `/student/dashboard` - Overview (Application status, pending tasks)
- `/student/applications` - Application tracking
- `/student/documents` - Secure document vault
- `/student/messages` - Chat with counselor
- `/student/shortlist` - Saved universities/programs
- `/student/profile` - Personal & academic details
- `/student/settings` - Account management

## Apps/Admin (Internal Operations)

### Auth Routes
- `/login` - Admin login

### Operational Routes (Protected by RBAC)
- `/dashboard` - Role-specific KPIs
- `/leads` - CRM lead pipeline (Counselors/Sales)
- `/students` - Active student management
- `/students/[id]` - 360-degree student view (details, docs, apps, messages)
- `/applications` - Application processing board
- `/visas` - Visa processing board
- `/tasks` - Follow-ups and office tasks
- `/finance/invoices` - Billing and receipts
- `/finance/payments` - Payment tracking

### Master Data Management (Admin/Content Roles)
- `/master/universities` - Manage university data
- `/master/programs` - Manage program data
- `/master/countries` - Manage destination data
- `/master/scholarships` - Manage scholarship data

### System Management (Super Admin)
- `/system/team` - Staff directory and RBAC assignments
- `/system/roles` - Permission configuration
- `/system/integrations` - API keys and third-party setups
- `/system/audit-logs` - Security and change tracking
- `/system/settings` - Global configuration
