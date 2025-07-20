'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ApiClient, ApiError } from '@/lib/api-client'
import { toast } from 'sonner'

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
}

export function FriendLinksManager() {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '友情链接管理',
      addLink: '添加链接',
      search: '搜索链接...',
      name: '名称',
      url: '网址',
      description: '描述',
      category: '分类',
      status: '状态',
      actions: '操作',
      edit: '编辑',
      delete: '删除',
      approve: '通过',
      reject: '拒绝',
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      featured: '推荐',
      notFeatured: '普通',
      tech: '技术',
      blog: '博客',
      friend: '朋友',
      other: '其他',
      save: '保存',
      cancel: '取消',
      deleteConfirm: '确定要删除这个链接吗？',
      deleteSuccess: '链接删除成功',
      deleteError: '删除失败',
      saveSuccess: '保存成功',
      saveError: '保存失败',
      loadError: '加载失败',
      noLinks: '暂无友情链接',
      loading: '加载中...',
    }
    return translations[key] || key
  }

  const [links, setLinks] = useState<FriendLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingLink, setDeletingLink] = useState<FriendLink | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'tech',
    contact_email: '',
    is_featured: false,
  })

  // 加载友情链接数据
  useEffect(() => {
    const loadLinks = async () => {
      setLoading(true)
      try {
        const response = await ApiClient.getFriendLinks()
        if (response.success) {
          setLinks(response.data.links)
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

    loadLinks()
  }, [])

  // 过滤链接
  const filteredLinks = links.filter(link =>
    link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      category: 'tech',
      contact_email: '',
      is_featured: false,
    })
    setEditingLink(null)
  }

  // 打开添加对话框
  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (link: FriendLink) => {
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description,
      category: link.category,
      contact_email: link.contact_email || '',
      is_featured: link.is_featured,
    })
    setEditingLink(link)
    setDialogOpen(true)
  }

  // 保存链接
  const handleSave = async () => {
    try {
      if (editingLink) {
        // 更新链接
        const response = await ApiClient.updateFriendLink(editingLink.id, formData)
        if (response.success) {
          setLinks(prev => prev.map(link => 
            link.id === editingLink.id ? response.data.link : link
          ))
          toast.success(t('saveSuccess'))
        }
      } else {
        // 创建新链接
        const response = await ApiClient.createFriendLink(formData)
        if (response.success) {
          setLinks(prev => [response.data.link, ...prev])
          toast.success(t('saveSuccess'))
        }
      }
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Save friend link error:', error)
      toast.error(t('saveError'))
    }
  }

  // 删除链接
  const handleDelete = async () => {
    if (!deletingLink) return

    try {
      const response = await ApiClient.deleteFriendLink(deletingLink.id)
      if (response.success) {
        setLinks(prev => prev.filter(link => link.id !== deletingLink.id))
        toast.success(t('deleteSuccess'))
      }
    } catch (error) {
      console.error('Delete friend link error:', error)
      toast.error(t('deleteError'))
    } finally {
      setDeleteDialogOpen(false)
      setDeletingLink(null)
    }
  }

  // 更新链接状态
  const handleUpdateStatus = async (linkId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await ApiClient.updateFriendLink(linkId, { status })
      if (response.success) {
        setLinks(prev => prev.map(link => 
          link.id === linkId ? response.data.link : link
        ))
        toast.success(t('saveSuccess'))
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error(t('saveError'))
    }
  }

  // 获取状态图标
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

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return t('approved')
      case 'rejected':
        return t('rejected')
      default:
        return t('pending')
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
          {t('addLink')}
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
          {filteredLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('noLinks')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('url')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {link.avatar && (
                          <img
                            src={link.avatar}
                            alt={link.name}
                            className="w-6 h-6 rounded"
                          />
                        )}
                        <span>{link.name}</span>
                        {link.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            {t('featured')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {link.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {link.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(link.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(link.status)}
                        <span>{getStatusText(link.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(link)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingLink(link)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {link.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(link.id, 'approved')}
                              className="text-green-600"
                            >
                              {t('approve')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(link.id, 'rejected')}
                              className="text-red-600"
                            >
                              {t('reject')}
                            </Button>
                          </>
                        )}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? t('edit') : t('addLink')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="url">{t('url')}</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="category">{t('category')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
            <div>
              <Label htmlFor="contact_email">联系邮箱</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="is_featured">{t('featured')}</Label>
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
