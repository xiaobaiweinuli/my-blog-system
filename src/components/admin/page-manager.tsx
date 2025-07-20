'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { ApiClient, ApiError } from '@/lib/api-client'
import { toast } from 'sonner'

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
  created_by: string
}

export function PageManager() {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '页面管理',
      addPage: '添加页面',
      search: '搜索页面...',
      name: '标题',
      slug: '别名',
      status: '状态',
      template: '模板',
      menu: '菜单',
      actions: '操作',
      edit: '编辑',
      delete: '删除',
      view: '查看',
      save: '保存',
      cancel: '取消',
      deleteConfirm: '确定要删除这个页面吗？',
      deleteSuccess: '页面删除成功',
      deleteError: '删除失败',
      saveSuccess: '保存成功',
      saveError: '保存失败',
      loadError: '加载失败',
      noPages: '暂无页面',
      loading: '加载中...',
      draft: '草稿',
      published: '已发布',
      private: '私有',
      default: '默认',
      contact: '联系',
      about: '关于',
      inMenu: '在菜单中',
      notInMenu: '不在菜单中',
    }
    return translations[key] || key
  }

  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPage, setDeletingPage] = useState<Page | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    status: 'draft' as 'draft' | 'published' | 'private',
    template: 'default',
    is_in_menu: false,
    menu_title: '',
  })

  // 加载页面数据
  useEffect(() => {
    const loadPages = async () => {
      setLoading(true)
      try {
        const response = await ApiClient.getPages()
        if (response.success) {
          setPages(response.data.pages)
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

    loadPages()
  }, [])

  // 过滤页面
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 重置表单
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
      is_in_menu: false,
      menu_title: '',
    })
    setEditingPage(null)
  }

  // 生成slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // 处理表单变化
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'title') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value as string) }))
    }
  }

  // 打开添加对话框
  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (page: Page) => {
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      status: page.status,
      template: page.template,
      is_in_menu: page.is_in_menu,
      menu_title: page.menu_title || '',
    })
    setEditingPage(page)
    setDialogOpen(true)
  }

  // 保存页面
  const handleSave = async () => {
    try {
      if (editingPage) {
        // 更新页面
        const response = await ApiClient.updatePage(editingPage.id, formData)
        if (response.success) {
          setPages(prev => prev.map(page => 
            page.id === editingPage.id ? response.data.page : page
          ))
          toast.success(t('saveSuccess'))
        }
      } else {
        // 创建新页面
        const response = await ApiClient.createPage(formData)
        if (response.success) {
          setPages(prev => [response.data.page, ...prev])
          toast.success(t('saveSuccess'))
        }
      }
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Save page error:', error)
      toast.error(t('saveError'))
    }
  }

  // 删除页面
  const handleDelete = async () => {
    if (!deletingPage) return

    try {
      const response = await ApiClient.deletePage(deletingPage.id)
      if (response.success) {
        setPages(prev => prev.filter(page => page.id !== deletingPage.id))
        toast.success(t('deleteSuccess'))
      } else {
        toast.error(t('deleteError'))
      }
    } catch (error) {
      console.error('Delete page error:', error)
      toast.error(t('deleteError'))
    } finally {
      setDeleteDialogOpen(false)
      setDeletingPage(null)
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return t('published')
      case 'private':
        return t('private')
      default:
        return t('draft')
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'private':
        return 'secondary'
      default:
        return 'outline'
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
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addPage')}
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('noPages')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('template')}</TableHead>
                  <TableHead>{t('menu')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{page.title}</div>
                        {page.excerpt && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {page.excerpt}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{page.slug}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(page.status)}>
                        {getStatusText(page.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{page.template}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {page.is_in_menu ? (
                          <>
                            <Eye className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{page.menu_title || page.title}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{t('notInMenu')}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(page)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingPage(page)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? t('edit') : t('addPage')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">{t('name')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="slug">{t('slug')}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleFormChange('content', e.target.value)}
                rows={10}
                placeholder="使用 Markdown 格式编写内容..."
              />
            </div>

            <div>
              <Label htmlFor="excerpt">摘要</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleFormChange('excerpt', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meta_title">SEO 标题</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleFormChange('meta_title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">{t('status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleFormChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('draft')}</SelectItem>
                    <SelectItem value="published">{t('published')}</SelectItem>
                    <SelectItem value="private">{t('private')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="meta_description">SEO 描述</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => handleFormChange('meta_description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template">{t('template')}</Label>
                <Select
                  value={formData.template}
                  onValueChange={(value) => handleFormChange('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t('default')}</SelectItem>
                    <SelectItem value="contact">{t('contact')}</SelectItem>
                    <SelectItem value="about">{t('about')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="menu_title">菜单标题</Label>
                <Input
                  id="menu_title"
                  value={formData.menu_title}
                  onChange={(e) => handleFormChange('menu_title', e.target.value)}
                  placeholder="留空使用页面标题"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_in_menu"
                checked={formData.is_in_menu}
                onCheckedChange={(checked) => handleFormChange('is_in_menu', checked)}
              />
              <Label htmlFor="is_in_menu">{t('inMenu')}</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSave}>
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <p>{t('deleteConfirm')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
