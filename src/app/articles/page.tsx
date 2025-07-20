import { Suspense } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { ArticleCard } from "@/components/ui/article-card"
import { ArticleCardSkeleton } from "@/components/ui/loading"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { WebsiteStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data"
import { generateBaseMetadata } from "@/lib/seo"
import type { Metadata } from "next"
import ClientGiscusComments from "@/components/comments/client-giscus-comments";
import ClientShareButton from "@/components/ui/client-share-button";

interface ArticlesPageProps {
  searchParams: {
    page?: string
    search?: string
    category?: string
    tag?: string
    author_username?: string
  }
}

export const revalidate = 60;

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const params = await searchParams
  const { search, category, tag } = params

  let title = "文章列表"
  let description = "探索我们精心整理的技术文章和经验分享"
  let keywords = ["文章", "博客", "技术", "分享"]

  if (search) {
    title = `搜索: ${search}`
    description = `搜索 \"${search}\" 的文章结果`
    keywords.push(search)
  } else if (category) {
    title = `${category} 分类文章`
    description = `查看 ${category} 分类下的所有文章`
    keywords.push(category)
  } else if (tag) {
    title = `${tag} 标签文章`
    description = `查看包含 ${tag} 标签的所有文章`
    keywords.push(tag)
  }

  return generateBaseMetadata({
    title,
    description,
    keywords,
  })
}

// 生成或获取唯一 visitor_id，并持久化到 localStorage
function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return '';
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    if (window.crypto?.randomUUID) {
      visitorId = window.crypto.randomUUID();
    } else {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const category = params.category === "all" ? "" : params.category || ""
  const tag = params.tag || ""
  const author_username = params.author_username || ""
  const query = new URLSearchParams({
    page: String(page),
    search,
    category,
    tag,
    author_username,
  }).toString()

  // 仅在浏览器端执行 visitor_id 逻辑
  if (typeof window !== 'undefined') {
    getOrCreateVisitorId();
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : ''}/api/articles?${query}`, {
    cache: 'no-store',
    next: { revalidate: 60 },
  })
  const data = await res.json()
  // 获取用户列表，建立 username -> avatar_url 映射
  let userMap: Record<string, any> = {}
  try {
    //console.log('fetching users...')
    const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : ''}/api/users`, { next: { revalidate: 60 } })
    const usersData = await usersRes.json()
    //console.log('usersData:', usersData)
    const users = usersData.data?.items || usersData.data || []
    //console.log('users array:', users)
    userMap = Object.fromEntries(users.map((u: any) => [u.username, u]))
    //console.log('userMap:', userMap)
  } catch (e) {
    //console.log('fetch users error:', e)
    userMap = {}
  }

  // 兼容各种时间格式的安全转换
  const parseDate = (d: any) => {
    if (!d) return undefined
    if (typeof d === "string" && d.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      return new Date(d.replace(" ", "T") + "Z")
    }
    return new Date(d)
  }

  const articles = (data.data || []).map((article: any) => {
    const user = userMap[article.author_username] || {}
    return {
      ...article,
      coverImage: article.coverImage || article.cover_image || "",
      tags: Array.isArray(article.tags) ? article.tags : [],
      publishedAt: parseDate(article.publishedAt || article.published_at),
      createdAt: parseDate(article.createdAt || article.created_at),
      updatedAt: parseDate(article.updatedAt || article.updated_at),
      author: {
        name: user.name || article.author_username || "匿名",
        avatar: user.avatar_url || "",
        role: user.role || "user",
      },
      viewCount: article.view_count ?? 0,
      likeCount: article.like_count ?? 0,
    }
  })
  const pagination = data.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // 面包屑导航数据
  const breadcrumbItems = [
    { name: "首页", url: "/" },
    { name: "文章", url: "/articles" },
  ]
  if (category) {
    breadcrumbItems.push({ name: category, url: `/categories/${category}` })
  }
  if (tag) {
    breadcrumbItems.push({ name: tag, url: `/tags/${tag}` })
  }

  return (
    <>
      <WebsiteStructuredData />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <MainLayout>
        <PageContainer maxWidth="full">
          <div className="space-y-8">
            {/* 页面标题 */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">文章列表</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                探索我们精心整理的技术文章和经验分享
              </p>
            </div>
            {/* 文章列表 */}
            <Suspense fallback={
              <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </ResponsiveGrid>
            }>
              {articles.length > 0 ? (
                <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
                  {articles.map((article: any, index: number) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant={index === 0 ? "featured" : "default"}
                    />
                  ))}
                </ResponsiveGrid>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold mb-2">暂无文章</h3>
                  <p className="text-muted-foreground">
                    {search || category || tag
                      ? "没有找到符合条件的文章，请尝试其他搜索条件"
                      : "还没有发布任何文章"}
                  </p>
                </div>
              )}
            </Suspense>
            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                >
                  上一页
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        </PageContainer>
      </MainLayout>
    </>
  )
}
