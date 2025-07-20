 'use client'
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export default function TagDashboardClient() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 提升fetchTags到组件作用域
  const fetchTags = async () => {
    const cacheStr = localStorage.getItem('global_session_cache')
    let token = ''
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr)
        token = cache?.user?.token || ''
      } catch {}
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tags`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include'
    })
    const data = await res.json()
    const tags = (data.data || [])
    setTags(tags)
    setLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [])

  // 删除标签
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
      const res = await fetch(`${apiBase}/api/tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        setTags(prev => prev.filter(t => t.id !== id))
      } else {
        const data = await res.json().catch(() => null)
        if (data && data.error && data.error.includes('existing articles')) {
          setDeleteError('该标签下还有文章，无法删除！')
        } else {
          setDeleteError('删除失败')
        }
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除标签失败:', error)
    }
  }

  // 新建标签
  const handleCreateTag = async () => {
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
      const res = await fetch(`${apiBase}/api/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsDialogOpen(false)
        setFormData({ name: '', slug: '' })
        await fetchTags()
      } else {
        throw new Error('创建失败')
      }
    } catch (error) {
      console.error('创建标签失败:', error)
    }
  }

  // 编辑标签
  const handleEditTag = async () => {
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
      const res = await fetch(`${apiBase}/api/tags/${editingTag?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsEditDialogOpen(false)
        setEditingTag(null)
        setFormData({ name: '', slug: '' })
        await fetchTags()
      } else {
        throw new Error('编辑失败')
      }
    } catch (error) {
      console.error('编辑标签失败:', error)
    }
  }

  if (loading) return <div>加载中...</div>
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">标签管理</h1>
          <p className="text-muted-foreground">管理您的博客标签，创建、编辑和删除标签</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建标签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新标签</DialogTitle>
              <DialogDescription>创建一个新的标签</DialogDescription>
            </DialogHeader>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入标签名"
            />
            <Input
              id="slug"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              placeholder="请输入slug"
            />
            <DialogFooter>
              <Button onClick={handleCreateTag}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6">
        {tags.map(tag => (
          <Card key={tag.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{tag.name}</h3>
                  <p className="text-sm text-muted-foreground">{tag.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingTag(tag)
                    setFormData({ name: tag.name, slug: tag.slug })
                    setIsEditDialogOpen(true)
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
            <DialogDescription>编辑标签信息</DialogDescription>
          </DialogHeader>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入标签名"
          />
          <Input
            id="edit-slug"
            value={formData.slug}
            onChange={e => setFormData({ ...formData, slug: e.target.value })}
            placeholder="请输入slug"
          />
          <DialogFooter>
            <Button onClick={handleEditTag}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 错误弹窗 */}
      <Dialog open={!!deleteError} onOpenChange={() => setDeleteError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>操作提示</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {deleteError}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setDeleteError(null)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
