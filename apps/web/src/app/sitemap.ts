import { MetadataRoute } from 'next';
import { destinations } from '@/data/destinations';

export default function sitemap(): MetadataRoute.Sitemap {
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
  const countryRoutes = destinations.map((country) => ({
    url: `${baseUrl}/destinations/${country.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...routes, ...countryRoutes];
}
