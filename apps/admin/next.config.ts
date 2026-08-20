import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  transpilePackages: ['@keyabroad/ui', '@keyabroad/validation', '@keyabroad/auth', '@keyabroad/ai'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Override for embed routes — allow iframing from keyabroad.com only
        // CSP frame-ancestors takes precedence over X-Frame-Options in modern browsers
        source: '/embed/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://keyabroad.com https://www.keyabroad.com https://*.keyabroad.com",
          },
          // Remove X-Frame-Options for embed routes (CSP takes over)
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
    ];
  },
};

export default nextConfig;
