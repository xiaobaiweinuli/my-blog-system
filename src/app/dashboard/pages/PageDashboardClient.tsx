'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import PageDeleteButton from './PageDeleteButton'

interface Page {
  id: string
  title: string
  content: string
  slug: string
  created_at: string
  updated_at: string
}

export default function PageDashboardClient() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPages = async () => {
      const cacheStr = localStorage.getItem('global_session_cache')
      let token = ''
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      })
      const data = await res.json()
      const pages = (data.data || [])
      setPages(pages)
      setLoading(false)
    }
    fetchPages()
  }, [])

  // 删除页面并静默移除
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
      const res = await fetch(`${apiBase}/api/pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== id))
        setShowDeleteId(null)
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除页面失败:', error)
    }
  }

  if (loading) return <div>加载中...</div>
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">页面管理</h1>
          <p className="text-muted-foreground">管理您的独立页面，创建、编辑和删除页面</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pages/new">
            <Plus className="w-4 h-4 mr-2" />
            创建页面
          </Link>
        </Button>
      </div>
      
      {/* 页面列表 */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gray-50 border-b-2">
          <CardTitle className="text-xl font-bold text-gray-800">页面列表</CardTitle>
          <CardDescription className="text-gray-600 font-medium">共找到 {pages.length} 个页面</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                  <TableHead className="text-left font-bold text-gray-800 py-4">标题</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">Slug</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">创建时间</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">更新时间</TableHead>
                  <TableHead className="text-center font-bold text-gray-800 py-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      暂无页面。点击"创建页面"按钮添加第一个页面。
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((page, index) => (
                    <TableRow
                      key={page.id}
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } border-b border-gray-200 hover:bg-gray-100 transition-colors`}
                    >
                      <TableCell className="text-left font-medium text-gray-900 py-4">{page.title}</TableCell>
                      <TableCell className="text-center text-gray-700 py-4">{page.slug}</TableCell>
                      <TableCell className="text-center text-gray-700 py-4">
                        {new Date(page.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-gray-700 py-4">
                        {new Date(page.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                          >
                            <Link href={`/dashboard/pages/${page.id}/edit`}>
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
                            <Link href={`/pages/${page.slug}`} target="_blank">
                              <Eye className="w-4 h-4 mr-1" />
                              预览
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteId(page.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </Button>
                        </div>
                        <PageDeleteButton 
                          open={showDeleteId === page.id} 
                          onOpenChange={(open) => setShowDeleteId(open ? page.id : null)} 
                          id={page.id} 
                          onDelete={() => handleDelete(page.id)} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 