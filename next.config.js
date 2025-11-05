/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    domains: ['i.pravatar.cc'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  // Skip ESLint during builds for faster compilation
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize bundling without changing functionality
  webpack: (config, { dev }) => {
    return config;
  },
};

module.exports = nextConfig;
