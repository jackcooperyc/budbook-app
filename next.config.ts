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
  async rewrites() {
    return [
      {
        source: '/budbook-app/legacy',
        destination: '/budbook-app/index.html',
      },
      {
        source: '/budbook-app/legacy/:path*',
        destination: '/budbook-app/index.html',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/budbook-app/:path*',
        headers: [{ key: 'Permissions-Policy', value: 'camera=(self)' }],
      },
    ];
  },
};

export default nextConfig;
