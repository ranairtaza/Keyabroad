import { MetadataRoute } from 'next';
import { getPublishedCountries } from '@/lib/data/countries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://keyabroad.com';

  // Static routes
  const routes = [
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
    '/walk-in',
    '/blog',
    '/contact',
    '/login'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic destination routes
  try {
    const countries = await getPublishedCountries();
    const countryRoutes = countries.map((country: any) => ({
      url: `${baseUrl}/destinations/${country.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    return [...routes, ...countryRoutes];
  } catch (error) {
    console.error('Error generating sitemap for countries:', error);
    return routes;
  }
}
