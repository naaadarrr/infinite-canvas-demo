/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tc/infinite-core', '@tc/infinite-widget'],
  webpack: (config) => {
    // Konva's Node entry can require 'canvas'; we only use the browser build. Don't resolve it.
    config.resolve.alias ??= {};
    config.resolve.alias.canvas = false;
    config.resolve.fallback = { ...config.resolve.fallback, canvas: false };
    return config;
  },
};

module.exports = nextConfig;

// Cloudflare Pages 配置
if (process.env.CF_PAGES) {
  const setupDevPlatform = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform();
}
