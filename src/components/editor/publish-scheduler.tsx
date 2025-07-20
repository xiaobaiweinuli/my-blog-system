'use client'

import { useState, useEffect } from 'react'
// import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Send, 
  Eye, 
  Settings,
  Globe,
  Lock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Edit,
  Trash2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ScheduledPost {
  id: string
  title: string
  content: string
  scheduledAt: string
  status: 'scheduled' | 'published' | 'failed' | 'cancelled'
  visibility: 'public' | 'private' | 'unlisted'
  author: {
    id: string
    name: string
    avatar?: string
  }
  tags: string[]
  category?: string
  seoTitle?: string
  seoDescription?: string
  socialMedia?: {
    twitter?: boolean
    facebook?: boolean
    linkedin?: boolean
  }
  notifications?: {
    email?: boolean
    push?: boolean
  }
  createdAt: string
  updatedAt: string
  error?: string
}

interface PublishSchedulerProps {
  articleId?: string
  initialData?: Partial<ScheduledPost>
  onSchedule: (data: Partial<ScheduledPost>) => Promise<ScheduledPost>
  onUpdate: (id: string, data: Partial<ScheduledPost>) => Promise<ScheduledPost>
  onCancel: (id: string) => Promise<void>
  onPublishNow: (id: string) => Promise<void>
  className?: string
}

