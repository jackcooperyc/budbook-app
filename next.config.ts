import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/pacs/:path*',
        headers: [{ key: 'Permissions-Policy', value: 'camera=(self)' }],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy BudBook paths → Pacs.MT
      {
        source: '/budbook-app',
        destination: '/pacs/scanner',
        permanent: true,
      },
      {
        source: '/budbook-app/buddy',
        destination: '/pacs/assistant',
        permanent: true,
      },
      {
        source: '/budbook-app/buddy/:path*',
        destination: '/pacs/assistant/:path*',
        permanent: true,
      },
      {
        source: '/budbook-app/cannadex',
        destination: '/pacs/registry',
        permanent: true,
      },
      {
        source: '/budbook-app/cannadex/:path*',
        destination: '/pacs/registry/:path*',
        permanent: true,
      },
      {
        source: '/budbook-app/:path*',
        destination: '/pacs/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
