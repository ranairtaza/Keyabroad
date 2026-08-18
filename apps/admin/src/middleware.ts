import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@keyabroad/auth/middleware'

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
    path.startsWith('/api/automations/webhook')
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

  // 3. RBAC Shield: Block Students
  // Fetch role from profiles (Safe in Edge via REST)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') {
    // Hard block at the edge
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
