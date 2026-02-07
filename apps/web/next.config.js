/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hospital-ops/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
