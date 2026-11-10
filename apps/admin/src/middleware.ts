import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@keyabroad/auth/middleware'
import { STAFF_ROLES, type StaffRole } from '@keyabroad/database'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const path = request.nextUrl.pathname

  // 1. Allow public routes
  if (
    path.startsWith('/login') ||
    path.startsWith('/auth') ||
    path.startsWith('/feedback') ||
    path.startsWith('/embed') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/leads/webhook') ||
    path.startsWith('/api/automations/webhook') ||
    path.startsWith('/api/biometrics/events')
  ) {
    return supabaseResponse
  }

  // 2. Require Authentication
  if (!user) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. Strict RBAC Shield: Allowlist Authorized Staff Only
  // Fetch role and staff_role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, staff_role')
    .eq('id', user.id)
    .single()

  const candidateRole = (profile?.staff_role || profile?.role) as StaffRole | undefined

  // Strict allowlist: reject null, unknown, student, and unauthorized roles
  if (!candidateRole || !STAFF_ROLES.includes(candidateRole)) {
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Forbidden: Authorized staff role required.' },
        { status: 403 }
      )
    }
    return new NextResponse('Forbidden: You do not have permission to access the admin portal.', {
      status: 403,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
