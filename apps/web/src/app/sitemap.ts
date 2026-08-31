import { MetadataRoute } from 'next';
import { destinations } from '@/data/destinations';
import { createClient } from '@supabase/supabase-js';

const CHUNK_SIZE = 1000;

export async function generateSitemaps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  const { count } = await supabase
    .from('programs')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('slug', 'is', null)
    .not('tuition_fee', 'is', null)
    .not('duration', 'is', null);

  const totalPrograms = count || 0;
  const numChunks = Math.ceil(totalPrograms / CHUNK_SIZE);
  
  const sitemaps = [];
  // Ensure at least one sitemap chunk exists even if 0 programs
  for (let i = 0; i < Math.max(numChunks, 1); i++) {
    sitemaps.push({ id: i });
  }
  return sitemaps;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://keyabroad.com';
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  let routes: MetadataRoute.Sitemap = [];

  // Only include static routes, destinations, and universities in the first chunk (id === 0)
  if (id === 0) {
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
        .select('id, updated_at')
        .eq('is_published', true)
        .limit(CHUNK_SIZE); // Assuming universities < 1000 for now. Can be chunked similarly if needed.
        
      if (universities) {
        routes = routes.concat(
          universities.map((uni: any) => ({
            url: `${baseUrl}/universities/${uni.id}`,
            lastModified: uni.updated_at ? new Date(uni.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }))
        );
      }
    } catch (error) {
      console.error("Error generating universities sitemap routes:", error);
    }
  }

  // Include programs chunked by id
  try {
    const startOffset = id * CHUNK_SIZE;
    const endOffset = startOffset + CHUNK_SIZE - 1;

    const { data: programs } = await supabase
      .from('programs')
      .select('id, updated_at, universities!inner(id)')
      .eq('is_published', true)
      .not('tuition_fee', 'is', null)
      .not('duration', 'is', null)
      .range(startOffset, endOffset);
      
    if (programs) {
      routes = routes.concat(
        programs.map((prog: any) => {
          const uniId = Array.isArray(prog.universities) ? prog.universities[0]?.id : prog.universities?.id;
          return {
            url: `${baseUrl}/programs/${uniId}/${prog.id}`,
            lastModified: prog.updated_at ? new Date(prog.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          };
        })
      );
    }
  } catch (error) {
    console.error(`Error generating programs sitemap chunk ${id}:`, error);
  }

  return routes;
}
