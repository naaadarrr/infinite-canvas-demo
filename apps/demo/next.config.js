/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tc/infinite-core', '@tc/infinite-widget'],
};

module.exports = nextConfig;
