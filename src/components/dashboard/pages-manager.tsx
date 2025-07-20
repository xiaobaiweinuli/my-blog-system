import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'

interface Page {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  meta_title?: string
  meta_description?: string
  status: 'draft' | 'published' | 'private'
  template: string
  order_index: number
  is_in_menu: boolean
  menu_title?: string
  parent_id?: string
  created_at: string
  updated_at: string
  published_at?: string
  created_by?: string
}

export function PagesManager() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    status: 'draft' as 'draft' | 'published' | 'private',
    template: 'default',
    order_index: 0,
    is_in_menu: false,
    menu_title: ''
  })

  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '页面管理',
      subtitle: '管理网站的静态页面',
      addPage: '添加页面',
      editPage: '编辑页面',
      deletePage: '删除页面',
      previewPage: '预览页面',
      pageTitle: '标题',
      slug: '别名',
      content: '内容',
      excerpt: '摘要',
      metaTitle: 'SEO标题',
      metaDescription: 'SEO描述',
      status: '状态',
      template: '模板',
      orderIndex: '排序',
      isInMenu: '显示在菜单',
      menuTitle: '菜单标题',
      draft: '草稿',
      published: '已发布',
      private: '私有',
      actions: '操作',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirmDelete: '确认删除',
      deleteConfirmText: '确定要删除这个页面吗？此操作无法撤销。',
      addSuccess: '页面添加成功',
      updateSuccess: '页面更新成功',
      deleteSuccess: '页面删除成功',
      loadError: '加载页面列表失败',
      saveError: '保存页面失败',
      deleteError: '删除页面失败',
      loading: '加载中...',
      noData: '暂无页面'
    }
    return translations[key] || key
  }

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      setLoading(true)
      const response = await ApiClient.getPages()
      if (response.success) {
        setPages(response.data.pages || response.data)
      } else {
        toast.error(t('loadError'))
      }
    } catch (error) {
      console.error('Failed to load pages:', error)
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingPage) {
        const response = await ApiClient.updatePage(editingPage.id, formData)
        if (response.success) {
          toast.success(t('updateSuccess'))
          setIsDialogOpen(false)
          setEditingPage(null)
          resetForm()
          loadPages()
        } else {
          toast.error(t('saveError'))
        }
      } else {
        const response = await ApiClient.createPage(formData)
        if (response.success) {
          toast.success(t('addSuccess'))
          setIsDialogOpen(false)
          resetForm()
          loadPages()
        } else {
          toast.error(t('saveError'))
        }
      }
    } catch (error) {
      console.error('Failed to save page:', error)
      toast.error(t('saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await ApiClient.deletePage(id)
      if (response.success) {
        toast.success(t('deleteSuccess'))
        loadPages()
      } else {
        toast.error(t('deleteError'))
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
      toast.error(t('deleteError'))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      meta_title: '',
      meta_description: '',
      status: 'draft',
      template: 'default',
      order_index: 0,
      is_in_menu: false,
      menu_title: ''
    })
  }

  const openEditDialog = (page: Page) => {
    setEditingPage(page)
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      status: page.status,
      template: page.template,
      order_index: page.order_index,
      is_in_menu: page.is_in_menu,
      menu_title: page.menu_title || ''
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingPage(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">{t('published')}</Badge>
      case 'draft':
        return <Badge variant="secondary">{t('draft')}</Badge>
      case 'private':
        return <Badge variant="outline">{t('private')}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addPage')}
        </Button>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{page.title}</h3>
                    {getStatusBadge(page.status)}
                    {page.is_in_menu && (
                      <Badge variant="outline">菜单</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {page.excerpt || '暂无摘要'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>别名: {page.slug}</span>
                    <span>模板: {page.template}</span>
                    <span>排序: {page.order_index}</span>
                    <span>更新时间: {new Date(page.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/${page.slug}`, '_blank')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {t('previewPage')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(page)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {t('editPage')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(page.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t('deletePage')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('noData')}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? t('editPage') : t('addPage')}
            </DialogTitle>
            <DialogDescription>
              {editingPage ? '编辑页面信息' : '添加新的页面'}
            </DialogDescription>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page-title">{t('pageTitle')}</Label>
                <Input
                  id="page-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-slug">{t('slug')}</Label>
                <Input
                  id="page-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-content">{t('content')}</Label>
              <Textarea
                id="page-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-excerpt">{t('excerpt')}</Label>
              <Textarea
                id="page-excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page-meta-title">{t('metaTitle')}</Label>
                <Input
                  id="page-meta-title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-status">{t('status')}</Label>
                <select
                  id="page-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="draft">{t('draft')}</option>
                  <option value="published">{t('published')}</option>
                  <option value="private">{t('private')}</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-meta-description">{t('metaDescription')}</Label>
              <Textarea
                id="page-meta-description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page-template">{t('template')}</Label>
                <Input
                  id="page-template"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-order">{t('orderIndex')}</Label>
                <Input
                  id="page-order"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-menu-title">{t('menuTitle')}</Label>
                <Input
                  id="page-menu-title"
                  value={formData.menu_title}
                  onChange={(e) => setFormData({ ...formData, menu_title: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="page-menu"
                type="checkbox"
                checked={formData.is_in_menu}
                onChange={(e) => setFormData({ ...formData, is_in_menu: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="page-menu">{t('isInMenu')}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 