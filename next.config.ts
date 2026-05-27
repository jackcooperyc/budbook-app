import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/budbook-app/:path*',
        destination: '/budbook-app/index.html',
      },
      {
        source: '/budbook-app',
        destination: '/budbook-app/index.html',
      },
    ];
  },
};

export default nextConfig;
