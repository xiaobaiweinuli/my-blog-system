'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Send,
  Edit,
  Trash2,
  Flag,
  Shield,
  Users,
  Settings
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  name: string
  description: string
  order: number
  requiredRole: 'author' | 'editor' | 'admin'
  autoApprove?: boolean
  timeLimit?: number // hours
}

interface ReviewComment {
  id: string
  content: string
  type: 'suggestion' | 'required' | 'approval' | 'rejection'
  author: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  createdAt: string
  resolved?: boolean
  lineNumber?: number
}

interface WorkflowItem {
  id: string
  articleId: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  currentStep: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'published'
  assignedTo?: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  comments: ReviewComment[]
  createdAt: string
  updatedAt: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  category?: string
}

interface ContentWorkflowProps {
  articleId?: string
  currentUser: {
    id: string
    name: string
    role: 'author' | 'editor' | 'admin'
  }
  onSubmitForReview: (articleId: string) => Promise<WorkflowItem>
  onApprove: (itemId: string, comment?: string) => Promise<void>
  onReject: (itemId: string, comment: string) => Promise<void>
  onAssign: (itemId: string, userId: string) => Promise<void>
  className?: string
}

export function ContentWorkflow({
  articleId,
  currentUser,
  onSubmitForReview,
  onApprove,
  onReject,
  onAssign,
  className
}: ContentWorkflowProps) {
  // 中文静态文本
  const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
      contentWorkflow: '内容工作流',
      pending: '待处理',
      in_review: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
      published: '已发布',
      allStatuses: '全部状态',
      allAssignees: '全部分配',
      assignedToMe: '分配给我',
      unassigned: '未分配',
      workflowSettings: '工作流设置',
      workflowSettingsDescription: '配置内容审核流程',
      submitForReview: '提交审核',
      review: '审核',
      approve: '通过',
      reject: '拒绝',
      approveItem: '通过项目',
      rejectItem: '拒绝项目',
      approvalComment: '通过说明',
      rejectionComment: '拒绝原因',
      approvalCommentPlaceholder: '可填写通过说明',
      rejectionCommentPlaceholder: '请填写拒绝原因',
      rejectionCommentRequired: '拒绝时必须填写原因',
      itemApproved: '已通过',
      itemRejected: '已拒绝',
      reviewFailed: '审核失败',
      assignFailed: '分配失败',
      itemAssigned: '分配成功',
      viewDetails: '查看详情',
      noWorkflowItems: '暂无工作流项目',
      noWorkflowItemsDescription: '还没有内容需要审核',
      workflowHistoryPlaceholder: '暂无历史记录',
      content: '内容',
      comments: '评论',
      history: '历史',
      cancel: '取消',
    }
    if (key === 'hoursAgo' && params?.count) return `${params.count} 小时前`
    if (key === 'daysAgo' && params?.count) return `${params.count} 天前`
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  // 加载工作流数据
  useEffect(() => {
    loadWorkflowItems()
    loadWorkflowSteps()
  }, [])

  const loadWorkflowItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workflow/items')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWorkflowItems(data.data.items || [])
        }
      }
    } catch (error) {
      console.error('Failed to load workflow items:', error)
      showToast.error(t('loadWorkflowItemsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkflowSteps = async () => {
    try {
      const response = await fetch('/api/workflow/steps')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWorkflowSteps(data.data.steps || [])
        }
      }
    } catch (error) {
      console.error('Failed to load workflow steps:', error)
    }
  }

  // 提交审核
  const handleSubmitForReview = async () => {
    if (!articleId) return

    try {
      const workflowItem = await onSubmitForReview(articleId)
      setWorkflowItems(prev => [workflowItem, ...prev])
      showToast.success(t('submittedForReview'))
    } catch (error) {
      console.error('Failed to submit for review:', error)
      showToast.error(t('submitForReviewFailed'))
    }
  }

  // 审核操作
  const handleReview = async () => {
    if (!selectedItem) return

    try {
      if (reviewType === 'approve') {
        await onApprove(selectedItem.id, reviewComment || undefined)
        showToast.success(t('itemApproved'))
      } else {
        if (!reviewComment.trim()) {
          showToast.error(t('rejectionCommentRequired'))
          return
        }
        await onReject(selectedItem.id, reviewComment)
        showToast.success(t('itemRejected'))
      }
      
      await loadWorkflowItems()
      setIsReviewDialogOpen(false)
      setReviewComment('')
      setSelectedItem(null)
    } catch (error) {
      console.error('Failed to review item:', error)
      showToast.error(t('reviewFailed'))
    }
  }

  // 分配审核者
  const handleAssign = async (itemId: string, userId: string) => {
    try {
      await onAssign(itemId, userId)
      await loadWorkflowItems()
      showToast.success(t('itemAssigned'))
    } catch (error) {
      console.error('Failed to assign item:', error)
      showToast.error(t('assignFailed'))
    }
  }

  // 过滤工作流项目
  const filteredItems = workflowItems.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false
    }
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'me' && item.assignedTo?.id !== currentUser.id) {
        return false
      }
      if (filterAssignee !== 'me' && filterAssignee !== 'unassigned' && 
          item.assignedTo?.id !== filterAssignee) {
        return false
      }
      if (filterAssignee === 'unassigned' && item.assignedTo) {
        return false
      }
    }
    return true
  })

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return t('justNow')
    if (hours < 24) return t('hoursAgo', { count: hours })
    if (days < 7) return t('daysAgo', { count: days })
    return date.toLocaleDateString()
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_review':
        return <Eye className="h-4 w-4 text-blue-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'published':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-500 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-500 bg-green-50 border-green-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  // 检查用户权限
  const canReview = (item: WorkflowItem) => {
    const currentStep = workflowSteps.find(step => step.id === item.currentStep)
    if (!currentStep) return false
    
    // 检查角色权限
    const roleHierarchy = { author: 0, editor: 1, admin: 2 }
    const userLevel = roleHierarchy[currentUser.role]
    const requiredLevel = roleHierarchy[currentStep.requiredRole]
    
    return userLevel >= requiredLevel && 
           (item.assignedTo?.id === currentUser.id || !item.assignedTo)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('contentWorkflow')}</h3>
          <Badge variant="secondary">
            {filteredItems.filter(item => item.status === 'pending' || item.status === 'in_review').length} {t('pending')}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {articleId && (
            <Button onClick={handleSubmitForReview}>
              <Send className="h-4 w-4 mr-2" />
              {t('submitForReview')}
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                {t('workflowSettings')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('workflowSettings')}</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                请根据需要填写或操作。
              </DialogDescription>
              <WorkflowSettings steps={workflowSteps} onUpdate={loadWorkflowSteps} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
            <SelectItem value="in_review">{t('inReview')}</SelectItem>
            <SelectItem value="approved">{t('approved')}</SelectItem>
            <SelectItem value="rejected">{t('rejected')}</SelectItem>
            <SelectItem value="published">{t('published')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allAssignees')}</SelectItem>
            <SelectItem value="me">{t('assignedToMe')}</SelectItem>
            <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 工作流项目列表 */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('noWorkflowItems')}</p>
                <p className="text-sm text-muted-foreground">{t('noWorkflowItemsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <Badge variant={
                            item.status === 'approved' || item.status === 'published' ? 'default' :
                            item.status === 'rejected' ? 'destructive' :
                            item.status === 'in_review' ? 'secondary' : 'outline'
                          }>
                            {t(item.status)}
                          </Badge>
                          <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                            {t(item.priority)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.author.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTime(item.updatedAt)}
                        </div>
                        {item.assignedTo && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {item.assignedTo.name}
                          </div>
                        )}
                        {item.comments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {item.comments.length}
                          </div>
                        )}
                      </div>
                      
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* 最新评论 */}
                      {item.comments.length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded-lg">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={item.comments[0].author.avatar} />
                              <AvatarFallback>
                                {item.comments[0].author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {item.comments[0].author.name} • {formatTime(item.comments[0].createdAt)}
                              </p>
                              <p className="text-sm line-clamp-2">
                                {item.comments[0].content}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 ml-4">
                      {canReview(item) && item.status === 'in_review' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setReviewType('approve')
                            setIsReviewDialogOpen(true)
                          }}
                          title={t('review')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('viewDetails')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{item.title}</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>
                            请根据需要填写或操作。
                          </DialogDescription>
                          <WorkflowItemDetails item={item} />
                        </DialogContent>
                      </Dialog>
                      
                      {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
                        <Select
                          onValueChange={(userId) => handleAssign(item.id, userId)}
                        >
                          <SelectTrigger className="w-8 h-8 p-0">
                            <Users className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassign">{t('unassign')}</SelectItem>
                            {/* 这里应该加载可用的审核者列表 */}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* 审核对话框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewType === 'approve' ? t('approveItem') : t('rejectItem')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant={reviewType === 'approve' ? 'default' : 'outline'}
                onClick={() => setReviewType('approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('approve')}
              </Button>
              <Button
                variant={reviewType === 'reject' ? 'destructive' : 'outline'}
                onClick={() => setReviewType('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('reject')}
              </Button>
            </div>
            
            <div>
              <Label htmlFor="reviewComment">
                {reviewType === 'approve' ? t('approvalComment') : t('rejectionComment')}
                {reviewType === 'reject' && ' *'}
              </Label>
              <Textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  reviewType === 'approve' 
                    ? t('approvalCommentPlaceholder')
                    : t('rejectionCommentPlaceholder')
                }
                rows={4}
                required={reviewType === 'reject'}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleReview}>
                {reviewType === 'approve' ? t('approve') : t('reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 工作流项目详情组件
function WorkflowItemDetails({ item }: { item: WorkflowItem }) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      content: '内容',
      comments: '评论',
      history: '历史',
      workflowHistoryPlaceholder: '暂无历史记录',
    }
    return translations[key] || key
  }

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList>
        <TabsTrigger value="content">{t('content')}</TabsTrigger>
        <TabsTrigger value="comments">{t('comments')}</TabsTrigger>
        <TabsTrigger value="history">{t('history')}</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <ScrollArea className="h-96">
          <div className="p-4 whitespace-pre-wrap">
            {item.content}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="comments">
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {item.comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>
                    {comment.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{comment.author.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.author.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="history">
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {/* 工作流历史记录 */}
            <p className="text-sm text-muted-foreground">{t('workflowHistoryPlaceholder')}</p>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}

// 工作流设置组件
function WorkflowSettings({ 
  steps, 
  onUpdate 
}: { 
  steps: WorkflowStep[]
  onUpdate: () => void 
}) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      workflowSettingsDescription: '配置内容审核流程',
    }
    return translations[key] || key
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('workflowSettingsDescription')}
      </p>
      {/* 工作流步骤配置 */}
      <div className="space-y-2">
        {steps.map((step) => (
          <Card key={step.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{step.name}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Badge variant="outline">{step.requiredRole}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
