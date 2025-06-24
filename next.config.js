/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用React的并发特性
  reactStrictMode: true,
  // 启用Turbo模块
  turbopack: true,
  images: {
    // Enable modern image formats (WebP, AVIF)
    formats: ['image/avif', 'image/webp'],
    // Set default device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Set default image sizes for different viewport sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure remote image patterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'my-blog.bxiao.workers.dev',
      },
      {
        protocol: 'https',
        hostname: 'img.ixintu.com',
      },
      // Add more domains as needed for your blog's images
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },
  // 实验性功能优化
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  // 外部包配置
  serverExternalPackages: ['sharp'],
  // 开发环境优化
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 压缩配置
  compress: true,
};

const withMDX = require('@next/mdx')({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, set this to true
    providerImportSource: "@mdx-js/react",
  },
});

module.exports = withMDX({
  ...nextConfig,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
});