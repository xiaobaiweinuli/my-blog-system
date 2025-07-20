import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 实验性功能
  experimental: {
    // 其他实验性功能可以在这里添加
  },

  // 图片优化配置
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'nextjs.org' },
      { protocol: 'https', hostname: 'reactjs.org' },
      { protocol: 'https', hostname: 'www.typescriptlang.org' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'pub-your-r2-bucket.r2.dev' },
      { protocol: 'https', hostname: 'your-domain.com' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'tailwindcss.com' },
      { protocol: 'https', hostname: 'vercel.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'developer.mozilla.org' },
      { protocol: 'https', hostname: 'css-tricks.com' },
      { protocol: 'http', hostname: 'p2.qhimgs4.com' }
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // 重写配置
  async rewrites() {
    return [
      {
        source: '/rss',
        destination: '/api/rss',
      },
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 构建配置
  typescript: {
    // 在生产构建时忽略 TypeScript 错误
    ignoreBuildErrors: false,
  },

  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: false,
  },

  // 压缩配置
  compress: true,

  // 静态文件配置
  trailingSlash: false,
};

export default nextConfig;
