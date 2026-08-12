// ============================================================================
// KeyAbroad — Role Permissions & Access Control
// ============================================================================
// Defines what each staff role can access. Used for client-side UI gating
// AND should be mirrored in RLS policies server-side.
// ============================================================================

import type { StaffRole } from '@/types/database';

// ---------------------------------------------------------------------------
// Permission Definitions
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',

  // Student Management
  VIEW_STUDENTS: 'view_students',
  MANAGE_STUDENTS: 'manage_students',
  DELETE_STUDENTS: 'delete_students',

  // Lead/CRM
  VIEW_LEADS: 'view_leads',
  MANAGE_LEADS: 'manage_leads',
  VIEW_PIPELINE: 'view_pipeline',
  MANAGE_PIPELINE: 'manage_pipeline',

  // Visa
  VIEW_VISAS: 'view_visas',
  MANAGE_VISAS: 'manage_visas',

  // Finance
  VIEW_FEES: 'view_fees',
  MANAGE_FEES: 'manage_fees',
  VIEW_INVOICES: 'view_invoices',
  MANAGE_INVOICES: 'manage_invoices',

  // Content
  VIEW_BLOGS: 'view_blogs',
  MANAGE_BLOGS: 'manage_blogs',

  // Team/HR
  VIEW_TEAM: 'view_team',
  MANAGE_TEAM: 'manage_team',
  VIEW_HR_OPS: 'view_hr_ops',
  MANAGE_HR_OPS: 'manage_hr_ops',
  VIEW_ATTENDANCE: 'view_attendance',

  // System
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_INTEGRATIONS: 'view_integrations',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Operations
  VIEW_OPERATIONS: 'view_operations',
  MANAGE_OPERATIONS: 'manage_operations',
  VIEW_TASKS: 'view_tasks',
  MANAGE_TASKS: 'manage_tasks',

  // Campaigns
  VIEW_CAMPAIGNS: 'view_campaigns',
  MANAGE_CAMPAIGNS: 'manage_campaigns',

  // Appointments
  VIEW_APPOINTMENTS: 'view_appointments',
  MANAGE_APPOINTMENTS: 'manage_appointments',

  // Reviews
  VIEW_REVIEWS: 'view_reviews',
  MANAGE_REVIEWS: 'manage_reviews',

  // Automations
  VIEW_AUTOMATIONS: 'view_automations',
  MANAGE_AUTOMATIONS: 'manage_automations',

  // Universities
  VIEW_UNIVERSITIES: 'view_universities',
  MANAGE_UNIVERSITIES: 'manage_universities',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ---------------------------------------------------------------------------
// Role → Permission Mapping
// ---------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: Object.values(PERMISSIONS), // Full access

  admin: Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.MANAGE_SETTINGS // Admins can't modify system settings
  ),

  branch_manager: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.VIEW_PIPELINE,
    PERMISSIONS.MANAGE_PIPELINE,
    PERMISSIONS.VIEW_VISAS,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.VIEW_HR_OPS,
    PERMISSIONS.MANAGE_HR_OPS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.MANAGE_OPERATIONS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.VIEW_UNIVERSITIES,
    PERMISSIONS.VIEW_BLOGS,
    PERMISSIONS.MANAGE_BLOGS,
  ],

  counselor: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.VIEW_PIPELINE,
    PERMISSIONS.MANAGE_PIPELINE,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.MANAGE_OPERATIONS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_UNIVERSITIES,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  admission_officer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_PIPELINE,
    PERMISSIONS.MANAGE_PIPELINE,
    PERMISSIONS.VIEW_VISAS,
    PERMISSIONS.MANAGE_VISAS,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_UNIVERSITIES,
    PERMISSIONS.MANAGE_UNIVERSITIES,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  visa_officer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_VISAS,
    PERMISSIONS.MANAGE_VISAS,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  content_manager: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_BLOGS,
    PERMISSIONS.MANAGE_BLOGS,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.MANAGE_REVIEWS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_UNIVERSITIES,
    PERMISSIONS.MANAGE_UNIVERSITIES,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  marketing_staff: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_BLOGS,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  finance_staff: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.MANAGE_FEES,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.MANAGE_INVOICES,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  intern: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_OPERATIONS,
  ],
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ALL of the given permissions
 */
export function hasAllPermissions(
  role: StaffRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the given permissions
 */
export function hasAnyPermission(
  role: StaffRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role is an admin-level role
 */
export function isAdminRole(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'admin';
}

/**
 * Check if a role is a management-level role
 */
export function isManagerRole(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'admin' || role === 'branch_manager';
}

/**
 * Human-readable role label
 */
export function getRoleLabel(role: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    branch_manager: 'Branch Manager',
    counselor: 'Counselor',
    admission_officer: 'Admission Officer',
    visa_officer: 'Visa Officer',
    content_manager: 'Content Manager',
    marketing_staff: 'Marketing',
    finance_staff: 'Finance',
    intern: 'Intern',
  };
  return labels[role] ?? role;
}
