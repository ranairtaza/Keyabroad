import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // First: confirm env vars exist
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      status: 'ERROR',
      message: 'Missing env vars',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPreview: supabaseUrl?.substring(0, 30) || 'MISSING',
    }, { status: 500 });
  }

  // Second: call Supabase REST API directly with fetch (no SDK)
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/countries?select=slug,name,status,verification_status&order=name`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await res.json();

    return NextResponse.json({
      status: res.ok ? 'OK' : 'SUPABASE_ERROR',
      httpStatus: res.status,
      urlPreview: supabaseUrl.substring(0, 40),
      rowCount: Array.isArray(data) ? data.length : 0,
      countries: Array.isArray(data) ? data : null,
      error: !Array.isArray(data) ? data : null,
    });
  } catch (e: any) {
    return NextResponse.json({
      status: 'FETCH_ERROR',
      error: e.message,
      urlPreview: supabaseUrl.substring(0, 40),
    }, { status: 500 });
  }
}
