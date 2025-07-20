import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Palette } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  order_index: number
  created_at: string
  updated_at: string
  created_by?: string
}

interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  order_index: number
  created_at: string
  updated_at: string
  created_by?: string
}

export function CategoriesTagsManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })
  const [tagForm, setTagForm] = useState({
    name: '',
    description: '',
    color: '#10b981'
  })

  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '分类和标签管理',
      subtitle: '管理文章的分类和标签，组织内容结构',
      categories: '分类',
      tags: '标签',
      addCategory: '添加分类',
      addTag: '添加标签',
      editCategory: '编辑分类',
      editTag: '编辑标签',
      deleteCategory: '删除分类',
      deleteTag: '删除标签',
      name: '名称',
      description: '描述',
      color: '颜色',
      slug: '别名',
      order: '排序',
      actions: '操作',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirmDelete: '确认删除',
      categoryDeleteText: '确定要删除这个分类吗？此操作无法撤销。',
      tagDeleteText: '确定要删除这个标签吗？此操作无法撤销。',
      addCategorySuccess: '分类添加成功',
      updateCategorySuccess: '分类更新成功',
      deleteCategorySuccess: '分类删除成功',
      addTagSuccess: '标签添加成功',
      updateTagSuccess: '标签更新成功',
      deleteTagSuccess: '标签删除成功',
      loadError: '加载数据失败',
      saveError: '保存失败',
      deleteError: '删除失败',
      loading: '加载中...',
      noData: '暂无数据'
    }
    return translations[key] || key
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, tagsResponse] = await Promise.all([
        ApiClient.getCategories(),
        ApiClient.getTags()
      ])
      
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data.categories || categoriesResponse.data)
      }
      
      if (tagsResponse.success) {
        setTags(tagsResponse.data.tags || tagsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        const response = await ApiClient.updateCategory(editingCategory.id, categoryForm)
        if (response.success) {
          toast.success(t('updateCategorySuccess'))
          setIsCategoryDialogOpen(false)
          setEditingCategory(null)
          resetCategoryForm()
          loadData()
        } else {
          toast.error(t('saveError'))
        }
      } else {
        const response = await ApiClient.createCategory(categoryForm)
        if (response.success) {
          toast.success(t('addCategorySuccess'))
          setIsCategoryDialogOpen(false)
          resetCategoryForm()
          loadData()
        } else {
          toast.error(t('saveError'))
        }
      }
    } catch (error) {
      console.error('Failed to save category:', error)
      toast.error(t('saveError'))
    }
  }

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTag) {
        const response = await ApiClient.updateTag(editingTag.id, tagForm)
        if (response.success) {
          toast.success(t('updateTagSuccess'))
          setIsTagDialogOpen(false)
          setEditingTag(null)
          resetTagForm()
          loadData()
        } else {
          toast.error(t('saveError'))
        }
      } else {
        const response = await ApiClient.createTag(tagForm)
        if (response.success) {
          toast.success(t('addTagSuccess'))
          setIsTagDialogOpen(false)
          resetTagForm()
          loadData()
        } else {
          toast.error(t('saveError'))
        }
      }
    } catch (error) {
      console.error('Failed to save tag:', error)
      toast.error(t('saveError'))
    }
  }

  const handleCategoryDelete = async (id: string) => {
    try {
      const response = await ApiClient.deleteCategory(id)
      if (response.success) {
        toast.success(t('deleteCategorySuccess'))
        loadData()
      } else {
        toast.error(t('deleteError'))
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error(t('deleteError'))
    }
  }

  const handleTagDelete = async (id: string) => {
    try {
      const response = await ApiClient.deleteTag(id)
      if (response.success) {
        toast.success(t('deleteTagSuccess'))
        loadData()
      } else {
        toast.error(t('deleteError'))
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
      toast.error(t('deleteError'))
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3b82f6'
    })
  }

  const resetTagForm = () => {
    setTagForm({
      name: '',
      description: '',
      color: '#10b981'
    })
  }

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        color: category.color
      })
    } else {
      setEditingCategory(null)
      resetCategoryForm()
    }
    setIsCategoryDialogOpen(true)
  }

  const openTagDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag)
      setTagForm({
        name: tag.name,
        description: tag.description || '',
        color: tag.color
      })
    } else {
      setEditingTag(null)
      resetTagForm()
    }
    setIsTagDialogOpen(true)
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">{t('categories')}</TabsTrigger>
          <TabsTrigger value="tags">{t('tags')}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('categories')}</h3>
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addCategory')}
            </Button>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {category.description || '暂无描述'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {category.slug}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            排序: {category.order_index}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCategoryDialog(category)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {t('editCategory')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCategoryDelete(category.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('deleteCategory')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{t('noData')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('tags')}</h3>
            <Button onClick={() => openTagDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addTag')}
            </Button>
          </div>

          <div className="grid gap-4">
            {tags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <h4 className="font-medium">{tag.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {tag.description || '暂无描述'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tag.slug}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            排序: {tag.order_index}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTagDialog(tag)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {t('editTag')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTagDelete(tag.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('deleteTag')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tags.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{t('noData')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 分类对话框 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('editCategory') : t('addCategory')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? '编辑分类信息' : '添加新的分类'}
            </DialogDescription>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">{t('name')}</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">{t('description')}</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-color">{t('color')}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="category-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 标签对话框 */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? t('editTag') : t('addTag')}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? '编辑标签信息' : '添加新的标签'}
            </DialogDescription>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <form onSubmit={handleTagSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">{t('name')}</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-description">{t('description')}</Label>
              <Textarea
                id="tag-description"
                value={tagForm.description}
                onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">{t('color')}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="tag-color"
                  type="color"
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                  placeholder="#10b981"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTagDialogOpen(false)}>
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