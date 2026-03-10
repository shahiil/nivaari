/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

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

module.exports = withPWA(nextConfig);
