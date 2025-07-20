import { NextResponse } from "next/server"
import { siteConfig } from "@/config/site"

/**
 * 生成 robots.txt 文件
 */
export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# 允许搜索引擎访问的路径
Allow: /articles
Allow: /categories
Allow: /tags
Allow: /archive
Allow: /now
Allow: /guestbook

# 禁止搜索引擎访问的路径
Disallow: /dashboard
Disallow: /admin
Disallow: /files
Disallow: /profile
Disallow: /settings
Disallow: /auth
Disallow: /api
Disallow: /search

# 网站地图位置
Sitemap: ${siteConfig.url}/api/sitemap

# 爬取延迟（可选）
Crawl-delay: 1

# 特定搜索引擎规则
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Baiduspider
Allow: /

# 禁止某些机器人
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /`

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
