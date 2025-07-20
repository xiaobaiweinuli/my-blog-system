import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'

interface FriendLink {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  order_index: number
  is_featured: boolean
  contact_email?: string
  created_at: string
  updated_at: string
  approved_at?: string
  created_by?: string
  approved_by?: string
}

export function FriendLinksManager() {
  const [links, setLinks] = useState<FriendLink[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'friend',
    contact_email: ''
  })

  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '友情链接管理',
      subtitle: '管理网站的友情链接，包括添加、编辑和审核链接',
      addLink: '添加链接',
      editLink: '编辑链接',
      deleteLink: '删除链接',
      approveLink: '审核通过',
      rejectLink: '拒绝链接',
      name: '名称',
      url: '网址',
      description: '描述',
      category: '分类',
      contactEmail: '联系邮箱',
      status: '状态',
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      featured: '推荐',
      notFeatured: '普通',
      actions: '操作',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirmDelete: '确认删除',
      deleteConfirmText: '确定要删除这个友情链接吗？此操作无法撤销。',
      addSuccess: '友情链接添加成功',
      updateSuccess: '友情链接更新成功',
      deleteSuccess: '友情链接删除成功',
      approveSuccess: '友情链接审核通过',
      rejectSuccess: '友情链接已拒绝',
      loadError: '加载友情链接失败',
      saveError: '保存友情链接失败',
      deleteError: '删除友情链接失败',
      approveError: '审核操作失败',
      tech: '技术',
      blog: '博客',
      friend: '朋友',
      other: '其他',
      loading: '加载中...',
      noData: '暂无数据'
    }
    return translations[key] || key
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    try {
      setLoading(true)
      const response = await ApiClient.getFriendLinks()
      if (response.success) {
        setLinks(response.data.links || response.data)
      } else {
        toast.error(t('loadError'))
      }
    } catch (error) {
      console.error('Failed to load friend links:', error)
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingLink) {
        const response = await ApiClient.updateFriendLink(editingLink.id, formData)
        if (response.success) {
          toast.success(t('updateSuccess'))
          setIsDialogOpen(false)
          setEditingLink(null)
          resetForm()
          loadLinks()
        } else {
          toast.error(t('saveError'))
        }
      } else {
        const response = await ApiClient.createFriendLink(formData)
        if (response.success) {
          toast.success(t('addSuccess'))
          setIsDialogOpen(false)
          resetForm()
          loadLinks()
        } else {
          toast.error(t('saveError'))
        }
      }
    } catch (error) {
      console.error('Failed to save friend link:', error)
      toast.error(t('saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await ApiClient.deleteFriendLink(id)
      if (response.success) {
        toast.success(t('deleteSuccess'))
        loadLinks()
      } else {
        toast.error(t('deleteError'))
      }
    } catch (error) {
      console.error('Failed to delete friend link:', error)
      toast.error(t('deleteError'))
    }
  }

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // 使用通用的request方法进行状态更新
      const response = await fetch(`/api/friend-links/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        toast.success(status === 'approved' ? t('approveSuccess') : t('rejectSuccess'))
        loadLinks()
      } else {
        toast.error(t('approveError'))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error(t('approveError'))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      category: 'friend',
      contact_email: ''
    })
  }

  const openEditDialog = (link: FriendLink) => {
    setEditingLink(link)
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description,
      category: link.category,
      contact_email: link.contact_email || ''
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingLink(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'tech':
        return t('tech')
      case 'blog':
        return t('blog')
      case 'friend':
        return t('friend')
      default:
        return t('other')
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
          {t('addLink')}
        </Button>
      </div>

      <div className="grid gap-4">
        {links.map((link) => (
          <Card key={link.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {link.avatar && (
                    <img
                      src={link.avatar}
                      alt={link.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{link.name}</h3>
                      {getStatusIcon(link.status)}
                      <Badge variant={link.status === 'approved' ? 'default' : link.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {t(link.status)}
                      </Badge>
                      {link.is_featured && (
                        <Badge variant="outline">{t('featured')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{link.url}</span>
                      </a>
                      <span>{getCategoryText(link.category)}</span>
                      {link.contact_email && (
                        <span>{link.contact_email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {link.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(link.id, 'approved')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('approveLink')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(link.id, 'rejected')}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('rejectLink')}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(link)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {t('editLink')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t('deleteLink')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {links.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('noData')}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? t('editLink') : t('addLink')}
            </DialogTitle>
            <DialogDescription>
              {editingLink ? '编辑友情链接信息' : '添加新的友情链接'}
            </DialogDescription>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t('category')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">{t('tech')}</SelectItem>
                    <SelectItem value="blog">{t('blog')}</SelectItem>
                    <SelectItem value="friend">{t('friend')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">{t('url')}</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">{t('contactEmail')}</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
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