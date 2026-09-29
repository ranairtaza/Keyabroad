import { createClient } from '@/lib/supabase/server';

export interface ScholarshipSearchParams {
  search?: string;
  country?: string;
  amountMin?: number;
  amountMax?: number;
  sort?: string;
  page?: number;
}

export async function getPublishedScholarships(params: ScholarshipSearchParams) {
  const supabase = await createClient();
  const limit = 12;
  const page = params.page && params.page > 0 ? params.page : 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('scholarships')
    .select(`
      id,
      name,
      amount,
      currency,
      deadline,
      description,
      universities (
        name
      ),
      countries (
        name,
        slug
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.search) {
    const searchTrimmed = params.search.trim();
    query = query.ilike('name', `%${searchTrimmed}%`);
  }

  if (params.country) {
    query = query.eq('countries.slug', params.country);
  }

  if (params.amountMin) {
    query = query.gte('amount', params.amountMin);
  }

  if (params.amountMax) {
    query = query.lte('amount', params.amountMax);
  }

  // Apply sorting
  switch (params.sort) {
    case 'name-desc':
      query = query.order('name', { ascending: false });
      break;
    case 'amount-desc':
      query = query.order('amount', { ascending: false, nullsFirst: false });
      break;
    case 'amount-asc':
      query = query.order('amount', { ascending: true, nullsFirst: false });
      break;
    case 'deadline-asc':
      query = query.order('deadline', { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order('name', { ascending: true });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data: scholarships, error, count } = await query;

  if (error) {
    console.error('Error fetching scholarships:', error);
    return { scholarships: [], count: 0, totalPages: 0 };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    scholarships: scholarships || [],
    count: totalCount,
    totalPages
  };
}

export async function getPublishedScholarshipById(id: string) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }

  const { data: scholarship, error } = await supabase
    .from('scholarships')
    .select(`
      id,
      name,
      amount,
      currency,
      deadline,
      description,
      universities (
        id,
        name,
        logo_url
      ),
      countries (
        id,
        name,
        slug,
        flag_code
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .eq('verification_status', 'verified')
    .single();

  if (error) {
    console.error(`Error fetching scholarship ${id}:`, error);
    return null;
  }

  return scholarship;
}

export async function getAllScholarshipIds() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('scholarships')
    .select('id')
    .eq('status', 'published')
    .eq('verification_status', 'verified');
  if (error) {
    console.error('Error fetching scholarship IDs:', error);
    return [];
  }
  return (data || []).map((s: any) => ({ id: String(s.id) }));
}
