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
      .select('slug')
      .eq('status', 'published')
      .eq('verification_status', 'verified')
      .limit(5000); 
      
    if (universities) {
      const validUniversities = universities.filter((u: any) => u.slug);
      routes = routes.concat(
        validUniversities.map((uni: any) => ({
          url: `${baseUrl}/universities/${uni.slug}`,
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
      .select('slug, universities!inner(slug)')
      .eq('status', 'published')
      .eq('verification_status', 'verified')
      .limit(5000);
      
    if (programs) {
      const validPrograms = programs.filter((prog: any) => {
        const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities;
        return prog.slug && prog.slug.trim() !== '' && uni?.slug;
      });
      routes = routes.concat(
        validPrograms.map((prog: any) => {
          const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities;
          return {
            url: `${baseUrl}/programs/${uni.slug}/${prog.slug}`,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          };
        })
      );
    }
  } catch (error) {
    console.error(`Error generating programs sitemap chunk:`, error);
  }

  try {
    const { data: scholarships } = await supabase
      .from('scholarships')
      .select('id')
      .eq('status', 'published')
      .eq('verification_status', 'verified')
      .limit(1000);
      
    if (scholarships) {
      routes = routes.concat(
        scholarships.map((sch: any) => ({
          url: `${baseUrl}/scholarships/${sch.id}`,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      );
    }
  } catch (error) {
    console.error(`Error generating scholarships sitemap chunk:`, error);
  }

  try {
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug')
      .eq('status', 'published')
      .limit(1000);
      
    if (blogs) {
      const validBlogs = blogs.filter((b: any) => b.slug);
      routes = routes.concat(
        validBlogs.map((blog: any) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      );
    }
  } catch (error) {
    console.error(`Error generating blogs sitemap chunk:`, error);
  }

  return routes;
}