export function PublishScheduler({
  articleId,
  initialData,
  onSchedule,
  onUpdate,
  onCancel,
  onPublishNow,
  className
}: PublishSchedulerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      publishScheduler: '定时发布',
      scheduled: '已调度',
      schedulePost: '定时发布',
      editSchedule: '编辑调度',
      loadScheduledPostsFailed: '加载定时文章失败',
      pleaseSelectDateTime: '请选择发布时间',
      scheduleDateMustBeFuture: '发布时间必须晚于当前时间',
      postScheduled: '文章已定时',
      schedulePostFailed: '定时发布失败',
      scheduleUpdated: '调度已更新',
      updateScheduleFailed: '更新调度失败',
      scheduleCancelled: '调度已取消',
      cancelScheduleFailed: '取消调度失败',
      postPublished: '文章已发布',
      publishNowFailed: '立即发布失败',
      noScheduledPosts: '暂无定时文章',
      noScheduledPostsDescription: '还没有定时发布的文章',
      socialMediaEnabled: '社交媒体已开启',
      emailNotifications: '邮件通知',
      pushNotifications: '推送通知',
      preview: '预览',
      delete: '删除',
      public: '公开',
      private: '私密',
      unlisted: '未列出',
      basic: '基础信息',
      seo: 'SEO设置',
      social: '社交分享',
      title: '标题',
      titlePlaceholder: '请输入标题',
      publishDateTime: '发布时间',
      visibility: '可见性',
      seoTitle: 'SEO标题',
      seoTitlePlaceholder: '用于搜索引擎优化的标题',
      seoDescription: 'SEO描述',
      seoDescriptionPlaceholder: '用于搜索引擎优化的描述',
      socialMediaSharing: '社交媒体分享',
      shareToTwitter: '分享到 Twitter',
      shareToFacebook: '分享到 Facebook',
      shareToLinkedIn: '分享到 LinkedIn',
      notifications: '通知设置',
      updateSchedule: '更新调度',
      cancelSchedule: '取消调度',
      publishNow: '立即发布',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    scheduledAt: '',
    visibility: initialData?.visibility || 'public',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    socialMedia: {
      twitter: initialData?.socialMedia?.twitter || false,
      facebook: initialData?.socialMedia?.facebook || false,
      linkedin: initialData?.socialMedia?.linkedin || false,
    },
    notifications: {
      email: initialData?.notifications?.email || true,
      push: initialData?.notifications?.push || false,
    }
  })

  // 加载已调度的文章
  useEffect(() => {
    loadScheduledPosts()
  }, [])

  const loadScheduledPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/articles/scheduled')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setScheduledPosts(data.data.posts || [])
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled posts:', error)
      showToast.error(t('loadScheduledPostsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 调度发布
  const handleSchedule = async () => {
    if (!formData.scheduledAt) {
      showToast.error(t('pleaseSelectDateTime'))
      return
    }

    const scheduledDate = new Date(formData.scheduledAt)
    if (scheduledDate <= new Date()) {
      showToast.error(t('scheduleDateMustBeFuture'))
      return
    }

    try {
      const scheduledPost = await onSchedule({
        ...formData,
        scheduledAt: scheduledDate.toISOString(),
      })
      
      setScheduledPosts(prev => [scheduledPost, ...prev])
      setIsScheduleDialogOpen(false)
      resetForm()
      showToast.success(t('postScheduled'))
    } catch (error) {
      console.error('Failed to schedule post:', error)
      showToast.error(t('schedulePostFailed'))
    }
  }

  // 更新调度
  const handleUpdate = async (post: ScheduledPost) => {
    try {
      const updatedPost = await onUpdate(post.id, formData)
      setScheduledPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p))
      setIsScheduleDialogOpen(false)
      showToast.success(t('scheduleUpdated'))
    } catch (error) {
      console.error('Failed to update schedule:', error)
      showToast.error(t('updateScheduleFailed'))
    }
  }

  // 取消调度
  const handleCancel = async (postId: string) => {
    try {
      await onCancel(postId)
      setScheduledPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, status: 'cancelled' } : p
      ))
      showToast.success(t('scheduleCancelled'))
    } catch (error) {
      console.error('Failed to cancel schedule:', error)
      showToast.error(t('cancelScheduleFailed'))
    }
  }

  // 立即发布
  const handlePublishNow = async (postId: string) => {
    try {
      await onPublishNow(postId)
      setScheduledPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, status: 'published' } : p
      ))
      showToast.success(t('postPublished'))
    } catch (error) {
      console.error('Failed to publish now:', error)
      showToast.error(t('publishNowFailed'))
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      scheduledAt: '',
      visibility: 'public',
      seoTitle: '',
      seoDescription: '',
      socialMedia: {
        twitter: false,
        facebook: false,
        linkedin: false,
      },
      notifications: {
        email: true,
        push: false,
      }
    })
    setSelectedPost(null)
  }

  // 编辑调度
  const editSchedule = (post: ScheduledPost) => {
    setSelectedPost(post)
    setFormData({
      title: post.title,
      scheduledAt: new Date(post.scheduledAt).toISOString().slice(0, 16),
      visibility: post.visibility,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      socialMedia: {
        twitter: post.socialMedia?.twitter || false,
        facebook: post.socialMedia?.facebook || false,
        linkedin: post.socialMedia?.linkedin || false,
      },
      notifications: {
        email: post.notifications?.email || true,
        push: post.notifications?.push || false,
      }
    })
    setIsScheduleDialogOpen(true)
  }

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  // 获取可见性图标
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'private':
        return <Lock className="h-4 w-4 text-red-500" />
      case 'unlisted':
        return <Users className="h-4 w-4 text-yellow-500" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('publishScheduler')}</h3>
          <Badge variant="secondary">
            {scheduledPosts.filter(p => p.status === 'scheduled').length} {t('scheduled')}
          </Badge>
        </div>
        
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Calendar className="h-4 w-4 mr-2" />
              {t('schedulePost')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {selectedPost ? t('editSchedule') : t('schedulePost')}
              </DialogTitle>
            </DialogHeader>
            <ScheduleForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={selectedPost ? () => handleUpdate(selectedPost) : handleSchedule}
              isEditing={!!selectedPost}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 调度列表 */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : scheduledPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('noScheduledPosts')}</p>
                <p className="text-sm text-muted-foreground">{t('noScheduledPostsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            scheduledPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{post.title}</h4>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(post.status)}
                          <Badge variant={
                            post.status === 'published' ? 'default' :
                            post.status === 'scheduled' ? 'secondary' :
                            post.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {post.status}
                          </Badge>
                          {getVisibilityIcon(post.visibility)}
                          <Badge variant="outline" className="text-xs">
                            {post.visibility}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(post.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {post.author.name}
                        </div>
                        {post.category && (
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      
                      {post.tags.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {post.error && (
                        <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                          <AlertCircle className="h-4 w-4" />
                          {post.error}
                        </div>
                      )}
                      
                      {/* 社交媒体和通知设置 */}
                      <div className="flex items-center gap-4 mt-2">
                        {(post.socialMedia?.twitter || post.socialMedia?.facebook || post.socialMedia?.linkedin) && (
                          <div className="flex items-center gap-1">
                            <Send className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t('socialMediaEnabled')}
                            </span>
                          </div>
                        )}
                        {post.notifications?.email && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t('emailNotifications')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 ml-4">
                      {post.status === 'scheduled' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editSchedule(post)}
                            title={t('editSchedule')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublishNow(post.id)}
                            title={t('publishNow')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(post.id)}
                            title={t('cancelSchedule')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('preview')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{post.title}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-96">
                            <div className="p-4 whitespace-pre-wrap">
                              {post.content}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      {post.status !== 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // 删除已完成的调度记录
                          }}
                          title={t('delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// 调度表单组件
function ScheduleForm({
  formData,
  setFormData,
  onSubmit,
  isEditing
}: {
  formData: any
  setFormData: (data: any) => void
  onSubmit: () => void
  isEditing: boolean
}) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      basic: '基础信息',
      seo: 'SEO设置',
      social: '社交分享',
      title: '标题',
      titlePlaceholder: '请输入标题',
      publishDateTime: '发布时间',
      visibility: '可见性',
      public: '公开',
      private: '私密',
      unlisted: '未列出',
      seoTitle: 'SEO标题',
      seoTitlePlaceholder: '用于搜索引擎优化的标题',
      seoDescription: 'SEO描述',
      seoDescriptionPlaceholder: '用于搜索引擎优化的描述',
      socialMediaSharing: '社交媒体分享',
      shareToTwitter: '分享到 Twitter',
      shareToFacebook: '分享到 Facebook',
      shareToLinkedIn: '分享到 LinkedIn',
      notifications: '通知设置',
      emailNotifications: '邮件通知',
      pushNotifications: '推送通知',
      updateSchedule: '更新调度',
      schedulePost: '定时发布',
    }
    return translations[key] || key
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">{t('basic')}</TabsTrigger>
          <TabsTrigger value="seo">{t('seo')}</TabsTrigger>
          <TabsTrigger value="social">{t('social')}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="title">{t('title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
              placeholder={t('titlePlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="scheduledAt">{t('publishDateTime')}</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: any) => ({ ...prev, scheduledAt: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="visibility">{t('visibility')}</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('public')}
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('unlisted')}
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('private')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">{t('seoTitle')}</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: any) => ({ ...prev, seoTitle: e.target.value }))}
              placeholder={t('seoTitlePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="seoDescription">{t('seoDescription')}</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev: any) => ({ ...prev, seoDescription: e.target.value }))}
              placeholder={t('seoDescriptionPlaceholder')}
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div>
            <Label className="text-base font-medium">{t('socialMediaSharing')}</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="twitter">{t('shareToTwitter')}</Label>
                <Switch
                  id="twitter"
                  checked={formData.socialMedia.twitter}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, twitter: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="facebook">{t('shareToFacebook')}</Label>
                <Switch
                  id="facebook"
                  checked={formData.socialMedia.facebook}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, facebook: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="linkedin">{t('shareToLinkedIn')}</Label>
                <Switch
                  id="linkedin"
                  checked={formData.socialMedia.linkedin}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, linkedin: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">{t('notifications')}</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">{t('emailNotifications')}</Label>
                <Switch
                  id="emailNotifications"
                  checked={formData.notifications.email}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications">{t('pushNotifications')}</Label>
                <Switch
                  id="pushNotifications"
                  checked={formData.notifications.push}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          <Calendar className="h-4 w-4 mr-2" />
          {isEditing ? t('updateSchedule') : t('schedulePost')}
        </Button>
      </div>
    </form>
  )
}
