import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { Database } from '@keyabroad/database'

export async function updateSession(request: any) {
  // CSRF Protection: Validate Origin/Referer for mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    let isOriginValid = true;
    let isRefererValid = true;

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        isOriginValid = originUrl.host === host;
      } catch (e) {
        isOriginValid = false;
      }
    }

    if (referer && host) {
      try {
        const refererUrl = new URL(referer);
        isRefererValid = refererUrl.host === host;
      } catch (e) {
        isRefererValid = false;
      }
    }

    if (!isOriginValid || !isRefererValid) {
      return { 
        supabaseResponse: NextResponse.json({ error: 'CSRF Token Mismatch' }, { status: 403 }), 
        user: null, 
        supabase: null 
      };
    }
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Return the base response and the user object so applications can enforce their own routing
  return { supabaseResponse, user, supabase }
}
