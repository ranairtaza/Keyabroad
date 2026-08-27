import { createClient } from '@/lib/supabase/server';

export interface UniversitySearchParams {
  search?: string;
  country?: string;
  city?: string;
  page?: number;
  sort?: string;
}

export async function getPublishedUniversities(params: UniversitySearchParams) {
  const supabase = await createClient();
  const limit = 12;
  const page = params.page && params.page > 0 ? params.page : 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('universities')
    .select(`
      id,
      name,
      slug,
      logo_url,
      city,
      ranking,
      intake_months,
      intakes,
      gpa_requirement,
      work_rights,
      countries!inner (
        name,
        slug
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }
  
  if (params.country) {
    query = query.eq('countries.slug', params.country);
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`);
  }

  // Apply sorting
  switch (params.sort) {
    case 'name-desc':
      query = query.order('name', { ascending: false });
      break;
    case 'ranking-asc':
      query = query.order('ranking', { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order('name', { ascending: true });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data: universities, error, count } = await query;

  if (error) {
    console.error('Error fetching universities:', error);
    return { universities: [], count: 0, totalPages: 0 };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    universities: universities || [],
    count: totalCount,
    totalPages
  };
}


export async function getPublishedUniversityBySlug(slug: string) {
  const supabase = await createClient();

  const { data: university, error } = await supabase
    .from('universities')
    .select(`
      id,
      name,
      slug,
      logo_url,
      url,
      countries (
        name,
        slug
      ),
      programs (
        id,
        name,
        slug,
        degree_level,
        duration,
        tuition_fee,
        currency,
        intakes,
        gpa_requirement,
        work_rights
      ),
      scholarships (
        id,
        name,
        amount,
        currency,
        deadline,
        description
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`Error fetching university ${slug}:`, error);
    return null;
  }

  return university;
}
