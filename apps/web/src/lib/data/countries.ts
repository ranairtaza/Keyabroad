import { createClient } from '@/lib/supabase/server';

const IMAGE_FALLBACKS: Record<string, string> = {
  'italy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/1280px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg',
  'finland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Helsinki_Cathedral_from_south_west_side.jpg/1280px-Helsinki_Cathedral_from_south_west_side.jpg',
  'netherlands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Amsterdam_Canal_View.jpg/1280px-Amsterdam_Canal_View.jpg',
  'malaysia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Kuala_Lumpur_City_Centre_%28KLCC%29_at_night.jpg/1280px-Kuala_Lumpur_City_Centre_%28KLCC%29_at_night.jpg',
  'dubai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg',
  'new-zealand': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Mount_Cook_from_Lake_Pukaki.jpg/1280px-Mount_Cook_from_Lake_Pukaki.jpg',
  'turkey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Hagia_Sophia_Mars_2013.jpg/1280px-Hagia_Sophia_Mars_2013.jpg'
};

function patchCountryImage(country: any) {
  if (!country) return country;
  if (country.image_url?.includes('unsplash') && IMAGE_FALLBACKS[country.slug]) {
    country.image_url = IMAGE_FALLBACKS[country.slug];
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
      country_features(feature),
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
