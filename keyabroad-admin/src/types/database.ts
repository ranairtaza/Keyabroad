// ============================================================================
// KeyAbroad — Database Types
// ============================================================================
// Auto-maintainable type definitions matching the Supabase schema.
// These types are the source of truth for TypeScript across both apps.
// ============================================================================

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export const STAFF_ROLES = [
  'super_admin',
  'admin',
  'branch_manager',
  'counselor',
  'admission_officer',
  'visa_officer',
  'content_manager',
  'marketing_staff',
  'finance_staff',
  'intern',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STUDENT_APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'conditional_offer',
  'unconditional_offer',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type StudentApplicationStatus = (typeof STUDENT_APPLICATION_STATUSES)[number];

export const VISA_STATUSES = [
  'doc-prep',
  'applied',
  'interview',
  'approved',
  'rejected',
] as const;

export type VisaStatus = (typeof VISA_STATUSES)[number];

export const DOCUMENT_CATEGORIES = [
  'passport',
  'academic',
  'financial',
  'visa',
  'language_test',
  'experience',
  'other',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_STATUSES = [
  'pending',
  'verified',
  'rejected',
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const PIPELINE_TYPES = ['Admissions', 'Language'] as const;
export type PipelineType = (typeof PIPELINE_TYPES)[number];

export const ADMISSIONS_STAGES = [
  'New',
  'In Progress',
  'Offer Received',
  'Visa Applied',
  'Visa Approved',
  'Completed',
  'On Hold',
  'Closed',
] as const;

export type AdmissionsStage = (typeof ADMISSIONS_STAGES)[number];

export const LANGUAGE_STAGES = [
  'Enrolled',
  'In Progress',
  'Test Scheduled',
  'Test Completed',
  'Completed',
] as const;

export type LanguageStage = (typeof LANGUAGE_STAGES)[number];

export const ENQUIRY_STATUSES = ['pending', 'done'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const CONVERSATION_STATUSES = ['open', 'closed', 'archived'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  designation: string | null;
  role: string | null; // legacy TEXT role
  staff_role: StaffRole | null;
  branch: string | null;
  is_active: boolean;
  phone: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface TeamMember {
  id: number;
  created_at: string;
  name: string;
  role: string;
  email: string | null;
  location: string | null;
  joined: string | null;
  salary: string | null;
  image: string | null;
  status: 'active' | 'resigned';
  worked_from: string | null;
  worked_to: string | null;
  description: string | null;
}

export interface Student {
  id: string;
  ticket_number: string;
  name: string;
  father_name: string | null;
  phone: string | null;
  email: string | null;
  target_destination: string | null;
  language_test: string | null;
  test_date_time: string | null;
  file_urls: string[];
  user_id: string | null;
  assigned_counselor_id: string | null;
  status: string;
  pipeline_type: PipelineType;
  admissions_stage: AdmissionsStage;
  language_stage: LanguageStage;
  university_applied: string | null;
  target_score: string | null;
  referred_by_subagent: string | null;
  subagent_name: string | null;
  created_at: string;
}

export interface EducationEntry {
  level: string;
  subject: string;
  marks: string;
  year: string;
  board: string;
}

export interface Enquiry {
  id: string;
  created_at: string;
  full_name: string;
  dob: string | null;
  mobile: string;
  email: string | null;
  city: string | null;
  passport_available: boolean;
  language_test: string | null;
  reading_score: string | null;
  listening_score: string | null;
  writing_score: string | null;
  speaking_score: string | null;
  education_history: EducationEntry[];
  has_work_experience: boolean;
  work_duration: string | null;
  job_title: string | null;
  company_name: string | null;
  destinations: string[];
  preferred_subjects: string[];
  total_budget_pkr: string | null;
  applied_for_visa: boolean;
  visa_country: string | null;
  visa_type: string | null;
  visa_status: string | null;
  visa_refusal_reason: string | null;
  documents: string[];
  eligibility: string | null;
  recommended_countries: string | null;
  recommended_universities: string | null;
  academic_profile: string | null;
  visa_chances: string | null;
  scholarship_chances: string | null;
  ticket_number: string | null;
  status: EnquiryStatus;
  assignee: string | null;
  completed_by: string | null;
  completed_at: string | null;
}

export interface Appointment {
  id: string;
  student_name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  counselor_assigned: string | null;
  status: string;
  created_at: string;
}

export interface FollowUp {
  id: string;
  student_name: string;
  phone: string | null;
  email: string | null;
  counselor_name: string | null;
  follow_up_date: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface OfficeTask {
  id: string;
  description: string;
  due_date: string | null;
  assignee: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  completed_by: string | null;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeLog {
  id: string;
  student_id: string;
  amount_paid: number;
  months_covered: number;
  payment_date: string;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student: string;
  date: string;
  amount: number;
  type: string;
  status: 'Paid' | 'Unpaid';
  course: string | null;
  payment_method: string | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  course_ending: string | null;
  deadline: string | null;
  received_by: string | null;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  tuition_fee: number | null;
  min_ielts: number | null;
  min_pte: number | null;
  subjects_offered: string[] | null;
  reqs: string | null;
  intake: string | null;
  deadline: string | null;
  commission: string | null;
  created_at: string;
}

export interface Visa {
  id: string;
  student: string;
  destination: string;
  course: string;
  date: string;
  status: VisaStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action_type: string;
  description: string;
  student_id: string | null;
  enquiry_id: string | null;
  employee_name: string;
  followup_reason: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Integration {
  id: string;
  provider: string;
  api_key: string | null;
  secret_key: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface StudentFeedback {
  id: string;
  student_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface StudentAccount {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  student_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  storage_path: string;
  category: DocumentCategory;
  status: DocumentStatus;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'staff';
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  student_id: string;
  counselor_id: string | null;
  subject: string | null;
  status: ConversationStatus;
  last_message_at: string;
  created_at: string;
}

export interface StudentApplication {
  id: string;
  student_id: string;
  university_id: string | null;
  university_name: string;
  program_name: string;
  country: string;
  intake: string | null;
  status: StudentApplicationStatus;
  submitted_at: string | null;
  decision_at: string | null;
  decision_notes: string | null;
  managed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAttendance {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  created_at: string;
}

export interface WebsiteVisit {
  id: string;
  page_url: string | null;
  referrer: string | null;
  device_type: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Destination Data Types (static, used by public website)
// ---------------------------------------------------------------------------

export interface DestinationUniversity {
  name: string;
  url: string;
}

export interface Destination {
  id: string;
  name: string;
  image: string;
  about: string;
  universities: DestinationUniversity[];
  courses: string[];
  whyChoose: string[];
  flagCode: string;
  wavingFlagImage?: string;
  wavingFlagPosition?: string;
  wavingFlagStyle?: string;
}
