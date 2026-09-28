import { createClient as createServerClient } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export class AuthenticationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export type SecurityRole = 'owner' | 'admin' | 'hr' | 'operations head' | 'employee';

export interface AuthenticatedEmployee {
  authUserId: string;
  email: string;
  teamMemberId: number;
  role: SecurityRole;
  status: string;
  name: string;
}

/**
 * Maps arbitrary database role strings to the canonical security roles.
 */
export function normalizeRole(roleString: string | null | undefined): SecurityRole {
  if (!roleString) return 'employee';
  const role = roleString.trim().toLowerCase();
  
  if (role === 'owner' || role === 'super_admin' || role === 'super admin') return 'owner';
  if (role === 'admin') return 'admin';
  if (role === 'hr' || role === 'hr manager') return 'hr';
  if (role === 'operations head') return 'operations head';
  
  // Note: We DO NOT map 'ceo' or 'founder' to owner/admin automatically here anymore
  // unless they are explicitly assigned a canonical security role.
  return 'employee';
}

/**
 * Resolves the currently authenticated user to a trusted employee record
 * using the server's session.
 */
export async function resolveCurrentEmployee(): Promise<AuthenticatedEmployee | null> {
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const supabaseAdmin = getAdminClient();

  const { data: teamMember, error: empError } = await supabaseAdmin
    .from('team_members')
    .select('id, name, email, status, role, auth_user_id')
    .eq('auth_user_id', user.id)
    .single();

  if (empError || !teamMember) {
    return null;
  }

  return {
    authUserId: user.id,
    email: user.email,
    teamMemberId: teamMember.id,
    role: normalizeRole(teamMember.role),
    status: teamMember.status,
    name: teamMember.name
  };
}

/**
 * Requires that a valid employee session exists, throwing an error or returning null
 * if unauthorized.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedEmployee> {
  const employee = await resolveCurrentEmployee();
  if (!employee) {
    throw new AuthenticationError('Unauthorized');
  }
  return employee;
}

/**
 * Requires that the authenticated employee possesses one of the allowed canonical roles.
 */
export async function requireAnyRole(allowedRoles: SecurityRole[]): Promise<AuthenticatedEmployee> {
  const employee = await requireAuthenticatedUser();
  if (!allowedRoles.includes(employee.role)) {
    throw new AuthorizationError('Forbidden');
  }
  return employee;
}

/**
 * Requires that the authenticated employee possesses the specific canonical role.
 */
export async function requireRole(allowedRole: SecurityRole): Promise<AuthenticatedEmployee> {
  return requireAnyRole([allowedRole]);
}

import { NextResponse } from 'next/server';

/**
 * Standardized error handler for API routes.
 * Maps AuthenticationError to 401, AuthorizationError to 403, and others to 500.
 */
export function handleApiError(err: any): NextResponse {
  if (err instanceof AuthenticationError || err.name === 'AuthenticationError') {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof AuthorizationError || err.name === 'AuthorizationError') {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
}
