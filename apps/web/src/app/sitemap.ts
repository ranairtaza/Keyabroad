import { MetadataRoute } from 'next';
import { destinations } from '../data/destinations';
import { createClient } from '@supabase/supabase-js';

// Slugs that represent non-canonical duplicate entries pointing to canonical targets
const DUPLICATE_UNIVERSITY_SLUGS = new Set([
  'university-of-melbourne-1',
  'university-of-toronto-1',
  'university-of-toronto-2',
  'university-of-toronto-uoft',
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://keyabroad.com';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let routes: MetadataRoute.Sitemap = [];

  // 1. Canonical public static pages (all verified HTTP 200 indexable)
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/universities',
    '/destinations',
    '/programs',
    '/scholarships',
    '/about',
    '/services',
    '/language-tests',
    '/language-tests/ielts',
    '/language-tests/pte',
    '/language-tests/duolingo',
    '/language-tests/other',
    '/compare',
    '/cost-calculator',
    '/ai-advisor',
    '/teams',
    '/careers',
    '/blog',
    '/contact',
    '/counseling',
    '/eligibility',
    '/feedback',
    '/book-appointment',
    '/walk-in'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
  }));

  // 2. Canonical destination country routes
  const countryRoutes: MetadataRoute.Sitemap = destinations.map((country) => ({
    url: `${baseUrl}/destinations/${country.id}`,
  }));

  routes = routes.concat(staticRoutes, countryRoutes);

  if (!supabaseUrl || !supabaseAnonKey) {
    return routes;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 3. Canonical published & verified universities
  try {
    const { data: universities } = await supabase
      .from('universities')
      .select('slug, created_at, last_verified_at')
      .eq('status', 'published')
      .eq('verification_status', 'verified')
      .limit(5000);

    if (universities) {
      const canonicalUnis = universities.filter(
        (u: any) => u.slug && !DUPLICATE_UNIVERSITY_SLUGS.has(u.slug)
      );

      routes = routes.concat(
        canonicalUnis.map((uni: any) => {
          const rawDate = uni.last_verified_at || uni.created_at;
          const parsedDate = rawDate ? new Date(rawDate) : null;
          const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

          return {
            url: `${baseUrl}/universities/${uni.slug}`,
            ...(isValidDate ? { lastModified: parsedDate } : {}),
          };
        })
      );
    }
  } catch (error) {
    console.error('Error generating universities sitemap routes:', error);
  }

  // 4. Canonical published & verified programs
  try {
    const { data: programs } = await supabase
      .from('programs')
      .select('slug, created_at, updated_at, universities!inner(slug)')
      .eq('status', 'published')
      .eq('verification_status', 'verified')
      .limit(5000);

    if (programs) {
      const validPrograms = programs.filter((prog: any) => {
        const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities;
        return (
          prog.slug &&
          prog.slug.trim() !== '' &&
          uni?.slug &&
          !DUPLICATE_UNIVERSITY_SLUGS.has(uni.slug)
        );
      });

      routes = routes.concat(
        validPrograms.map((prog: any) => {
          const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities;
          const rawDate = prog.updated_at || prog.created_at;
          const parsedDate = rawDate ? new Date(rawDate) : null;
          const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

          return {
            url: `${baseUrl}/programs/${uni.slug}/${prog.slug}`,
            ...(isValidDate ? { lastModified: parsedDate } : {}),
          };
        })
      );
    }
  } catch (error) {
    console.error('Error generating programs sitemap chunk:', error);
  }

  // 5. Canonical published & verified scholarships
  try {
    const { data: scholarships } = await supabase
      .from('scholarships')
      .select('id, created_at, updated_at')
      .eq('status', 'published')
      .eq('verification_status', 'verified')
      .limit(1000);

    if (scholarships) {
      routes = routes.concat(
        scholarships.map((sch: any) => {
          const rawDate = sch.updated_at || sch.created_at;
          const parsedDate = rawDate ? new Date(rawDate) : null;
          const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

          return {
            url: `${baseUrl}/scholarships/${sch.id}`,
            ...(isValidDate ? { lastModified: parsedDate } : {}),
          };
        })
      );
    }
  } catch (error) {
    console.error('Error generating scholarships sitemap chunk:', error);
  }

  // 6. Canonical published blogs
  try {
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, published_at, created_at, updated_at')
      .eq('status', 'published')
      .limit(1000);

    if (blogs) {
      const validBlogs = blogs.filter((b: any) => b.slug);
      routes = routes.concat(
        validBlogs.map((blog: any) => {
          const rawDate = blog.published_at || blog.updated_at || blog.created_at;
          const parsedDate = rawDate ? new Date(rawDate) : null;
          const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

          return {
            url: `${baseUrl}/blog/${blog.slug}`,
            ...(isValidDate ? { lastModified: parsedDate } : {}),
          };
        })
      );
    }
  } catch (error) {
    console.error('Error generating blogs sitemap chunk:', error);
  }

  return routes;
}
