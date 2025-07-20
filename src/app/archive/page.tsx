import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

async function getArticles() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
  const res = await fetch(`${baseUrl}/api/articles`, { cache: "no-store" })
  const json = await res.json()
  if (!json.success) return []
  return json.data.filter((item: any) => item.status === "published")
}

function groupByYear(articles: any[]) {
  return articles.reduce((acc, article) => {
    const year = article.published_at ? new Date(article.published_at).getFullYear() : '未知';
    if (!acc[year]) acc[year] = []
    acc[year].push(article)
    return acc
  }, {} as Record<string, any[]>)
}

function groupByCategory(articles: any[]) {
  return articles.reduce((acc, article) => {
    const cat = article.category || '未分类'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(article)
    return acc
  }, {} as Record<string, any[]>)
}

export default async function ArchivePage() {
  const articles = await getArticles()
  const byYear = groupByYear(articles)
  const byCategory = groupByCategory(articles)

  return (
    <MainLayout>
      <PageContainer maxWidth="4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">归档</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">可按年份或分类浏览所有已发布文章</p>
          </div>
          <Tabs defaultValue="year" className="w-full">
            <TabsList className="flex justify-center mb-6">
              <TabsTrigger value="year">按年份分组</TabsTrigger>
              <TabsTrigger value="category">按分类分组</TabsTrigger>
            </TabsList>
            <TabsContent value="year">
              {Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map(year => (
                <Card key={year} className="mb-6">
                  <CardHeader>
                    <CardTitle>
                      <span className="text-2xl font-bold text-yellow-600">{year}年</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 font-bold text-gray-500">日期</th>
                            <th className="py-2 px-4 font-bold text-gray-500">标题</th>
                            <th className="py-2 px-4 font-bold text-gray-500">分类</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byYear[year].map((article: any) => (
                            <tr key={article.id} className="hover:bg-muted transition">
                              <td className="py-2 px-4 text-sm text-muted-foreground w-24">
                                {article.published_at ? format(new Date(article.published_at), 'MM-dd') : '--'}
                              </td>
                              <td className="py-2 px-4">
                                <a href={`/articles/${article.slug}`} className="font-medium hover:text-primary transition-colors">
                                  {article.title}
                                </a>
                              </td>
                              <td className="py-2 px-4">
                                {article.category && <Badge variant="outline">{article.category}</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="category">
              {Object.keys(byCategory).map(cat => (
                <Card key={cat} className="mb-6">
                  <CardHeader>
                    <CardTitle>
                      <span className="text-2xl font-bold text-blue-600">{cat}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 font-bold text-gray-500">日期</th>
                            <th className="py-2 px-4 font-bold text-gray-500">标题</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byCategory[cat].map((article: any) => (
                            <tr key={article.id} className="hover:bg-muted transition">
                              <td className="py-2 px-4 text-sm text-muted-foreground w-24">
                                {article.published_at ? format(new Date(article.published_at), 'yyyy-MM-dd') : '--'}
                              </td>
                              <td className="py-2 px-4">
                                <a href={`/articles/${article.slug}`} className="font-medium hover:text-primary transition-colors">
                                  {article.title}
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </MainLayout>
  )
} 