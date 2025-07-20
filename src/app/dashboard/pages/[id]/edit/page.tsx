'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Page {
  id: string
  title: string
  content: string
  slug: string
  created_at: string
  updated_at: string
}

export default function EditPagePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState<Page | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })

  // 获取页面数据
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const cacheStr = localStorage.getItem('global_session_cache')
        let token = ''
        if (cacheStr) {
          try {
            const cache = JSON.parse(cacheStr)
            token = cache?.user?.token || ''
          } catch (e) {
            console.error('解析用户缓存失败:', e)
          }
        }
        
        const pageId = params.id as string
        if (!pageId) {
          setError('页面ID无效')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pages/${pageId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setPage(data.data)
          setFormData({
            title: data.data.title,
            content: data.data.content
          })
        } else {
          setError('获取页面失败')
        }
      } catch (error) {
        console.error('获取页面失败:', error)
        setError('网络错误或服务器异常')
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [params.id])

  // 处理保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!page || !formData.title.trim() || !formData.content.trim()) {
      alert('请填写完整信息')
      return
    }

    setSaving(true)
    try {
      const cacheStr = localStorage.getItem('global_session_cache')
      let token = ''
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/dashboard/pages')
      } else {
        const error = await response.json()
        alert(error.message || '更新页面失败')
      }
    } catch (error) {
      console.error('更新页面失败:', error)
      alert('更新页面失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载页面数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">加载失败</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/pages')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回页面列表
          </Button>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">页面不存在</h2>
          <p className="mt-2 text-muted-foreground">无法找到请求的页面</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/pages')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回页面列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">编辑页面</h1>
          <p className="text-muted-foreground">编辑页面信息</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/pages')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回页面列表
        </Button>
      </div>
      
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gray-50 border-b-2">
          <CardTitle className="text-xl font-bold text-gray-800">页面信息</CardTitle>
          <CardDescription className="text-gray-600 font-medium">修改页面的详细信息</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">页面标题</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入页面标题，例如：关于我们"
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">页面内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="输入页面内容，支持Markdown格式"
                rows={15}
                required
                disabled={saving}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存页面'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
 