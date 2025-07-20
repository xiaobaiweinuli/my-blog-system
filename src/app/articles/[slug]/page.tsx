import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, Eye, Heart, ArrowLeft, Share2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { TableOfContents, ReadingProgress } from "@/components/ui/table-of-contents"
import { ArticleStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data"
import { SimpleGiscusComments } from "@/components/comments/giscus-comments"
import { generateArticleMetadata } from "@/lib/seo"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import type { Metadata } from "next"
import { ShareButton } from "@/components/ui/share-button"
import ArticleViewTracker from "@/components/analytics/ArticleViewTracker";
import ArticleViewCount from "@/components/analytics/ArticleViewCount";

interface ArticlePageProps {
  params: {
    slug: string
  }
}

// 时间字段安全转换
const parseDate = (d: any) => {
  if (!d) return undefined
  if (typeof d === "string" && d.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return new Date(d.replace(" ", "T") + "Z")
  }
  return new Date(d)
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const p = await params
  if (!p?.slug) {
    return { title: "文章未找到" }
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : ''}/api/articles/${p.slug}`)
  if (!res.ok) {
    return { title: "文章未找到" }
  }
  const data = await res.json()
  const article = data.data
  if (!article) {
    return { title: "文章未找到" }
  }
  // 字段补全
  article.publishedAt = parseDate(article.publishedAt || article.published_at)
  article.createdAt = parseDate(article.createdAt || article.created_at)
  article.updatedAt = parseDate(article.updatedAt || article.updated_at)
  article.author = {
    name: article.author_username || "匿名",
    id: article.author_username || "",
    avatar: "",
    role: "user"
  }
  return generateArticleMetadata(article)
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const p = await params
  if (!p?.slug) {
    notFound()
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : ''}/api/articles/${p.slug}`)
  if (!res.ok) {
    notFound()
  }
  const data = await res.json()
  const article = data.data
  if (!article) {
    notFound()
  }
  // 用文章的 author_username 字段去查用户详细信息（用户表的 username 字段）
  let authorDetail = null
  if (article.author_username) {
    try {
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : ''}/api/users/${article.author_username}`)
      if (userRes.ok) {
        const userData = await userRes.json()
        authorDetail = userData.data
      }
    } catch (e) {
      // 获取失败兜底
      authorDetail = null
    }
  }
  // 字段补全
  article.publishedAt = parseDate(article.publishedAt || article.published_at)
  article.createdAt = parseDate(article.createdAt || article.created_at)
  article.updatedAt = parseDate(article.updatedAt || article.updated_at)
  article.author = {
    name: authorDetail?.name || article.author_username || "匿名",
    id: article.author_username || "",
    avatar: authorDetail?.avatar_url || "",
    role: authorDetail?.role || "user"
  }
  const readingTime = Math.ceil((article.content?.length || 0) / 500)
  const initials = article.author?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || '?'
  // 面包屑导航数据
  const breadcrumbItems = [
    { name: "首页", url: "/" },
    { name: "文章", url: "/articles" },
    { name: article.category, url: `/categories/${article.category}` },
    { name: article.title, url: `/articles/${article.slug}` },
  ]

  // 新增：通过 Giscus 统计接口获取 like_count
  let giscusStats = { like_count: 0 }
  try {
    const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : ''}/api/giscus/stats?mapping=title&term=${encodeURIComponent(article.slug)}`)
    if (statsRes.ok) {
      const statsData = await statsRes.json()
      giscusStats.like_count = statsData.like_count || 0
    }
  } catch { }

  return (
    <>
      {article?.id && <ArticleViewTracker articleId={article.id} />}
      <ArticleStructuredData article={article} />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <ReadingProgress />
      <MainLayout>
        <PageContainer maxWidth="full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 主要内容 */}
            <div className="lg:col-span-3 space-y-8 relative">
              {/* 返回按钮 */}
              <Button asChild variant="ghost" className="mb-4">
                <Link href="/articles">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回文章列表
                </Link>
              </Button>
              {/* 文章头部 */}
              <div className="space-y-6">
                {/* 分类和标签 */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{article.category}</Badge>
                  {article.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {/* 标题 */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {article.title}
                </h1>
                {/* AI 摘要 */}
                {article.summary && (
                  <Card className="border-l-4 border-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-muted-foreground">AI 智能摘要</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {article.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {/* 作者信息和元数据 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-y">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={article.author?.avatar} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{article.author?.name}</span>
                        <Badge variant={article.author?.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                          {article.author?.role === 'admin' ? '管理员' : article.author?.role === 'collaborator' ? '协作者' : '用户'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(article.publishedAt || article.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {readingTime} 分钟阅读
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <ArticleViewCount articleId={article.id} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {giscusStats.like_count}
                      </div>
                    </div>
                    <ShareButton url={`${process.env.NEXTAUTH_URL || "http://127.0.0.1:3000"}/articles/${article.slug}`} title={article.title} />
                  </div>
                </div>
              </div>
              {/* 封面图片 */}
              {article.cover_image && (
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={article.cover_image}
                    alt={article.title}
                    fill
                    className="object-cover object-center"
                    priority
                  />
                </div>
              )}
              {/* 文章内容 */}
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <MarkdownRenderer content={article.content} />
              </div>
              {/* 文章底部装饰 */}
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-px bg-border"></div>
                  <span className="text-sm">文章结束</span>
                  <div className="w-8 h-px bg-border"></div>
                </div>
              </div>

              {/* 移动端作者信息卡片 - 在评论上面 */}
              <div className="lg:hidden">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Avatar className="h-16 w-16 mx-auto">
                        <AvatarImage src={article.author?.avatar} />
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{article.author?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {article.author?.role === 'admin' ? '管理员' : article.author?.role === 'collaborator' ? '协作者' : '用户'}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/articles?author_username=${article.author?.id}`}>
                          <User className="w-4 h-4 mr-2" />
                          查看更多文章
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 评论区 */}
              <SimpleGiscusComments mapping="specific" term={article.slug} />
            </div>
            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* 目录 - 统一组件，内部处理桌面端和移动端显示 */}
                <TableOfContents content={article.content} />
                {/* 作者信息卡片 - 只在桌面端显示 */}
                <Card className="hidden lg:block">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Avatar className="h-16 w-16 mx-auto">
                        <AvatarImage src={article.author?.avatar} />
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{article.author?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {article.author?.role === 'admin' ? '管理员' : article.author?.role === 'collaborator' ? '协作者' : '用户'}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/articles?author_username=${article.author?.id}`}>
                          <User className="w-4 h-4 mr-2" />
                          查看更多文章
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    </>
  )
}
