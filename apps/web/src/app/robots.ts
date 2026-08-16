import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/admin'],
    },
    sitemap: 'https://keyabroad.com/sitemap.xml',
  };
}
