export const siteConfig = {
  name: "现代博客系统",
  description: "基于 Next.js 的现代化博客系统，支持 AI 摘要、深色模式等功能",
  url: "https://your-domain.com",
  ogImage: "https://your-domain.com/og.jpg",
  links: {
    github: "https://github.com/yourusername/your-repo",
    twitter: "https://twitter.com/yourusername",
  },
  author: {
    name: "Your Name",
    email: "your.email@example.com",
    twitter: "@yourusername",
  },
  // 主题配置
  theme: {
    defaultTheme: "light" as const,
    enableSystemTheme: true,
  },
  // 分页配置
  pagination: {
    articlesPerPage: 10,
    commentsPerPage: 20,
    filesPerPage: 20,
  },
  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/markdown",
    ],
  },
  // SEO 配置
  seo: {
    titleTemplate: "%s | 现代博客系统",
    defaultTitle: "现代博客系统",
    description: "基于 Next.js 的现代化博客系统",
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: "https://your-domain.com",
      siteName: "现代博客系统",
    },
    twitter: {
      handle: "@yourusername",
      site: "@yourusername",
      cardType: "summary_large_image",
    },
  },
  // 功能开关
  features: {
    enableComments: true,
    enableSearch: true,
    enableAnalytics: true,
    enableAISummary: true,
    enableFileManagement: true,
    enableDarkMode: true,
  },
  // 外部服务配置
  services: {
    cloudflareWorker: {
      authUrl: process.env.CLOUDFLARE_AUTH_URL || "",
      fileUrl: process.env.CLOUDFLARE_FILE_URL || "",
    },
    analytics: {
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || "",
      plausibleDomain: process.env.PLAUSIBLE_DOMAIN || "",
    },
  },
};

export type SiteConfig = typeof siteConfig;
