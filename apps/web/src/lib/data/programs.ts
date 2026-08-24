import { createClient } from '@/lib/supabase/server';

export interface ProgramSearchParams {
  search?: string;
  country?: string;
  degree?: string;
  tuitionMax?: number;
  ielts?: number;
  pte?: number;
  intake?: string;
  page?: number;
  sort?: string;
}

export async function getPublishedPrograms(params: ProgramSearchParams) {
  const supabase = await createClient();
  const limit = 12;
  const page = params.page && params.page > 0 ? params.page : 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('programs')
    .select(`
      id,
      name,
      degree_level,
      duration,
      tuition_fee,
      currency,
      ielts_requirement,
      pte_requirement,
      intake_months,
      universities!inner (
        name,
        slug,
        logo_url,
        countries!inner (
          name,
          slug
        )
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }
  
  if (params.country) {
    query = query.eq('universities.countries.slug', params.country);
  }

  if (params.degree) {
    query = query.eq('degree_level', params.degree);
  }
  
  if (params.tuitionMax) {
    query = query.lte('tuition_fee', params.tuitionMax);
  }
  
  if (params.ielts) {
    query = query.lte('ielts_requirement', params.ielts);
  }
  
  if (params.pte) {
    query = query.lte('pte_requirement', params.pte);
  }
  
  if (params.intake) {
    query = query.contains('intake_months', [params.intake]);
  }

  // Apply sorting
  switch (params.sort) {
    case 'name-desc':
      query = query.order('name', { ascending: false });
      break;
    case 'tuition-asc':
      query = query.order('tuition_fee', { ascending: true, nullsFirst: false });
      break;
    case 'tuition-desc':
      query = query.order('tuition_fee', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('name', { ascending: true });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data: programs, error, count } = await query;

  if (error) {
    console.error('Error fetching programs:', error);
    return { programs: [], count: 0, totalPages: 0 };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    programs: programs || [],
    count: totalCount,
    totalPages
  };
}

export async function getPublishedProgramBySlug(slug: string) {
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      slug,
      degree_level,
      duration,
      tuition_fee,
      currency,
      universities (
        id,
        name,
        slug,
        logo_url,
        url,
        countries (
          name,
          slug,
          flag_code
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`Error fetching program ${slug}:`, error);
    return null;
  }

  return program;
}

export async function getPublishedProgramById(id: string) {
  const supabase = await createClient();

  // Validate UUID format before querying to avoid postgres errors on invalid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }

  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      slug,
      degree_level,
      duration,
      tuition_fee,
      currency,
      universities (
        id,
        name,
        slug,
        logo_url,
        url,
        countries (
          name,
          slug,
          flag_code
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching program ${id}:`, error);
    return null;
  }

  return program;
}
