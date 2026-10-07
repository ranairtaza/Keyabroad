import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@keyabroad/auth/rate-limit';
import crypto from 'crypto';

// Initialize Supabase with service role key to bypass RLS for this specific server-to-server read-only integration.
// IMPORTANT: This client must ONLY be used for SELECT queries in this endpoint.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function verifyBearerToken(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  const secret = process.env.LEADMACHINE_INTEGRATION_SECRET;
  
  if (!secret) return false;
  if (token.length !== secret.length) return false;
  
  // Constant time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

export async function GET(req: Request) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(ip, 30, 60); // 30 requests per minute
    
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString() } }
      );
    }

    // 2. Authentication
    if (!verifyBearerToken(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // 3. Pagination Validation
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    if (!pageParam || !limitParam) {
      return NextResponse.json({ error: 'Missing required pagination parameters (page, limit)' }, { status: 400 });
    }

    const page = parseInt(pageParam, 10);
    let limit = parseInt(limitParam, 10);

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    if (limit > 500) {
      limit = 500;
    }

    const updatedSince = searchParams.get('updated_since');
    if (updatedSince && isNaN(Date.parse(updatedSince))) {
      return NextResponse.json({ error: 'Invalid updated_since timestamp' }, { status: 400 });
    }

    // 4. Sequential Database Pagination
    // To provide a true global offset across two tables without a SQL UNION,
    // we sequence them: Enquiries first, then Students.

    // First get counts to determine offsets
    let eCountQuery = supabaseAdmin.from('enquiries').select('id', { count: 'exact', head: true });
    let sCountQuery = supabaseAdmin.from('students').select('id', { count: 'exact', head: true });
    
    if (updatedSince) {
      eCountQuery = eCountQuery.gte('created_at', updatedSince);
      sCountQuery = sCountQuery.gte('created_at', updatedSince);
    }
    
    const [eCountRes, sCountRes] = await Promise.all([eCountQuery, sCountQuery]);
    if (eCountRes.error) throw eCountRes.error;
    if (sCountRes.error) throw sCountRes.error;
    
    const totalEnquiries = eCountRes.count || 0;
    const totalStudents = sCountRes.count || 0;
    const totalRecords = totalEnquiries + totalStudents;
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const hasMore = (from + limit) < totalRecords;

    const normalizedData = [];

    // Fetch Enquiries if they fall in the current page
    if (from < totalEnquiries) {
      let eQuery = supabaseAdmin
        .from('enquiries')
        .select('id, full_name, email, mobile, status, total_budget_pkr, created_at')
        .order('created_at', { ascending: false })
        .range(from, Math.min(to, totalEnquiries - 1));
      
      if (updatedSince) eQuery = eQuery.gte('created_at', updatedSince);
      
      const { data, error } = await eQuery;
      if (error) throw error;
      
      if (data) {
        normalizedData.push(...data.map(e => ({
          id: e.id,
          type: 'lead',
          name: e.full_name,
          email: e.email,
          phone: e.mobile,
          status: e.status,
          pipeline_stage: null,
          value: e.total_budget_pkr ? parseFloat(e.total_budget_pkr) : 0,
          currency: 'PKR',
          owner_id: null,
          created_at: e.created_at,
          updated_at: e.created_at 
        })));
      }
    }

    // Fetch Students if they fall in the current page
    if (to >= totalEnquiries && from < totalRecords) {
      const sFrom = Math.max(0, from - totalEnquiries);
      const sTo = to - totalEnquiries;
      
      let sQuery = supabaseAdmin
        .from('students')
        .select('id, name, email, phone, admissions_stage, assigned_counselor_id, created_at')
        .order('created_at', { ascending: false })
        .range(sFrom, sTo);
        
      if (updatedSince) sQuery = sQuery.gte('created_at', updatedSince);
      
      const { data, error } = await sQuery;
      if (error) throw error;
      
      if (data) {
        normalizedData.push(...data.map(s => ({
          id: s.id,
          type: 'contact',
          name: s.name,
          email: s.email,
          phone: s.phone,
          status: null,
          pipeline_stage: s.admissions_stage,
          value: 0,
          currency: 'PKR',
          owner_id: s.assigned_counselor_id,
          created_at: s.created_at,
          updated_at: s.created_at 
        })));
      }
    }

    // 6. Audit Logging (Fire and forget)
    supabaseAdmin.from('audit_logs').insert([{
      user_id: null,
      user_email: 'leadmachine@integration',
      action: 'api_read',
      resource: 'integrations/leadmachine',
      details: { page, limit, updated_since: updatedSince, records_returned: normalizedData.length }
    }]).then(({ error }) => {
      if (error) console.error('Audit Log Error:', error);
    });

    return NextResponse.json({
      source: 'keyabroad_crm',
      version: '1',
      data: normalizedData,
      pagination: {
        page,
        limit,
        has_more: hasMore
      }
    });
  } catch (error: any) {
    // 7. Safe Error Handling
    console.error('LeadMachine Integration Error [PII SANITIZED]:', { 
      message: error.message || 'Unknown error', 
      code: error.code || 'UNKNOWN' 
    });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
