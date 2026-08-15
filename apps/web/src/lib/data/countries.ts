import { createClient } from '@/lib/supabase/server';

export async function getPublishedCountries() {
  const supabase = await createClient();

  const { data: countries, error } = await supabase
    .from('countries')
    .select(`
      id,
      name,
      slug,
      description,
      image_url,
      flag_code,
      universities:universities(count)
    `)
    // Implicit RLS filter: status = 'published' AND verification_status = 'verified'
    .order('name');

  if (error) {
    console.error('Error fetching countries:', error);
    return [];
  }

  return countries || [];
}

export async function getPublishedCountryBySlug(slug: string) {
  const supabase = await createClient();

  const { data: country, error } = await supabase
    .from('countries')
    .select(`
      id,
      name,
      slug,
      description,
      image_url,
      flag_code,
      currency_code,
      country_features(feature),
      universities(
        id,
        name,
        slug,
        logo_url,
        url,
        avg_bachelors_tuition,
        avg_masters_tuition,
        required_documents
      )
    `)
    .eq('slug', slug)
    // Implicit RLS applies
    .single();

  if (error) {
    console.error(`Error fetching country ${slug}:`, error);
    return null;
  }

  return country;
}
