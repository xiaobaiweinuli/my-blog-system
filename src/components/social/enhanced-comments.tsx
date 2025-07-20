'use client'

import { useState, useEffect, useRef } from 'react'
import { formatTime } from '@/lib/utils/time'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Flag, 
  MoreHorizontal,
  Edit,
  Trash2,
  Pin,
  Award,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Quote,
  AtSign,
  Smile,
  Image,
  Link,
  Bold,
  Italic,
  Code
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  authorId: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string
    verified?: boolean
    role?: string
  }
  articleId: string
  parentId?: string
  replies?: Comment[]
  likes: number
  dislikes: number
  isLiked?: boolean
  isDisliked?: boolean
  isPinned?: boolean
  isHighlighted?: boolean
  createdAt: string
  updatedAt?: string
  editedAt?: string
  status: 'published' | 'pending' | 'hidden' | 'deleted'
  mentions?: string[]
  attachments?: {
    id: string
    type: 'image' | 'link'
    url: string
    title?: string
    description?: string
  }[]
}

interface EnhancedCommentsProps {
  articleId: string
  currentUserId?: string
  allowAnonymous?: boolean
  moderationEnabled?: boolean
  maxDepth?: number
  sortBy?: 'newest' | 'oldest' | 'popular' | 'controversial'
  className?: string
}

