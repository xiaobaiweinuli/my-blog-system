'use client'

import { useState, useEffect } from 'react'
import { formatTime } from '@/lib/utils/time'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Bookmark,
  Award,
  AlertCircle,
  Check,
  X,
  Settings,
  Filter,
  AtSign,
  FileText,
  CheckCircle as MarkAsRead
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'share' | 'bookmark' | 'mention' | 'system'
  title: string
  message: string
  actor?: {
    id: string
    username: string
    displayName: string
    avatar?: string
  }
  target?: {
    id: string
    type: 'article' | 'comment' | 'user'
    title?: string
    slug?: string
  }
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

interface NotificationSettings {
  likes: boolean
  comments: boolean
  follows: boolean
  shares: boolean
  bookmarks: boolean
  mentions: boolean
  system: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
}

interface NotificationSystemProps {
  currentUserId: string
  className?: string
}

export function NotificationSystem({
  currentUserId,
  className
}: NotificationSystemProps) {
  const { showToast } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [settings, setSettings] = useState<NotificationSettings>({
    likes: true,
    comments: true,
    follows: true,
    shares: true,
    bookmarks: true,
    mentions: true,
    system: true,
    emailNotifications: true,
    pushNotifications: false,
    frequency: 'immediate'
  })



  // 加载通知
  useEffect(() => {
    loadNotifications()
    loadSettings()
    
    // 设置定期检查新通知
    const interval = setInterval(loadNotifications, 30000) // 30秒检查一次
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.data.notifications || [])
          setUnreadCount(data.data.unreadCount || 0)
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(data.data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  // 标记为已读
  const markAsRead = async (notificationId?: string) => {
    try {
      const url = notificationId 
        ? `/api/notifications/${notificationId}/read`
        : '/api/notifications/read-all'
      
      const response = await fetch(url, { method: 'PUT' })
      
      if (response.ok) {
        if (notificationId) {
          setNotifications(prev => prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          ))
          setUnreadCount(prev => Math.max(0, prev - 1))
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        showToast.success('通知已删除')
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      showToast.error('删除通知失败')
    }
  }

  // 更新设置
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }))
        showToast.success('设置已更新')
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      showToast.error('更新设置失败')
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

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.isRead
    return notification.type === filter
  })

  return (
    <div className={className}>
      {/* 通知按钮 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知
                {unreadCount > 0 && (
                  <Badge variant="secondary">
                    {unreadCount} 未读
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead()}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    全部标记为已读
                  </Button>
                )}
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>通知设置</DialogTitle>
                    </DialogHeader>
                    <NotificationSettings
                      settings={settings}
                      onUpdate={updateSettings}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" onClick={() => setFilter('all')}>
                全部
              </TabsTrigger>
              <TabsTrigger value="unread" onClick={() => setFilter('unread')}>
                未读
              </TabsTrigger>
              <TabsTrigger value="interactions" onClick={() => setFilter('like')}>
                互动
              </TabsTrigger>
              <TabsTrigger value="system" onClick={() => setFilter('system')}>
                系统
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无通知</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 通知项组件
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete
}: {
  notification: Notification
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  const { showToast } = useToast()

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />
      case 'article':
        return <FileText className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead()
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent/50",
        !notification.isRead && "border-l-4 border-l-primary bg-accent/20"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 通知图标 */}
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>

          {/* 用户头像 */}
          {notification.actor && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.actor.avatar} />
              <AvatarFallback>
                {notification.actor.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}

          {/* 通知内容 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatTime(notification.createdAt)}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead()
                }}
                title="标记为已读"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title="删除"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 通知设置组件
function NotificationSettings({
  settings,
  onUpdate
}: {
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => void
}) {
  const { showToast } = useToast()

  return (
    <div className="space-y-6">
      {/* 通知类型设置 */}
      <div>
        <h4 className="font-medium mb-4">通知类型</h4>
        <div className="space-y-3">
          {Object.entries(settings).slice(0, 7).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-sm">
                {key === 'likes' ? '点赞' : key === 'comments' ? '评论' : key === 'follows' ? '关注' : key === 'shares' ? '分享' : key === 'bookmarks' ? '收藏' : key === 'mentions' ? '提及' : key === 'system' ? '系统' : ''}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) => 
                  onUpdate({ [key]: checked })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* 通知方式设置 */}
      <div>
        <h4 className="font-medium mb-4">通知方式</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="text-sm">
              邮件通知
            </Label>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                onUpdate({ emailNotifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications" className="text-sm">
              推送通知
            </Label>
            <Switch
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => 
                onUpdate({ pushNotifications: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* 通知频率设置 */}
      <div>
        <h4 className="font-medium mb-4">通知频率</h4>
        <Select
          value={settings.frequency}
          onValueChange={(value: any) => onUpdate({ frequency: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">立即</SelectItem>
            <SelectItem value="hourly">每小时</SelectItem>
            <SelectItem value="daily">每天</SelectItem>
            <SelectItem value="weekly">每周</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
