import { MetadataRoute } from 'next';
import { destinations } from '@/data/destinations';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://keyabroad.com';
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  let routes: MetadataRoute.Sitemap = [];

  const staticRoutes = [
    '',
    '/about',
    '/services',
    '/scholarships',
    '/language-tests',
    '/destinations',
    '/compare',
    '/cost-calculator',
    '/ai-advisor',
    '/teams',
    '/careers',
    '/blog',
    '/contact'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const countryRoutes = destinations.map((country) => ({
    url: `${baseUrl}/destinations/${country.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  routes = routes.concat(staticRoutes, countryRoutes);

  try {
    const { data: universities } = await supabase
      .from('universities')
      .select('id, slug, updated_at')
      .eq('is_published', true)
      .limit(5000); 
      
    if (universities) {
      const validUniversities = universities.filter((uni: any) => uni.slug && uni.slug.trim() !== '');
      routes = routes.concat(
        validUniversities.map((uni: any) => ({
          url: `${baseUrl}/universities/${uni.slug}`,
          lastModified: uni.updated_at ? new Date(uni.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
      );
    }
  } catch (error) {
    console.error("Error generating universities sitemap routes:", error);
  }

  try {
    const { data: programs } = await supabase
      .from('programs')
      .select('id, slug, updated_at, universities!inner(id, slug)')
      .eq('is_published', true)
      .not('tuition_fee', 'is', null)
      .not('duration', 'is', null)
      .limit(5000);
      
    if (programs) {
      const validPrograms = programs.filter((prog: any) => {
        const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities;
        return prog.slug && prog.slug.trim() !== '' && uni?.slug && uni.slug.trim() !== '';
      });
      routes = routes.concat(
        validPrograms.map((prog: any) => {
          const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities;
          return {
            url: `${baseUrl}/programs/${uni.slug}/${prog.slug}`,
            lastModified: prog.updated_at ? new Date(prog.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          };
        })
      );
    }
  } catch (error) {
    console.error(`Error generating programs sitemap chunk:`, error);
  }

  return routes;
}
