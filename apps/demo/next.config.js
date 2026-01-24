/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tc/infinite-core', '@tc/infinite-widget'],
};

module.exports = nextConfig;

// Cloudflare Pages 配置
if (process.env.CF_PAGES) {
  const setupDevPlatform = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform();
}