export function EnhancedComments({
  articleId,
  currentUserId,
  allowAnonymous = false,
  moderationEnabled = true,
  maxDepth = 3,
  sortBy = 'newest',
  className
}: EnhancedCommentsProps) {
  const { showToast } = useToast()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [sortOrder, setSortOrder] = useState(sortBy)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // 加载评论
  useEffect(() => {
    loadComments()
  }, [articleId, sortOrder])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/comments?sort=${sortOrder}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(data.data.comments || [])
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
      showToast.error('加载评论失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 提交评论
  const submitComment = async () => {
    if (!newComment.trim()) return

    if (!currentUserId && !allowAnonymous) {
      showToast.error('请先登录')
      return
    }

    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parentId: replyTo?.id,
          mentions: extractMentions(newComment)
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNewComment('')
          setReplyTo(null)
          await loadComments()
          showToast.success('评论已提交')
        }
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      showToast.error('提交评论失败')
    }
  }

  // 点赞评论
  const likeComment = async (commentId: string) => {
    if (!currentUserId) {
      showToast.error('请先登录')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(prev => updateCommentInTree(prev, commentId, {
            likes: data.data.likes,
            dislikes: data.data.dislikes,
            isLiked: data.data.isLiked,
            isDisliked: data.data.isDisliked
          }))
        }
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
      showToast.error('点赞失败')
    }
  }

  // 踩评论
  const dislikeComment = async (commentId: string) => {
    if (!currentUserId) {
      showToast.error('请先登录')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/dislike`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(prev => updateCommentInTree(prev, commentId, {
            likes: data.data.likes,
            dislikes: data.data.dislikes,
            isLiked: data.data.isLiked,
            isDisliked: data.data.isDisliked
          }))
        }
      }
    } catch (error) {
      console.error('Failed to dislike comment:', error)
      showToast.error('踩失败')
    }
  }

  // 举报评论
  const reportComment = async (commentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        showToast.success('评论已举报')
      }
    } catch (error) {
      console.error('Failed to report comment:', error)
      showToast.error('举报失败')
    }
  }

  // 删除评论
  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadComments()
        showToast.success('评论已删除')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      showToast.error('删除失败')
    }
  }

  // 编辑评论
  const editComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        setEditingComment(null)
        await loadComments()
        showToast.success('评论已更新')
      }
    } catch (error) {
      console.error('Failed to edit comment:', error)
      showToast.error('编辑失败')
    }
  }

  // 置顶评论
  const pinComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/pin`, {
        method: 'POST'
      })

      if (response.ok) {
        await loadComments()
        showToast.success('评论已置顶')
      }
    } catch (error) {
      console.error('Failed to pin comment:', error)
      showToast.error('置顶失败')
    }
  }

  // 提取@提及
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }
    
    return mentions
  }

  // 更新评论树中的评论
  const updateCommentInTree = (comments: Comment[], commentId: string, updates: Partial<Comment>): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, ...updates }
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updates)
        }
      }
      return comment
    })
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  // 渲染评论树
  const renderComments = (comments: Comment[], depth = 0) => {
    return comments.map((comment) => (
      <CommentItem
        key={comment.id}
        comment={comment}
        depth={depth}
        maxDepth={maxDepth}
        currentUserId={currentUserId}
        onReply={() => setReplyTo(comment)}
        onEdit={() => setEditingComment(comment)}
        onLike={() => likeComment(comment.id)}
        onDislike={() => dislikeComment(comment.id)}
        onReport={(reason) => reportComment(comment.id, reason)}
        onDelete={() => deleteComment(comment.id)}
        onPin={() => pinComment(comment.id)}
      >
        {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
          <div className="ml-8 mt-4 space-y-4">
            {renderComments(comment.replies, depth + 1)}
          </div>
        )}
      </CommentItem>
    ))
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 评论统计和排序 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          评论 ({comments.length})
        </h3>
        
        <Select value={sortOrder} onValueChange={(value: string) => setSortOrder(value as 'newest' | 'oldest' | 'popular' | 'controversial')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新</SelectItem>
            <SelectItem value="oldest">最早</SelectItem>
            <SelectItem value="popular">热门</SelectItem>
            <SelectItem value="controversial">争议</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 评论输入框 */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {replyTo && (
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    回复 @{replyTo.author.displayName}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm mt-1 line-clamp-2">{replyTo.content}</p>
              </div>
            )}

            <Tabs value={showPreview ? "preview" : "write"} onValueChange={(v) => setShowPreview(v === "preview")}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="write">撰写</TabsTrigger>
                  <TabsTrigger value="preview">预览</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="write">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? '撰写回复' : '撰写评论'}
                  className="min-h-[100px]"
                />
              </TabsContent>

              <TabsContent value="preview">
                <div className="min-h-[100px] p-3 border rounded-md bg-muted/50">
                  {newComment ? (
                    <div className="prose prose-sm max-w-none">
                      {newComment.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">暂无预览内容</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                支持Markdown • 使用@提及
              </div>
              
              <div className="flex items-center gap-2">
                {replyTo && (
                  <Button
                    variant="outline"
                    onClick={() => setReplyTo(null)}
                  >
                    取消
                  </Button>
                )}
                <Button
                  onClick={submitComment}
                  disabled={!newComment.trim()}
                >
                  {replyTo ? '回复' : '评论'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无评论</h3>
              <p className="text-sm text-muted-foreground text-center">
                快来发表你的第一条评论吧！
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// 评论项组件
function CommentItem({
  comment,
  depth,
  maxDepth,
  currentUserId,
  onReply,
  onEdit,
  onLike,
  onDislike,
  onReport,
  onDelete,
  onPin,
  children
}: {
  comment: Comment
  depth: number
  maxDepth: number
  currentUserId?: string
  onReply: () => void
  onEdit: () => void
  onLike: () => void
  onDislike: () => void
  onReport: (reason: string) => void
  onDelete: () => void
  onPin: () => void
  children?: React.ReactNode
}) {
  const { showToast } = useToast()
  const [showActions, setShowActions] = useState(false)

  const canEdit = currentUserId === comment.authorId
  const canDelete = currentUserId === comment.authorId || currentUserId === 'admin'
  const canPin = currentUserId === 'admin' || currentUserId === 'moderator'

  return (
    <Card className={cn(
      "transition-colors",
      comment.isPinned && "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
      comment.isHighlighted && "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback>
              {comment.author.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* 作者信息 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{comment.author.displayName}</span>
              {comment.author.verified && (
                <Badge variant="secondary" className="text-xs">✓</Badge>
              )}
              {comment.author.role && (
                <Badge variant="outline" className="text-xs">
                  {comment.author.role}
                </Badge>
              )}
              {comment.isPinned && (
                <Badge variant="secondary" className="text-xs">
                  <Pin className="h-3 w-3 mr-1" />
                  置顶
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatTime(comment.createdAt)}
              </span>
              {comment.editedAt && (
                <span className="text-xs text-muted-foreground">
                  (已编辑)
                </span>
              )}
            </div>

            {/* 评论内容 */}
            <div className="prose prose-sm max-w-none mb-3">
              {comment.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* 附件 */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {comment.attachments.map((attachment) => (
                  <div key={attachment.id}>
                    {attachment.type === 'image' ? (
                      <img
                        src={attachment.url}
                        alt=""
                        className="max-w-sm rounded border"
                      />
                    ) : (
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-sm">{attachment.title}</p>
                            {attachment.description && (
                              <p className="text-xs text-muted-foreground">
                                {attachment.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className={cn(
                  "flex items-center gap-1",
                  comment.isLiked && "text-red-500"
                )}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  comment.isLiked && "fill-current"
                )} />
                <span>{comment.likes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDislike}
                className={cn(
                  "flex items-center gap-1",
                  comment.isDisliked && "text-blue-500"
                )}
              >
                <ThumbsDown className={cn(
                  "h-4 w-4",
                  comment.isDisliked && "fill-current"
                )} />
                <span>{comment.dislikes}</span>
              </Button>

              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReply}
                  className="flex items-center gap-1"
                >
                  <Reply className="h-4 w-4" />
                  回复
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                分享
              </Button>

              {/* 更多操作 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>评论操作</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        onClick={onEdit}
                        className="w-full justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </Button>
                    )}
                    
                    {canPin && (
                      <Button
                        variant="ghost"
                        onClick={onPin}
                        className="w-full justify-start"
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        {comment.isPinned ? '取消置顶' : '置顶'}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={() => onReport('不适当')}
                      className="w-full justify-start"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      举报
                    </Button>
                    
                    {canDelete && (
                      <Button
                        variant="destructive"
                        onClick={onDelete}
                        className="w-full justify-start"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* 子评论 */}
        {children}
      </CardContent>
    </Card>
  )
}
