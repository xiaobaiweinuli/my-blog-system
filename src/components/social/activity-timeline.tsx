'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatTime } from '@/lib/utils/time'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  UserPlus,
  FileText,
  Edit,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'article_published' | 'article_liked' | 'article_bookmarked' | 'article_shared' | 
        'user_followed' | 'comment_posted' | 'article_updated' | 'milestone_reached'
  actor: {
    id: string
    username: string
    displayName: string
    avatar?: string
    verified?: boolean
  }
  target?: {
    id: string
    title?: string
    type: 'article' | 'user' | 'comment'
    slug?: string
    excerpt?: string
    thumbnail?: string
  }
  metadata?: {
    milestone?: string
    count?: number
    platform?: string
  }
  createdAt: string
  isRead?: boolean
}

interface ActivityTimelineProps {
  userId?: string
  feedType?: 'following' | 'trending' | 'personal'
  showFilters?: boolean
  compact?: boolean
  maxItems?: number
  className?: string
}

export function ActivityTimeline({
  userId,
  feedType = 'following',
  showFilters = true,
  compact = false,
  maxItems,
  className
}: ActivityTimelineProps) {
  const { showToast } = useToast()
  
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastActivityRef = useRef<HTMLDivElement>(null)

  // 无限滚动
  const lastActivityElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreActivities()
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [isLoading, hasMore])

  // 加载活动数据
  useEffect(() => {
    loadActivities(true)
  }, [feedType, filter, userId])

  const loadActivities = async (reset = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        type: feedType,
        filter,
        page: reset ? '1' : page.toString(),
        limit: (maxItems || 20).toString()
      })

      if (userId) {
        params.append('userId', userId)
      }

      const response = await fetch(`/api/activities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newActivities = data.data.activities || []
          
          if (reset) {
            setActivities(newActivities)
            setPage(2)
          } else {
            setActivities(prev => [...prev, ...newActivities])
            setPage(prev => prev + 1)
          }
          
          setHasMore(data.data.hasMore || false)
        }
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
      showToast.error('加载活动失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreActivities = () => {
    if (!isLoading && hasMore) {
      loadActivities(false)
    }
  }

  const refreshActivities = () => {
    loadActivities(true)
  }

  // 标记为已读
  const markAsRead = async (activityId: string) => {
    try {
      await fetch(`/api/activities/${activityId}/read`, {
        method: 'PUT'
      })
      
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, isRead: true }
          : activity
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
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

  // 获取活动描述
  const getActivityDescription = (activity: ActivityItem) => {
    const { type, actor, target, metadata } = activity
    
    switch (type) {
      case 'article_published':
        return `发布了文章《${target?.title || ''}》`
      case 'article_liked':
        return `点赞了文章《${target?.title || ''}》`
      case 'article_bookmarked':
        return `收藏了文章《${target?.title || ''}》`
      case 'article_shared':
        return `分享了文章《${target?.title || ''}》`
      case 'user_followed':
        return `关注了 ${target?.title || ''}`
      case 'comment_posted':
        return `评论了文章《${target?.title || ''}》`
      case 'article_updated':
        return `更新了文章《${target?.title || ''}》`
      case 'milestone_reached':
        return `达成了里程碑：${metadata?.milestone || ''}`
      default:
        return '进行了一项活动'
    }
  }



  return (
    <div className={cn("space-y-4", className)}>
      {/* 头部和过滤器 */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">活动动态</h2>
          
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部活动</SelectItem>
                <SelectItem value="articles">文章动态</SelectItem>
                <SelectItem value="interactions">互动动态</SelectItem>
                <SelectItem value="follows">关注动态</SelectItem>
                <SelectItem value="comments">评论动态</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshActivities}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      )}

      {/* 活动列表 */}
      <ScrollArea className={compact ? "h-96" : "h-full"}>
        <div className="space-y-3">
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                ref={index === activities.length - 1 ? lastActivityElementRef : null}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !activity.isRead && markAsRead(activity.id)}
              >
                <ActivityCard
                  activity={activity}
                  compact={compact}
                  onRead={() => markAsRead(activity.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 加载状态 */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 无更多数据 */}
          {!isLoading && !hasMore && activities.length > 0 && (
            <div className="text-center py-4 text-muted-foreground">
              没有更多活动了
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && activities.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无活动</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  您可以关注其他用户或发布文章来开始互动
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// 活动卡片组件
function ActivityCard({
  activity,
  compact = false,
  onRead
}: {
  activity: ActivityItem
  compact?: boolean
  onRead?: () => void
}) {
  const { showToast } = useToast()

  // 获取活动图标
  const getActivityIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'article_published':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'article_liked':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'article_bookmarked':
        return <Bookmark className="h-4 w-4 text-yellow-500" />
      case 'article_shared':
        return <Share2 className="h-4 w-4 text-green-500" />
      case 'user_followed':
        return <UserPlus className="h-4 w-4 text-purple-500" />
      case 'comment_posted':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'article_updated':
        return <Edit className="h-4 w-4 text-orange-500" />
      case 'milestone_reached':
        return <TrendingUp className="h-4 w-4 text-pink-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }


  
  const getTargetLink = () => {
    if (!activity.target) return '#'
    
    switch (activity.target.type) {
      case 'article':
        return `/articles/${activity.target.slug}`
      case 'user':
        return `/users/${activity.target.slug}`
      default:
        return '#'
    }
  }

  // 获取活动描述
  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'article_published':
        return `发布了文章《${activity.title}》`
      case 'article_liked':
        return `点赞了文章《${activity.title}》`
      case 'article_bookmarked':
        return `收藏了文章《${activity.title}》`
      case 'article_shared':
        return `分享了文章《${activity.title}》`
      case 'user_followed':
        return `关注了 ${activity.targetUser}`
      case 'comment_posted':
        return `评论了文章《${activity.title}》`
      case 'article_updated':
        return `更新了文章《${activity.title}》`
      case 'milestone_reached':
        return `达成了里程碑：${activity.milestone}`
      default:
        return activity.description || '进行了一项活动'
    }
  }

  return (
    <Card className={cn(
      "transition-colors hover:bg-accent/50 cursor-pointer",
      !activity.isRead && "border-l-4 border-l-primary bg-accent/20"
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          {/* 用户头像 */}
          <Link href={`/users/${activity.actor.username}`}>
            <Avatar className={cn("h-10 w-10", compact && "h-8 w-8")}>
              <AvatarImage src={activity.actor.avatar} />
              <AvatarFallback>
                {activity.actor.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            {/* 活动描述 */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={cn("text-sm", compact && "text-xs")}>
                  <Link 
                    href={`/users/${activity.actor.username}`}
                    className="font-medium hover:underline"
                  >
                    {activity.actor.displayName}
                  </Link>
                  {activity.actor.verified && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      ✓
                    </Badge>
                  )}
                  <span className="ml-1">
                    {getActivityDescription(activity)}
                  </span>
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  {getActivityIcon(activity.type)}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(activity.createdAt)}
                  </span>
                </div>
              </div>

              {!activity.isRead && (
                <div className="h-2 w-2 bg-primary rounded-full ml-2 mt-1" />
              )}
            </div>

            {/* 目标内容预览 */}
            {activity.target && activity.target.type === 'article' && !compact && (
              <Link href={getTargetLink()}>
                <div className="mt-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex gap-3">
                    {activity.target.thumbnail && (
                      <img
                        src={activity.target.thumbnail}
                        alt=""
                        className="w-16 h-16 object-cover object-center rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">
                        {activity.target.title}
                      </h4>
                      {activity.target.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {activity.target.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
