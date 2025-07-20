'use client'

import { useState, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, 
  UserMinus, 
  Users, 
  Heart,
  MessageCircle,
  Share2,
  Bell,
  BellOff,
  Check,
  X,
  MoreHorizontal,
  UserCheck,
  UserX
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  verified?: boolean
  followersCount: number
  followingCount: number
  articlesCount: number
  isFollowing?: boolean
  isFollowedBy?: boolean
  mutualFollowersCount?: number
  lastActiveAt?: string
}

interface FollowSystemProps {
  currentUser: User
  targetUser?: User
  onFollow?: (userId: string) => Promise<void>
  onUnfollow?: (userId: string) => Promise<void>
  onBlock?: (userId: string) => Promise<void>
  onUnblock?: (userId: string) => Promise<void>
  className?: string
}

export function FollowSystem({
  currentUser,
  targetUser,
  onFollow,
  onUnfollow,
  onBlock,
  onUnblock,
  className
}: FollowSystemProps) {
  const { showToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false)
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // 加载关注数据
  useEffect(() => {
    if (targetUser) {
      loadFollowData()
      loadSuggestions()
    }
  }, [targetUser])

  const loadFollowData = async () => {
    if (!targetUser) return

    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/users/${targetUser.id}/followers`),
        fetch(`/api/users/${targetUser.id}/following`)
      ])

      if (followersRes.ok && followingRes.ok) {
        const followersData = await followersRes.json()
        const followingData = await followingRes.json()
        
        if (followersData.success) setFollowers(followersData.data.users || [])
        if (followingData.success) setFollowing(followingData.data.users || [])
      }
    } catch (error) {
      console.error('Failed to load follow data:', error)
    }
  }

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/users/suggestions')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data.users || [])
        }
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  // 关注用户
  const handleFollow = async (userId: string) => {
    if (!onFollow) return

    setIsLoading(true)
    try {
      await onFollow(userId)
      showToast.success('关注成功')
      await loadFollowData()
    } catch (error) {
      console.error('Follow failed:', error)
      showToast.error('关注失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 取消关注
  const handleUnfollow = async (userId: string) => {
    if (!onUnfollow) return

    setIsLoading(true)
    try {
      await onUnfollow(userId)
      showToast.success('取消关注成功')
      await loadFollowData()
    } catch (error) {
      console.error('Unfollow failed:', error)
      showToast.error('取消关注失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 屏蔽用户
  const handleBlock = async (userId: string) => {
    if (!onBlock) return

    setIsLoading(true)
    try {
      await onBlock(userId)
      showToast.success('屏蔽成功')
      await loadFollowData()
    } catch (error) {
      console.error('Block failed:', error)
      showToast.error('屏蔽失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 切换通知
  const toggleNotifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !notifications })
      })

      if (response.ok) {
        setNotifications(!notifications)
        showToast.success(notifications ? '通知已禁用' : '通知已启用')
      }
    } catch (error) {
      console.error('Toggle notifications failed:', error)
      showToast.error('切换通知失败')
    }
  }

  // 过滤用户列表
  const filterUsers = (users: User[], query: string) => {
    if (!query) return users
    return users.filter(user => 
      user.displayName.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    )
  }

  // 格式化时间
  const formatLastActive = (dateString?: string) => {
    if (!dateString) return '从未活跃'
    
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return '刚刚活跃'
    if (hours < 24) return `${hours}小时前活跃`
    if (days < 7) return `${days}天前活跃`
    return `${Math.floor(days / 7)}周前活跃`
  }

  if (!targetUser) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* 关注建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              关注建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.slice(0, 5).map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  showFollowButton={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 关注按钮和统计 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={targetUser.avatar} />
                <AvatarFallback>
                  {targetUser.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{targetUser.displayName}</h3>
                  {targetUser.verified && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      已认证
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{targetUser.username}</p>
                {targetUser.bio && (
                  <p className="text-sm mt-1">{targetUser.bio}</p>
                )}
              </div>
            </div>

            {currentUser.id !== targetUser.id && (
              <div className="flex items-center gap-2">
                {targetUser.isFollowing ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      onClick={() => handleUnfollow(targetUser.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      已关注
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNotifications(targetUser.id)}
                      title={notifications ? '禁用通知' : '启用通知'}
                    >
                      {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleFollow(targetUser.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {targetUser.isFollowedBy ? '回关' : '关注'}
                  </Button>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>用户操作</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleBlock(targetUser.id)}
                        className="w-full justify-start"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        屏蔽用户
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t">
            <Dialog open={isFollowersDialogOpen} onOpenChange={setIsFollowersDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center p-2">
                  <span className="text-lg font-semibold">{targetUser.followersCount}</span>
                  <span className="text-sm text-muted-foreground">粉丝</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>粉丝</DialogTitle>
                </DialogHeader>
                <UserListDialog
                  users={followers}
                  currentUser={currentUser}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isFollowingDialogOpen} onOpenChange={setIsFollowingDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center p-2">
                  <span className="text-lg font-semibold">{targetUser.followingCount}</span>
                  <span className="text-sm text-muted-foreground">关注</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>关注</DialogTitle>
                </DialogHeader>
                <UserListDialog
                  users={following}
                  currentUser={currentUser}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </DialogContent>
            </Dialog>

            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{targetUser.articlesCount}</span>
              <span className="text-sm text-muted-foreground">文章</span>
            </div>

            {targetUser.mutualFollowersCount && targetUser.mutualFollowersCount > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{targetUser.mutualFollowersCount}</span>
                <span className="text-sm text-muted-foreground">互关</span>
              </div>
            )}
          </div>

          {/* 最后活跃时间 */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              最后活跃: {formatLastActive(targetUser.lastActiveAt)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 用户卡片组件
function UserCard({
  user,
  currentUser,
  onFollow,
  onUnfollow,
  showFollowButton = false
}: {
  user: User
  currentUser: User
  onFollow?: (userId: string) => Promise<void>
  onUnfollow?: (userId: string) => Promise<void>
  showFollowButton?: boolean
}) {

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.displayName}</span>
            {user.verified && (
              <Check className="h-3 w-3 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && (
            <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
          )}
        </div>
      </div>

      {showFollowButton && currentUser.id !== user.id && (
        <Button
          size="sm"
          variant={user.isFollowing ? "outline" : "default"}
          onClick={() => user.isFollowing ? onUnfollow?.(user.id) : onFollow?.(user.id)}
        >
          {user.isFollowing ? '已关注' : '关注'}
        </Button>
      )}
    </div>
  )
}

// 用户列表对话框
function UserListDialog({
  users,
  currentUser,
  onFollow,
  onUnfollow,
  searchQuery,
  onSearchChange
}: {
  users: User[]
  currentUser: User
  onFollow?: (userId: string) => Promise<void>
  onUnfollow?: (userId: string) => Promise<void>
  searchQuery: string
  onSearchChange: (query: string) => void
}) {

  // 过滤用户列表
  const filterUsers = (users: User[], query: string) => {
    if (!query) return users
    return users.filter(user =>
      user.displayName.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    )
  }

  const filteredUsers = filterUsers(users, searchQuery)

  return (
    <div className="space-y-4">
      <Input
        placeholder="搜索用户"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
              showFollowButton={true}
            />
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? '未找到用户' : '暂无用户'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
