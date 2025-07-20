"use client";

import { Sparkles, BookOpen, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { FadeIn, SlideIn } from "@/components/ui/page-transition"
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data"
import { siteConfig } from "@/config/site"
import { generateBaseMetadata } from "@/lib/seo"
import type { Metadata } from "next"
import { OptimizedImage } from "@/components/ui/optimized-image"
import Link from "next/link"
import { usePublicSettings } from "@/hooks/usePublicSettings"
import { useEffect, useState } from "react"
import { getArticles } from "@/lib/data-service" // 假设有这个方法

function parseDate(dateStr: string) {
  if (!dateStr) return 0;
  // 兼容各种格式，强制加 Z
  let s = dateStr.replace(' ', 'T');
  if (!/Z$/.test(s) && !/\+\d{2}:?\d{2}$/.test(s)) s += 'Z';
  return new Date(s).getTime();
}

export default function Home() {
  const { settings } = usePublicSettings();
  const [articles, setArticles] = useState<any[]>([]);
  useEffect(() => {
    getArticles().then(res => {
      const arr = Array.isArray(res) ? res : (res.articles || []);
      const sorted = arr
        .sort((a: any, b: any) => parseDate(b.updated_at) - parseDate(a.updated_at))
        .slice(0, 3);
      setArticles(sorted);
    });
  }, []);
  const siteName = settings.site_name || siteConfig.name;
  const siteDesc = settings.site_description || siteConfig.description;
  return (
    <>
      {/* 结构化数据 */}
      <WebsiteStructuredData />
      <OrganizationStructuredData />

      <MainLayout>
      <PageContainer maxWidth="full">
        {/* Hero Section */}
        <section className="text-center py-12 md:py-20">
          <div className="max-w-4xl mx-auto">
            <FadeIn delay={100}>
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-4 h-4 mr-1" />
                {siteName}
              </Badge>
            </FadeIn>
            <FadeIn delay={200}>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
                {siteName}
              </h1>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {siteDesc}
              </p>
            </FadeIn>
            <FadeIn delay={400}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                  <a href="/articles">
                    <BookOpen className="w-4 h-4 mr-2" />
                    开始阅读
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/pages/contact" className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  了解更多
                  </a>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12">
          <SlideIn delay={500}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">强大功能</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                集成最新技术，为您提供最佳的博客体验
              </p>
            </div>
          </SlideIn>

          <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle>AI 智能摘要</CardTitle>
                <CardDescription>
                  自动生成文章摘要，提升阅读体验
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>深色模式</CardTitle>
                <CardDescription>
                  支持浅色/深色主题切换，保护您的眼睛
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle>响应式设计</CardTitle>
                <CardDescription>
                  完美适配手机、平板和桌面设备
                </CardDescription>
              </CardHeader>
            </Card>
          </ResponsiveGrid>
        </section>

        {/* Latest Articles Section */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">最新文章</h2>
            <Button variant="outline" asChild>
              <a href="/articles">查看全部</a>
            </Button>
          </div>

          <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
            {articles.map((article: any) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="block group hover:no-underline"
              >
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{article.category}</Badge>
                      {JSON.parse(article.tags || "[]").map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 w-full aspect-[2/1] rounded-lg overflow-hidden bg-muted">
                      <OptimizedImage
                        src={article.cover_image || '/images/placeholder.jpg'}
                        alt={article.title}
                        width={400}
                        height={200}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {article.excerpt || article.summary || "暂无摘要"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </ResponsiveGrid>
        </section>
      </PageContainer>
    </MainLayout>
    </>
  )
}
