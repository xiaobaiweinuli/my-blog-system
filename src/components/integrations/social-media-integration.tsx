'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Instagram,
  Youtube,
  Github,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  ExternalLink,
  Copy,
  MessageSquare,
  ThumbsUp,
  Eye
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface SocialAccount {
  id: string
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'youtube' | 'github'
  username: string
  displayName: string
  profileUrl: string
  connected: boolean
  autoShare: boolean
  lastSynced?: string
}

interface SocialPost {
  id: string
  platform: string
  content: string
  url: string
  publishedAt: string
  likes: number
  comments: number
  shares: number
  views: number
}

interface SocialMediaIntegrationProps {
  variant?: 'share' | 'connect' | 'dashboard' | 'embed'
  url?: string
  title?: string
  summary?: string
  showStats?: boolean
  className?: string
}

export function SocialMediaIntegration({
  variant = 'share',
  url = '',
  title = '',
  summary = '',
  showStats = false,
  className
}: SocialMediaIntegrationProps) {
  const { showToast } = useToast()
  
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')

  // 加载社交账号
  useEffect(() => {
    loadSocialAccounts()
    if (showStats) {
      loadSocialPosts()
    }
  }, [showStats])

  const loadSocialAccounts = async () => {
    try {
      const response = await fetch('/api/integrations/social/accounts')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAccounts(data.data.accounts)
        }
      }
    } catch (error) {
      console.error('Failed to load social accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSocialPosts = async () => {
    try {
      const response = await fetch('/api/integrations/social/posts')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPosts(data.data.posts)
        }
      }
    } catch (error) {
      console.error('Failed to load social posts:', error)
    }
  }

  // 连接社交账号
  const connectAccount = async (platform: string) => {
    try {
      const response = await fetch('/api/integrations/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // 在实际应用中，这里应该重定向到OAuth授权页面
          // window.location.href = data.data.authUrl
          
          // 模拟成功连接
          showToast.success(`${platform} 连接成功`)
          loadSocialAccounts()
        }
      }
    } catch (error) {
      console.error('Failed to connect account:', error)
      showToast.error('连接失败')
    }
  }

  // 断开社交账号
  const disconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/integrations/social/disconnect/${accountId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAccounts(prev => prev.filter(account => account.id !== accountId))
        showToast.success('断开连接成功')
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      showToast.error('断开连接失败')
    }
  }

  // 更新账号设置
  const updateAccountSettings = async (accountId: string, settings: Partial<SocialAccount>) => {
    try {
      const response = await fetch(`/api/integrations/social/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setAccounts(prev => prev.map(account => 
          account.id === accountId ? { ...account, ...settings } : account
        ))
        showToast.success('设置已更新')
      }
    } catch (error) {
      console.error('Failed to update account settings:', error)
      showToast.error('更新设置失败')
    }
  }

  // 分享到社交媒体
  const shareToSocial = async () => {
    if (selectedPlatforms.length === 0) {
      showToast.error('请选择要分享的平台')
      return
    }

    setIsSharing(true)
    try {
      const response = await fetch('/api/integrations/social/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          url,
          title,
          summary,
          message: customMessage
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success('分享成功')
          setSelectedPlatforms([])
          setCustomMessage('')
        } else {
          showToast.error(data.error || '分享失败')
        }
      } else {
        showToast.error('分享失败')
      }
    } catch (error) {
      console.error('Social sharing failed:', error)
      showToast.error('分享失败')
    } finally {
      setIsSharing(false)
    }
  }

  // 复制分享链接
  const copyShareLink = async (platform: string) => {
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }
    
    try {
      await navigator.clipboard.writeText(shareUrls[platform] || url)
      showToast.success('链接已复制')
    } catch (error) {
      console.error('Failed to copy link:', error)
      showToast.error('复制失败')
    }
  }

  // 获取平台图标
  const getPlatformIcon = (platform: string, size = 4) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className={`h-${size} w-${size}`} />
      case 'facebook':
        return <Facebook className={`h-${size} w-${size}`} />
      case 'linkedin':
        return <Linkedin className={`h-${size} w-${size}`} />
      case 'instagram':
        return <Instagram className={`h-${size} w-${size}`} />
      case 'youtube':
        return <Youtube className={`h-${size} w-${size}`} />
      case 'github':
        return <Github className={`h-${size} w-${size}`} />
      default:
        return <Share2 className={`h-${size} w-${size}`} />
    }
  }

  // 渲染分享按钮
  const renderShareButtons = () => {
    const platforms = ['twitter', 'facebook', 'linkedin']
    
    return (
      <div className="flex flex-wrap gap-2">
        {platforms.map(platform => (
          <Button
            key={platform}
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2",
              platform === 'twitter' && "hover:bg-[#1DA1F2]/10",
              platform === 'facebook' && "hover:bg-[#4267B2]/10",
              platform === 'linkedin' && "hover:bg-[#0077B5]/10"
            )}
            onClick={() => window.open(
              platform === 'twitter'
                ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
                : platform === 'facebook'
                ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
              '_blank'
            )}
          >
            {getPlatformIcon(platform)}
            {platform}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyShareLink('url')}
        >
          <Copy className="h-4 w-4 mr-2" />
          复制链接
        </Button>
      </div>
    )
  }

  // 渲染连接账号界面
  const renderConnectAccounts = () => {
    const platforms = ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'github']
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            连接社交媒体账号
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platforms.map(platform => {
              const account = accounts.find(a => a.platform === platform)
              
              return (
                <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(platform, 5)}
                    <div>
                      <h4 className="font-medium">{platform}</h4>
                      {account?.connected && (
                        <p className="text-sm text-muted-foreground">
                          {account.username}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {account?.connected ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(account.profileUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectAccount(account.id)}
                      >
                        断开连接
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => connectAccount(platform)}
                    >
                      连接
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 渲染社交媒体仪表板
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                已连接账号
              </div>
              
              <Button variant="outline" size="sm" onClick={loadSocialAccounts}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.filter(a => a.connected).map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(account.platform, 5)}
                    <div>
                      <h4 className="font-medium">{account.displayName}</h4>
                      <p className="text-sm text-muted-foreground">
                        @{account.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`autoShare-${account.id}`} className="text-sm">
                        自动分享
                      </Label>
                      <Switch
                        id={`autoShare-${account.id}`}
                        checked={account.autoShare}
                        onCheckedChange={(checked) => 
                          updateAccountSettings(account.id, { autoShare: checked })
                        }
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(account.profileUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {accounts.filter(a => a.connected).length === 0 && (
                <div className="text-center py-6">
                  <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无已连接账号</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    请点击下方按钮连接您的社交媒体账号
                  </p>
                  <Button onClick={() => connectAccount('twitter')}>
                    连接账号
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {showStats && (
          <Card>
            <CardHeader>
              <CardTitle>最近动态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getPlatformIcon(post.platform)}
                      <span className="text-sm font-medium">{post.platform}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-3">{post.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.comments}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        {post.shares}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </div>
                      
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-auto p-0 h-auto"
                        onClick={() => window.open(post.url, '_blank')}
                      >
                        查看
                      </Button>
                    </div>
                  </div>
                ))}
                
                {posts.length === 0 && (
                  <div className="text-center py-6">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无动态</h3>
                    <p className="text-sm text-muted-foreground">
                      您可以连接您的社交媒体账号来查看动态
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>分享内容</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>选择平台</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {accounts.filter(a => a.connected).map(account => (
                    <div key={account.id} className="flex items-center gap-2">
                      <Switch
                        id={`platform-${account.id}`}
                        checked={selectedPlatforms.includes(account.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlatforms(prev => [...prev, account.id])
                          } else {
                            setSelectedPlatforms(prev => prev.filter(id => id !== account.id))
                          }
                        }}
                      />
                      <Label htmlFor={`platform-${account.id}`} className="text-sm flex items-center gap-1">
                        {getPlatformIcon(account.platform, 3)}
                        {account.username}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="customMessage">自定义消息</Label>
                <Input
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="请输入分享消息"
                />
              </div>
              
              <Button
                onClick={shareToSocial}
                disabled={isSharing || selectedPlatforms.length === 0}
                className="w-full"
              >
                {isSharing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                分享
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 渲染社交媒体嵌入
  const renderEmbed = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>嵌入社交媒体动态</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="twitter">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="twitter" className="pt-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <Twitter className="h-8 w-8 mx-auto mb-2" />
                  <p className="mb-4">Twitter 动态嵌入说明：</p>
                  <Input
                    value="https://twitter.com/username"
                    readOnly
                    className="mb-4"
                  />
                  <Button variant="outline">
                    生成嵌入代码
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="instagram" className="pt-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <Instagram className="h-8 w-8 mx-auto mb-2" />
                  <p className="mb-4">Instagram 动态嵌入说明：</p>
                  <Input
                    value="https://www.instagram.com/p/postid/"
                    readOnly
                    className="mb-4"
                  />
                  <Button variant="outline">
                    生成嵌入代码
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="youtube" className="pt-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <Youtube className="h-8 w-8 mx-auto mb-2" />
                  <p className="mb-4">YouTube 动态嵌入说明：</p>
                  <Input
                    value="https://www.youtube.com/watch?v=videoid"
                    readOnly
                    className="mb-4"
                  />
                  <Button variant="outline">
                    生成嵌入代码
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  // 根据变体渲染不同的组件
  const renderByVariant = () => {
    switch (variant) {
      case 'share':
        return renderShareButtons()
      case 'connect':
        return renderConnectAccounts()
      case 'dashboard':
        return renderDashboard()
      case 'embed':
        return renderEmbed()
      default:
        return renderShareButtons()
    }
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={className}>
      {renderByVariant()}
    </div>
  )
}
