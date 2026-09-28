import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@keyabroad/auth/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Protect student-specific private routes
  if (!user && (path.startsWith('/student') || path.startsWith('/book-appointment'))) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // All other routes are public on the web portal
  return supabaseResponse
}

export const config = {
  matcher: [
    '/student/:path*',
    '/book-appointment/:path*',
    '/api/:path*',
  ],
}
