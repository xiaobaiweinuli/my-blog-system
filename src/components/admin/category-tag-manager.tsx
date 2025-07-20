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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Hash, Folder } from 'lucide-react'
import { ApiClient, ApiError } from '@/lib/api-client'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  articleCount: number
  createdAt: string
  updatedAt: string
}

interface TagItem {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  articleCount: number
  createdAt: string
  updatedAt: string
}

export function CategoryTagManager() {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '分类和标签管理',
      categories: '分类',
      tags: '标签',
      addCategory: '添加分类',
      addTag: '添加标签',
      search: '搜索...',
      name: '名称',
      slug: '别名',
      description: '描述',
      color: '颜色',
      articleCount: '文章数',
      actions: '操作',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      deleteConfirm: '确定要删除这个项目吗？',
      deleteSuccess: '删除成功',
      deleteError: '删除失败',
      saveSuccess: '保存成功',
      saveError: '保存失败',
      loadError: '加载失败',
      noCategories: '暂无分类',
      noTags: '暂无标签',
      loading: '加载中...',
    }
    return translations[key] || key
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('categories')

  // 对话框状态
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingTag, setEditingTag] = useState<TagItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'tag'; item: Category | TagItem } | null>(null)

  // 表单状态
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
  })

  const [tagForm, setTagForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#10b981',
  })

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          ApiClient.getCategories(),
          ApiClient.getTags(),
        ])

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data.categories)
        } else {
          toast.error(t('loadError'))
        }

        if (tagsResponse.success) {
          setTags(tagsResponse.data.tags)
        } else {
          toast.error(t('loadError'))
        }
      } catch (error) {
        console.error('Failed to load categories and tags:', error)
        toast.error(t('loadError'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 过滤数据
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 重置表单
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
    })
    setEditingCategory(null)
  }

  const resetTagForm = () => {
    setTagForm({
      name: '',
      slug: '',
      description: '',
      color: '#10b981',
    })
    setEditingTag(null)
  }

  // 生成slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // 处理分类表单变化
  const handleCategoryFormChange = (field: string, value: string) => {
    setCategoryForm(prev => ({ ...prev, [field]: value }))
    if (field === 'name') {
      setCategoryForm(prev => ({ ...prev, slug: generateSlug(value) }))
    }
  }

  // 处理标签表单变化
  const handleTagFormChange = (field: string, value: string) => {
    setTagForm(prev => ({ ...prev, [field]: value }))
    if (field === 'name') {
      setTagForm(prev => ({ ...prev, slug: generateSlug(value) }))
    }
  }

  // 打开添加分类对话框
  const handleAddCategory = () => {
    resetCategoryForm()
    setCategoryDialogOpen(true)
  }

  // 打开编辑分类对话框
  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
    })
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  // 保存分类
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        // 更新分类
        const response = await ApiClient.updateCategory(editingCategory.id, categoryForm)
        if (response.success) {
          setCategories(prev => prev.map(cat => 
            cat.id === editingCategory.id ? response.data.category : cat
          ))
          toast.success(t('saveSuccess'))
        }
      } else {
        // 创建新分类
        const response = await ApiClient.createCategory(categoryForm)
        if (response.success) {
          setCategories(prev => [response.data.category, ...prev])
          toast.success(t('saveSuccess'))
        }
      }
      setCategoryDialogOpen(false)
      resetCategoryForm()
    } catch (error) {
      console.error('Save category error:', error)
      toast.error(t('saveError'))
    }
  }

  // 打开添加标签对话框
  const handleAddTag = () => {
    resetTagForm()
    setTagDialogOpen(true)
  }

  // 打开编辑标签对话框
  const handleEditTag = (tag: TagItem) => {
    setTagForm({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || '',
      color: tag.color,
    })
    setEditingTag(tag)
    setTagDialogOpen(true)
  }

  // 保存标签
  const handleSaveTag = async () => {
    try {
      if (editingTag) {
        // 更新标签
        const response = await ApiClient.updateTag(editingTag.id, tagForm)
        if (response.success) {
          setTags(prev => prev.map(tag => 
            tag.id === editingTag.id ? response.data.tag : tag
          ))
          toast.success(t('saveSuccess'))
        }
      } else {
        // 创建新标签
        const response = await ApiClient.createTag(tagForm)
        if (response.success) {
          setTags(prev => [response.data.tag, ...prev])
          toast.success(t('saveSuccess'))
        }
      }
      setTagDialogOpen(false)
      resetTagForm()
    } catch (error) {
      console.error('Save tag error:', error)
      toast.error(t('saveError'))
    }
  }

  // 删除项目
  const handleDelete = async () => {
    if (!deletingItem) return

    try {
      if (deletingItem.type === 'category') {
        const response = await ApiClient.deleteCategory(deletingItem.item.id)
        if (response.success) {
          setCategories(prev => prev.filter(cat => cat.id !== deletingItem.item.id))
          toast.success(t('deleteSuccess'))
        }
      } else {
        const response = await ApiClient.deleteTag(deletingItem.item.id)
        if (response.success) {
          setTags(prev => prev.filter(tag => tag.id !== deletingItem.item.id))
          toast.success(t('deleteSuccess'))
        }
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(t('deleteError'))
    } finally {
      setDeleteDialogOpen(false)
      setDeletingItem(null)
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            {t('categories')}
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            {t('tags')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addCategory')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('categories')}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('noCategories')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('slug')}</TableHead>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead>{t('color')}</TableHead>
                      <TableHead>{t('articleCount')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.slug}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-mono">{category.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{category.articleCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingItem({ type: 'category', item: category })
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
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleAddTag}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addTag')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tags')}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTags.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('noTags')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('slug')}</TableHead>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead>{t('color')}</TableHead>
                      <TableHead>{t('articleCount')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tag.slug}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tag.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm font-mono">{tag.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tag.articleCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTag(tag)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingItem({ type: 'tag', item: tag })
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
        </TabsContent>
      </Tabs>

      {/* 分类对话框 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('edit') : t('addCategory')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">{t('name')}</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => handleCategoryFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-slug">{t('slug')}</Label>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(e) => handleCategoryFormChange('slug', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-description">{t('description')}</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => handleCategoryFormChange('description', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-color">{t('color')}</Label>
              <Input
                id="category-color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => handleCategoryFormChange('color', e.target.value)}
                className="h-12"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSaveCategory}>
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 标签对话框 */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? t('edit') : t('addTag')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">{t('name')}</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) => handleTagFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tag-slug">{t('slug')}</Label>
              <Input
                id="tag-slug"
                value={tagForm.slug}
                onChange={(e) => handleTagFormChange('slug', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tag-description">{t('description')}</Label>
              <Textarea
                id="tag-description"
                value={tagForm.description}
                onChange={(e) => handleTagFormChange('description', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tag-color">{t('color')}</Label>
              <Input
                id="tag-color"
                type="color"
                value={tagForm.color}
                onChange={(e) => handleTagFormChange('color', e.target.value)}
                className="h-12"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSaveTag}>
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
