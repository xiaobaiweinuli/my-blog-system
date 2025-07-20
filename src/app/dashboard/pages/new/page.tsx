'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NewPagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      const cacheStr = localStorage.getItem('global_session_cache')
      let token = ''
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pages`, {
        method: 'POST',
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
        alert(error.message || '创建页面失败')
      }
    } catch (error) {
      console.error('创建页面失败:', error)
      alert('创建页面失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">创建页面</h1>
          <p className="text-muted-foreground">创建新的独立页面</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/pages')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回页面列表
        </Button>
      </div>
      
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gray-50 border-b-2">
          <CardTitle className="text-xl font-bold text-gray-800">页面信息</CardTitle>
          <CardDescription className="text-gray-600 font-medium">填写新页面的详细信息</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">页面标题</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入页面标题，例如：关于我们"
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建页面'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
 