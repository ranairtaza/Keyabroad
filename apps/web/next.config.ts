import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@keyabroad/ui', '@keyabroad/validation', '@keyabroad/auth'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "icef-api-production.s3.eu-central-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/student',
        destination: '/student/login',
        permanent: true,
      },
      {
        source: '/team',
        destination: '/teams',
        permanent: true,
      },
      // Phase 1 404 Remediation Redirects
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home-page',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contactus',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/blogs',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/team-1',
        destination: '/teams',
        permanent: true,
      },
      {
        source: '/icef-agency-status',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/dubai',
        destination: '/destinations/dubai',
        permanent: true,
      },
      {
        source: '/new-zealand',
        destination: '/destinations/new-zealand',
        permanent: true,
      },
      {
        source: '/malta',
        destination: '/destinations/malta',
        permanent: true,
      },
      {
        source: '/united-kingdom',
        destination: '/destinations/united-kingdom',
        permanent: true,
      },
      {
        source: '/cyprus',
        destination: '/destinations/cyprus',
        permanent: true,
      },
      {
        source: '/united-states',
        destination: '/destinations/united-states',
        permanent: true,
      },
      {
        source: '/ireland',
        destination: '/destinations/ireland',
        permanent: true,
      },
      {
        source: '/australia',
        destination: '/destinations/australia',
        permanent: true,
      },
      {
        source: '/australia-1',
        destination: '/destinations/australia',
        permanent: true,
      },
      {
        source: '/canada',
        destination: '/destinations/canada',
        permanent: true,
      },
      {
        source: '/ielts',
        destination: '/language-tests/ielts',
        permanent: true,
      },
      {
        source: '/pte-1',
        destination: '/language-tests/pte',
        permanent: true,
      },
      {
        source: '/pte',
        destination: '/language-tests/pte',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
