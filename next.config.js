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
    // Add DefinePlugin to define 'self' for SSR compatibility
    config.plugins.push(
      new (require('webpack')).DefinePlugin({
        'typeof self': JSON.stringify('undefined'),
        'self': 'global',
      })
    );

    return config;
  },
};

module.exports = nextConfig;
