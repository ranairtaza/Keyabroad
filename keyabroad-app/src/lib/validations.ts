// ============================================================================
// KeyAbroad — Zod Validation Schemas
// ============================================================================
// All form validation schemas. Used with React Hook Form via @hookform/resolvers.
// ============================================================================

import { z } from 'zod';
import {
  STAFF_ROLES,
  STUDENT_APPLICATION_STATUSES,
  VISA_STATUSES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  ENQUIRY_STATUSES,
  ADMISSIONS_STAGES,
  LANGUAGE_STAGES,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Shared Validators
// ---------------------------------------------------------------------------

const phoneSchema = z
  .string()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format');

const emailSchema = z.string().email('Invalid email address');

const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`).trim();

// ---------------------------------------------------------------------------
// Enquiry Form (Public website multi-step wizard)
// ---------------------------------------------------------------------------

const educationEntrySchema = z.object({
  level: z.string(),
  subject: z.string().optional().default(''),
  marks: z.string().optional().default(''),
  year: z.string().optional().default(''),
  board: z.string().optional().default(''),
});

export const enquiryFormSchema = z.object({
  // Step 1: Personal Info
  full_name: requiredString('Full name'),
  dob: z.string().optional().default(''),
  mobile: phoneSchema,
  email: emailSchema.or(z.literal('')).optional(),
  city: z.string().optional().default(''),
  passport_available: z.boolean().default(false),

  // Step 2: Language
  language_test: z.string().optional().default(''),
  language_other: z.string().optional().default(''),
  reading_score: z.string().optional().default(''),
  listening_score: z.string().optional().default(''),
  writing_score: z.string().optional().default(''),
  speaking_score: z.string().optional().default(''),

  // Step 3: Education
  education_history: z.array(educationEntrySchema).default([]),

  // Step 4: Work Experience
  has_work_experience: z.boolean().default(false),
  work_duration: z.string().optional().default(''),
  job_title: z.string().optional().default(''),
  company_name: z.string().optional().default(''),

  // Step 5: Destinations & Subjects
  destinations: z.array(z.string()).min(1, 'Select at least one destination'),
  destination_other: z.string().optional().default(''),
  preferred_subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  subject_other: z.string().optional().default(''),
  total_budget_pkr: z.string().optional().default(''),

  // Step 6: Visa History
  applied_for_visa: z.boolean().default(false),
  visa_country: z.string().optional().default(''),
  visa_type: z.string().optional().default(''),
  visa_status: z.string().optional().default(''),
  visa_refusal_reason: z.string().optional().default(''),

  // Step 7: Documents
  documents: z.array(z.string()).default([]),
});

export type EnquiryFormData = z.infer<typeof enquiryFormSchema>;

// ---------------------------------------------------------------------------
// Appointment Booking
// ---------------------------------------------------------------------------

export const appointmentSchema = z.object({
  student_name: requiredString('Name'),
  phone: phoneSchema,
  appointment_date: requiredString('Appointment date'),
  appointment_time: requiredString('Appointment time'),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// ---------------------------------------------------------------------------
// Student Login/Registration
// ---------------------------------------------------------------------------

export const studentLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type StudentLoginData = z.infer<typeof studentLoginSchema>;

export const studentRegisterSchema = z
  .object({
    email: emailSchema,
    full_name: requiredString('Full name'),
    phone: phoneSchema.optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type StudentRegisterData = z.infer<typeof studentRegisterSchema>;

// ---------------------------------------------------------------------------
// Staff Login
// ---------------------------------------------------------------------------

export const staffLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type StaffLoginData = z.infer<typeof staffLoginSchema>;

// ---------------------------------------------------------------------------
// Student Record (Admin)
// ---------------------------------------------------------------------------

export const studentRecordSchema = z.object({
  name: requiredString('Student name'),
  father_name: z.string().optional().default(''),
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  target_destination: z.string().optional().default(''),
  language_test: z.string().optional().default(''),
  test_date_time: z.string().optional().default(''),
  pipeline_type: z.enum(['Admissions', 'Language']).default('Admissions'),
  admissions_stage: z.string().default('New'),
  language_stage: z.string().default('Enrolled'),
  university_applied: z.string().optional().default(''),
  target_score: z.string().optional().default(''),
});

export type StudentRecordData = z.infer<typeof studentRecordSchema>;

// ---------------------------------------------------------------------------
// Follow-Up
// ---------------------------------------------------------------------------

export const followUpSchema = z.object({
  student_name: requiredString('Student name'),
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  counselor_name: z.string().optional().default(''),
  follow_up_date: requiredString('Follow-up date'),
  notes: z.string().optional().default(''),
});

export type FollowUpData = z.infer<typeof followUpSchema>;

// ---------------------------------------------------------------------------
// Office Task
// ---------------------------------------------------------------------------

export const officeTaskSchema = z.object({
  description: requiredString('Task description'),
  due_date: z.string().optional().default(''),
  assignee: z.string().optional().default(''),
});

export type OfficeTaskData = z.infer<typeof officeTaskSchema>;

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export const blogSchema = z.object({
  title: requiredString('Title'),
  slug: requiredString('Slug')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only'
    ),
  excerpt: z.string().optional().default(''),
  content: requiredString('Content'),
  author: requiredString('Author'),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  published: z.boolean().default(false),
});

export type BlogFormData = z.infer<typeof blogSchema>;

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export const invoiceSchema = z.object({
  invoice_number: requiredString('Invoice number'),
  student: requiredString('Student name'),
  date: requiredString('Date'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: requiredString('Invoice type'),
  status: z.enum(['Paid', 'Unpaid']).default('Unpaid'),
  course: z.string().optional().default(''),
  payment_method: z.string().optional().default(''),
  paid_amount: z.coerce.number().optional(),
  remaining_amount: z.coerce.number().optional(),
  received_by: z.string().optional().default(''),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ---------------------------------------------------------------------------
// Student Feedback (Public)
// ---------------------------------------------------------------------------

export const feedbackSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  review_text: z.string().optional().default(''),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export const messageSchema = z.object({
  content: requiredString('Message'),
});

export type MessageFormData = z.infer<typeof messageSchema>;

// ---------------------------------------------------------------------------
// Profile Update
// ---------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
  full_name: z.string().optional(),
  designation: z.string().optional(),
  phone: phoneSchema.optional().or(z.literal('')),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
