import { DataService } from "@/lib/data-service"
import { defaultArticles } from "@/lib/mock-data"
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const dataService = DataService.getInstance()
    
    // 获取已发布的文章
    let articles = []
    try {
      const result = await dataService.getArticles({ status: "published" })
      articles = result.articles
    } catch (error) {
      console.warn('Failed to get articles from API, using default data:', error)
      articles = defaultArticles.filter(article => article.status === 'published')
    }

    const siteConfig = {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://loushi.dpdns.org',
      title: '现代博客系统',
      description: '基于 Next.js 和 Cloudflare Workers 的现代化博客系统',
      author: '管理员',
      email: 'admin@example.com',
    }

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.title}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/api/rss" rel="self" type="application/rss+xml" />
    ${articles.map(article => `
    <item>
      <title>${article.title}</title>
      <link>${siteConfig.url}/articles/${article.slug}</link>
      <guid isPermaLink="false">${siteConfig.url}/articles/${article.slug}</guid>
      <pubDate>${(article.publishedAt || article.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${article.excerpt || article.content.substring(0, 200)}]]></description>
      <category>${article.category}</category>
      ${article.tags.map(tag => `<category>${tag}</category>`).join('')}
    </item>`).join('')}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    )
  }
}
