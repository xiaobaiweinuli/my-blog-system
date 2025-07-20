'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Bookmark, 
  Share2, 
  MessageCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Link,
  Download,
  Printer
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ArticleInteraction {
  id: string
  type: 'like' | 'bookmark' | 'share' | 'view'
  userId: string
  articleId: string
  createdAt: string
  metadata?: Record<string, any>
}

interface InteractionStats {
  likes: number
  bookmarks: number
  shares: number
  views: number
  comments: number
  userInteractions: {
    liked: boolean
    bookmarked: boolean
    shared: boolean
  }
}

interface ArticleInteractionsProps {
  articleId: string
  articleTitle: string
  articleUrl: string
  authorId: string
  currentUserId?: string
  initialStats?: InteractionStats
  showViewCount?: boolean
  compact?: boolean
  className?: string
}

export function ArticleInteractions({
  articleId,
  articleTitle,
  articleUrl,
  authorId,
  currentUserId,
  initialStats,
  showViewCount = true,
  compact = false,
  className
}: ArticleInteractionsProps) {
  // 检查是否有国际化上下文
  const t = {
    like: '点赞',
    unlike: '取消点赞',
    bookmark: '收藏',
    unbookmark: '取消收藏',
    share: '分享',
    comments: '评论',
    views: '浏览',
    likes: '点赞',
    bookmarks: '收藏',
    loginRequired: '请先登录',
    likeSuccess: '点赞成功',
    unlikeSuccess: '取消点赞成功',
    likeFailed: '点赞失败',
    bookmarkSuccess: '收藏成功',
    unbookmarkSuccess: '取消收藏成功',
    bookmarkFailed: '收藏失败',
    shareArticle: '分享文章',
    shareOn: '分享到',
    copyLink: '复制链接',
    linkCopied: '链接已复制',
    copyFailed: '复制失败',
    reportReasonRequired: '请选择举报原因',
    reportReason: '举报原因',
    reportReasonPlaceholder: '请描述举报原因',
    reportDescription: '举报描述',
    reportDescriptionPlaceholder: '请详细描述举报原因',
    reportSuccess: '举报成功',
    reportFailed: '举报失败',
    cancel: '取消',
    submitReport: '提交举报',
    reportArticle: '举报文章',
    email: '邮件'
  }
  
  const { showToast } = useToast()
  
  const [stats, setStats] = useState<InteractionStats>(
    initialStats || {
      likes: 0,
      bookmarks: 0,
      shares: 0,
      views: 0,
      comments: 0,
      userInteractions: {
        liked: false,
        bookmarked: false,
        shared: false
      }
    }
  )
  
  const [isLoading, setIsLoading] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  // 加载互动统计
  useEffect(() => {
    loadInteractionStats()
    // 记录浏览
    if (currentUserId && currentUserId !== authorId) {
      recordView()
    }
  }, [articleId, currentUserId])

  const loadInteractionStats = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/interactions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to load interaction stats:', error)
    }
  }

  // 记录浏览
  const recordView = async () => {
    try {
      await fetch(`/api/articles/${articleId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view' })
      })
    } catch (error) {
      console.error('Failed to record view:', error)
    }
  }

  // 点赞/取消点赞
  const handleLike = async () => {
    if (!currentUserId) {
      showToast.error(t.loginRequired)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: stats.userInteractions.liked ? 'unlike' : 'like'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(prev => ({
            ...prev,
            likes: stats.userInteractions.liked ? prev.likes - 1 : prev.likes + 1,
            userInteractions: {
              ...prev.userInteractions,
              liked: !prev.userInteractions.liked
            }
          }))
          
          showToast.success(
            stats.userInteractions.liked ? t.unlikeSuccess : t.likeSuccess
          )
        }
      }
    } catch (error) {
      console.error('Like failed:', error)
      showToast.error(t.likeFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // 收藏/取消收藏
  const handleBookmark = async () => {
    if (!currentUserId) {
      showToast.error(t.loginRequired)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: stats.userInteractions.bookmarked ? 'unbookmark' : 'bookmark'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(prev => ({
            ...prev,
            bookmarks: stats.userInteractions.bookmarked ? prev.bookmarks - 1 : prev.bookmarks + 1,
            userInteractions: {
              ...prev.userInteractions,
              bookmarked: !prev.userInteractions.bookmarked
            }
          }))
          
          showToast.success(
            stats.userInteractions.bookmarked ? t.unbookmarkSuccess : t.bookmarkSuccess
          )
        }
      }
    } catch (error) {
      console.error('Bookmark failed:', error)
      showToast.error(t.bookmarkFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // 分享
  const handleShare = async (platform?: string) => {
    const fullUrl = `${window.location.origin}${articleUrl}`
    
    if (platform) {
      let shareUrl = ''
      const encodedUrl = encodeURIComponent(fullUrl)
      const encodedTitle = encodeURIComponent(articleTitle)
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
          break
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
          break
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
          break
        case 'email':
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
          break
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400')
        recordShare(platform)
      }
    } else {
      // 复制链接
      try {
        await navigator.clipboard.writeText(fullUrl)
        showToast.success(t.linkCopied)
        recordShare('copy')
      } catch (error) {
        showToast.error(t.copyFailed)
      }
    }
  }

  // 记录分享
  const recordShare = async (platform: string) => {
    try {
      await fetch(`/api/articles/${articleId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'share',
          metadata: { platform }
        })
      })
      
      setStats(prev => ({
        ...prev,
        shares: prev.shares + 1,
        userInteractions: {
          ...prev.userInteractions,
          shared: true
        }
      }))
    } catch (error) {
      console.error('Failed to record share:', error)
    }
  }

  // 举报文章
  const handleReport = async () => {
    if (!currentUserId) {
      showToast.error(t.loginRequired)
      return
    }

    if (!reportReason.trim()) {
      showToast.error(t.reportReasonRequired)
      return
    }

    try {
      const response = await fetch(`/api/articles/${articleId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription
        })
      })

      if (response.ok) {
        showToast.success(t.reportSuccess)
        setIsReportDialogOpen(false)
        setReportReason('')
        setReportDescription('')
      }
    } catch (error) {
      console.error('Report failed:', error)
      showToast.error(t.reportFailed)
    }
  }

  // 格式化数字
  const formatCount = (count: number) => {
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1000000).toFixed(1)}M`
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1",
            stats.userInteractions.liked && "text-red-500"
          )}
        >
          <Heart className={cn(
            "h-4 w-4",
            stats.userInteractions.liked && "fill-current"
          )} />
          <span className="text-sm">{formatCount(stats.likes)}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1",
            stats.userInteractions.bookmarked && "text-blue-500"
          )}
        >
          <Bookmark className={cn(
            "h-4 w-4",
            stats.userInteractions.bookmarked && "fill-current"
          )} />
          <span className="text-sm">{formatCount(stats.bookmarks)}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsShareDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-sm">{formatCount(stats.shares)}</span>
        </Button>

        {showViewCount && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{formatCount(stats.views)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 主要互动按钮 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={stats.userInteractions.liked ? "default" : "outline"}
                  onClick={handleLike}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2",
                    stats.userInteractions.liked && "bg-red-500 hover:bg-red-600 text-white"
                  )}
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    stats.userInteractions.liked && "fill-current"
                  )} />
                  <span>{formatCount(stats.likes)}</span>
                  <span className="hidden sm:inline">{t.likes}</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={stats.userInteractions.bookmarked ? "default" : "outline"}
                  onClick={handleBookmark}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2",
                    stats.userInteractions.bookmarked && "bg-blue-500 hover:bg-blue-600 text-white"
                  )}
                >
                  <Bookmark className={cn(
                    "h-4 w-4",
                    stats.userInteractions.bookmarked && "fill-current"
                  )} />
                  <span>{formatCount(stats.bookmarks)}</span>
                  <span className="hidden sm:inline">{t.bookmarks}</span>
                </Button>
              </motion.div>

              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      <span>{formatCount(stats.shares)}</span>
                      <span className="hidden sm:inline">{t.share}</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.shareArticle}</DialogTitle>
                  </DialogHeader>
                  <ShareDialog
                    articleTitle={articleTitle}
                    articleUrl={articleUrl}
                    onShare={handleShare}
                  />
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{formatCount(stats.comments)}</span>
                <span className="hidden sm:inline">{t.comments}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showViewCount && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{formatCount(stats.views)} {t.views}</span>
                </div>
              )}

              {currentUserId && currentUserId !== authorId && (
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.reportArticle}</DialogTitle>
                    </DialogHeader>
                    <ReportDialog
                      reportReason={reportReason}
                      reportDescription={reportDescription}
                      onReasonChange={setReportReason}
                      onDescriptionChange={setReportDescription}
                      onSubmit={handleReport}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 分享对话框组件
function ShareDialog({
  articleTitle,
  articleUrl,
  onShare
}: {
  articleTitle: string
  articleUrl: string
  onShare: (platform?: string) => void
}) {
  const t = {
    shareOn: '分享到',
    twitter: 'Twitter',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    email: '邮件',
    copyLink: '复制链接'
  }
  const fullUrl = `${window.location.origin}${articleUrl}`

  return (
    <div className="space-y-4">
      <div>
        <Label>{t.shareOn}</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onShare('twitter')}
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4" />
            {t.twitter}
          </Button>
          <Button
            variant="outline"
            onClick={() => onShare('facebook')}
            className="flex items-center gap-2"
          >
            <Facebook className="h-4 w-4" />
            {t.facebook}
          </Button>
          <Button
            variant="outline"
            onClick={() => onShare('linkedin')}
            className="flex items-center gap-2"
          >
            <Linkedin className="h-4 w-4" />
            {t.linkedin}
          </Button>
          <Button
            variant="outline"
            onClick={() => onShare('email')}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {t.email}
          </Button>
        </div>
      </div>

      <div>
        <Label>{t.copyLink}</Label>
        <div className="flex gap-2 mt-2">
          <Input value={fullUrl} readOnly />
          <Button onClick={() => onShare()}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 举报对话框组件
function ReportDialog({
  reportReason,
  reportDescription,
  onReasonChange,
  onDescriptionChange,
  onSubmit
}: {
  reportReason: string
  reportDescription: string
  onReasonChange: (reason: string) => void
  onDescriptionChange: (description: string) => void
  onSubmit: () => void
}) {
  const t = {
    reportReason: '举报原因',
    reportReasonPlaceholder: '请描述举报原因',
    reportDescription: '举报描述',
    reportDescriptionPlaceholder: '请详细描述举报原因',
    cancel: '取消',
    submitReport: '提交举报'
  }

  const reportReasons = [
    'spam',
    'harassment',
    'inappropriate',
    'copyright',
    'misinformation',
    'other'
  ]

  return (
    <div className="space-y-4">
      <div>
        <Label>{t.reportReason}</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {reportReasons.map((reason) => (
            <Button
              key={reason}
              variant={reportReason === reason ? "default" : "outline"}
              onClick={() => onReasonChange(reason)}
              className="text-sm"
            >
              {/* Assuming reportReason.${reason} is a placeholder for actual translations */}
              {/* For now, using a simple string */}
              {reason.charAt(0).toUpperCase() + reason.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t.reportDescription}</Label>
        <Textarea
          value={reportDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t.reportDescriptionPlaceholder}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onReasonChange('')}>
          {/* Assuming cancel is a placeholder for actual translations */}
          {/* For now, using a simple string */}
          {t.cancel}
        </Button>
        <Button onClick={onSubmit} disabled={!reportReason}>
          {/* Assuming submitReport is a placeholder for actual translations */}
          {/* For now, using a simple string */}
          {t.submitReport}
        </Button>
      </div>
    </div>
  )
}
