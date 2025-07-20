'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import ArticleDeleteButton from './ArticleDeleteButton'

export default function ArticleDashboardClient() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, archived: 0, viewCount: 0, addedThisMonth: 0 })
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      const cacheStr = localStorage.getItem('global_session_cache')
      let token = ''
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/articles?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      })
      const data = await res.json()
      const articles = (data.data || [])
      setArticles(articles)
      // 统计
      const published = articles.filter((a: any) => a.status === 'published').length
      const draft = articles.filter((a: any) => a.status === 'draft').length
      const archived = articles.filter((a: any) => a.status === 'archived').length
      const viewCount = articles.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0)
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const addedThisMonth = articles.filter((a: any) => {
        const d = new Date(a.created_at || '');
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      }).length;
      setStats({ total: published + draft + archived, published, draft, archived, viewCount, addedThisMonth })
      setLoading(false)
    }
    fetchArticles()
  }, [])

  // 删除文章并静默移除
  const handleDelete = async (id: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    let token = ''
    const cacheStr = localStorage.getItem('global_session_cache')
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr)
        token = cache?.user?.token || ''
      } catch {}
    }
    try {
      const res = await fetch(`${apiBase}/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id))
        setShowDeleteId(null)
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除文章失败:', error)
    }
  }

  if (loading) return <div>加载中...</div>
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文章管理</h1>
          <p className="text-muted-foreground">管理您的文章内容，创建、编辑和发布文章</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/articles/new">
            <Plus className="w-4 h-4 mr-2" />
            创建文章
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总文章数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">+{stats.addedThisMonth} 本月</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewCount}</div>
          </CardContent>
        </Card>
      </div>
      {/* 文章列表 */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gray-50 border-b-2">
          <CardTitle className="text-xl font-bold text-gray-800">文章列表</CardTitle>
          <CardDescription className="text-gray-600 font-medium">共找到 {stats.total} 篇文章</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                  <TableHead className="text-left font-bold text-gray-800 py-4">标题</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">作者</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">分类</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">状态</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">发布时间</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">浏览量</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article: any, index: number) => (
                  <TableRow 
                    key={article.id} 
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <TableCell className="text-left py-4 font-medium text-gray-900">{article.title}</TableCell>
                    <TableCell className="text-center py-4 text-gray-700">{article.author_username}</TableCell>
                    <TableCell className="text-center py-4 text-gray-700">{article.category}</TableCell>
                    <TableCell className="text-center py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' ? 'bg-green-100 text-green-800' :
                        article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {article.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4 text-gray-700">{article.published_at || '-'}</TableCell>
                    <TableCell className="text-center py-4 text-gray-700 font-medium">{article.view_count}</TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                        >
                          <Link href={`/dashboard/articles/${article.id}/edit`}>
                            <Edit className="w-4 h-4 mr-1" />
                            编辑
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                        >
                          <Link href={`/articles/${article.slug}`} target="_blank">
                            <Eye className="w-4 h-4 mr-1" />
                            预览
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteId(article.id)}
                          className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                      <ArticleDeleteButton 
                        open={showDeleteId === article.id} 
                        onOpenChange={(open) => setShowDeleteId(open ? article.id : null)} 
                        id={article.id} 
                        onDelete={() => handleDelete(article.id)} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
