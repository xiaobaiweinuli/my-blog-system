'use client'
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Category {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export default function CategoryDashboardClient() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 提升fetchCategories到组件作用域
    const fetchCategories = async () => {
      const cacheStr = localStorage.getItem('global_session_cache')
      let token = ''
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      })
      const data = await res.json()
      const categories = (data.data || [])
      setCategories(categories)
      setLoading(false)
    }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 删除分类
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
      const res = await fetch(`${apiBase}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id))
      } else {
        const data = await res.json().catch(() => null)
        if (data && data.error && data.error.includes('existing articles')) {
          setDeleteError('该分类下还有文章，无法删除！')
        } else {
          setDeleteError('删除失败')
        }
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
    }
  }

  // 新建分类
  const handleCreateCategory = async () => {
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
      const res = await fetch(`${apiBase}/api/categories`, {
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
        await fetchCategories()
      } else {
        throw new Error('创建失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
    }
  }

  // 编辑分类
  const handleEditCategory = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    let token = ''
    const cacheStr = localStorage.getItem('global_session_cache')
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr)
        token = cache?.user?.token || ''
      } catch {}
    }
    if (!editingCategory) return
    try {
      const res = await fetch(`${apiBase}/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsEditDialogOpen(false)
        setEditingCategory(null)
        setFormData({ name: '', slug: '' })
        await fetchCategories()
      } else {
        throw new Error('编辑失败')
      }
    } catch (error) {
      console.error('编辑分类失败:', error)
    }
  }

  if (loading) return <div>加载中...</div>
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">分类管理</h1>
          <p className="text-muted-foreground">管理您的博客分类，创建、编辑和删除分类</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
            创建分类
        </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新分类</DialogTitle>
              <DialogDescription>创建一个新的分类</DialogDescription>
            </DialogHeader>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入分类名"
            />
            <Input
              id="slug"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              placeholder="请输入slug"
            />
            <DialogFooter>
              <Button onClick={handleCreateCategory}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6">
        {categories.map(category => (
          <Card key={category.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingCategory(category)
                    setFormData({ name: category.name, slug: category.slug })
                    setIsEditDialogOpen(true)
                  }}>
                    <Edit className="h-4 w-4" />
                          </Button>
                  <Button
  variant="destructive"
  size="sm"
  onClick={() => {
    if (category.id === 'cat_uncategorized') {
      alert('系统保留分类不可删除！')
      return
    }
    handleDelete(category.id)
  }}
  disabled={category.id === 'cat_uncategorized'}
>
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
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>编辑分类信息</DialogDescription>
          </DialogHeader>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入分类名"
          />
          <Input
            id="edit-slug"
            value={formData.slug}
            onChange={e => setFormData({ ...formData, slug: e.target.value })}
            placeholder="请输入slug"
          />
          <DialogFooter>
            <Button onClick={handleEditCategory}>保存</Button>
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