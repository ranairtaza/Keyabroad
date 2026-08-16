import { createClient } from '@/lib/supabase/server';

const IMAGE_FALLBACKS: Record<string, string> = {
  'united-kingdom': '/destinations/uk-v2.jpg',
  'united-states': '/destinations/usa-v2.jpg',
  'germany': '/destinations/germany-v2.jpg',
  'canada': '/destinations/canada-new.jpg',
  'ireland': '/destinations/ireland-v2.jpg',
  'malta': '/destinations/malta-v2.jpg',
  'cyprus': '/destinations/cyprus-v2.jpg',
  'australia': '/destinations/australia-v2.jpg',
  'france': '/destinations/france-v2.jpg',
  'sweden': '/destinations/sweden-v2.jpg',
  'italy': '/destinations/italy-v2.jpg',
  'finland': '/destinations/finland-v2.jpg',
  'netherlands': '/destinations/netherlands-v2.jpg',
  'malaysia': '/destinations/malaysia-new.jpg',
  'dubai': '/destinations/dubai-v2.jpg',
  'new-zealand': '/destinations/new-zealand.jpg',
  'turkey': '/destinations/turkey-v2.jpg'
};

function patchCountryImage(country: any) {
  if (!country) return country;
  // Always prefer the high-quality local images over external database links
  if (IMAGE_FALLBACKS[country.slug]) {
    return {
      ...country,
      image_url: IMAGE_FALLBACKS[country.slug]
    };
  }
  return country;
}

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

  return (countries || []).map(patchCountryImage);
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
      universities(
        id,
        name,
        slug,
        logo_url,
        url
      )
    `)
    .eq('slug', slug)
    // Implicit RLS applies
    .single();

  if (error) {
    console.error(`Error fetching country ${slug}:`, error);
    return null;
  }

  return patchCountryImage(country);
}
