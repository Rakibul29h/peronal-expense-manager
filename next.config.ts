import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable telemetry & optimize for fast rebuilds
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
