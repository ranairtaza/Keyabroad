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
      intakes,
      gpa_requirement,
      work_rights,
      universities!inner (
        name,
        logo_url,
        countries!inner (
          name,
          slug
        )
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.search) {
    const searchTrimmed = params.search.trim();
    query = query.ilike('name', `%${searchTrimmed}%`);
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
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
    .eq('status', 'published')
    .eq('verification_status', 'verified')
    .single();

  if (error) {
    console.error(`Error fetching program ${slug}:`, error);
    return null;
  }

  return program;
}

export async function getPublishedProgramById(id: string) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        logo_url,
        url,
        countries (
          name,
          slug,
          flag_code
        )
      )
    `)
    .eq('slug', id)
    .eq('status', 'published')
    .eq('verification_status', 'verified')
    .single();

  if (error) {
    console.error(`Error fetching program ${id}:`, error);
    return null;
  }

  return program;
}

export async function getAllProgramSlugs() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await supabase
    .from('programs')
    .select('slug, universities!inner(slug, status, verification_status)')
    .eq('status', 'published')
    .eq('verification_status', 'verified')
    .eq('universities.status', 'published')
    .eq('universities.verification_status', 'verified');
    
  if (error) {
    console.error('Error fetching program slugs:', error);
    return [];
  }
  
  return (data || [])
    .filter((p: any) => p.slug)
    .map((p: any) => {
      const uni = Array.isArray(p.universities) ? p.universities[0] : p.universities;
      const uniSlug = uni ? (uni as any).slug : null;
      if (!uniSlug) return null;
      return { 
        programId: String(p.slug),
        universityId: String(uniSlug)
      };
    })
    .filter(Boolean);
}
