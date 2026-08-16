import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const urlStart = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'MISSING';

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('countries')
      .select('slug, name, status, verification_status')
      .order('name');

    return NextResponse.json({
      env: { hasUrl, hasKey, urlStart },
      countries: data,
      error: error ? { message: error.message, code: error.code } : null,
    });
  } catch (e: any) {
    return NextResponse.json({
      env: { hasUrl, hasKey, urlStart },
      countries: null,
      error: e.message,
    });
  }
}
