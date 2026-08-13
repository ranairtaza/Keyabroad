import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@keyabroad/database';

export async function GET(request: Request) {
  // Readiness probe could be secured by a secret token in headers
  // For smoke tests, we ensure basic dependency connectivity
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Ping Supabase
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
    if (error) throw error;
    
    return NextResponse.json({
      status: 'READY',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'UNAVAILABLE',
      error: 'Dependency check failed'
    }, { status: 503 });
  }
}
