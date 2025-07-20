'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Webhook, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Settings,
  Code,
  Clock,
  Activity,
  ExternalLink,
  Copy,
  TestTube
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  secret?: string
  headers?: Record<string, string>
  retryCount: number
  timeout: number
  createdAt: string
  lastTriggered?: string
  successCount: number
  failureCount: number
}

interface WebhookEvent {
  id: string
  webhookId: string
  event: string
  payload: any
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempts: number
  response?: string
  error?: string
  timestamp: string
}

interface WebhookManagerProps {
  className?: string
}

export function WebhookManager({ className }: WebhookManagerProps) {
  const { showToast } = useToast()
  
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<WebhookConfig>>({
    name: '',
    url: '',
    events: [],
    active: true,
    retryCount: 3,
    timeout: 30,
    headers: {}
  })

  // 可用的事件类型
  const availableEvents = [
    'article.created',
    'article.updated',
    'article.deleted',
    'article.published',
    'comment.created',
    'comment.updated',
    'comment.deleted',
    'user.registered',
    'user.updated',
    'user.deleted',
    'subscription.created',
    'subscription.cancelled'
  ]

  // 加载Webhook数据
  useEffect(() => {
    loadWebhooks()
    loadWebhookEvents()
  }, [])

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWebhooks(data.data.webhooks)
        }
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error)
      showToast.error('加载Webhook失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebhookEvents = async () => {
    try {
      const response = await fetch('/api/webhooks/events')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEvents(data.data.events)
        }
      }
    } catch (error) {
      console.error('Failed to load webhook events:', error)
    }
  }

  // 创建或更新Webhook
  const saveWebhook = async () => {
    try {
      const method = selectedWebhook ? 'PUT' : 'POST'
      const url = selectedWebhook ? `/api/webhooks/${selectedWebhook.id}` : '/api/webhooks'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(selectedWebhook ? 'Webhook已更新' : 'Webhook已创建')
          setIsEditing(false)
          setSelectedWebhook(null)
          setFormData({
            name: '',
            url: '',
            events: [],
            active: true,
            retryCount: 3,
            timeout: 30,
            headers: {}
          })
          await loadWebhooks()
        }
      }
    } catch (error) {
      console.error('Failed to save webhook:', error)
      showToast.error('保存Webhook失败')
    }
  }

  // 删除Webhook
  const deleteWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast.success('Webhook已删除')
        await loadWebhooks()
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error)
      showToast.error('删除Webhook失败')
    }
  }

  // 切换Webhook状态
  const toggleWebhook = async (webhookId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      })

      if (response.ok) {
        showToast.success(active ? 'Webhook已启用' : 'Webhook已禁用')
        await loadWebhooks()
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error)
      showToast.error('切换Webhook状态失败')
    }
  }

  // 测试Webhook
  const testWebhook = async (webhookId: string) => {
    setIsTesting(webhookId)
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success('Webhook测试成功')
        } else {
          showToast.error(data.error || 'Webhook测试失败')
        }
      }
    } catch (error) {
      console.error('Failed to test webhook:', error)
      showToast.error('Webhook测试失败')
    } finally {
      setIsTesting(null)
    }
  }

  // 重试失败的事件
  const retryEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/webhooks/events/${eventId}/retry`, {
        method: 'POST'
      })

      if (response.ok) {
        showToast.success('事件重试成功')
        await loadWebhookEvents()
      }
    } catch (error) {
      console.error('Failed to retry event:', error)
      showToast.error('事件重试失败')
    }
  }

  // 编辑Webhook
  const editWebhook = (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      secret: webhook.secret,
      headers: webhook.headers || {},
      retryCount: webhook.retryCount,
      timeout: webhook.timeout
    })
    setIsEditing(true)
  }

  // 复制Webhook URL
  const copyWebhookUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast.success('URL已复制')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      showToast.error('复制失败')
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'retrying':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 渲染Webhook卡片
  const renderWebhookCard = (webhook: WebhookConfig) => (
    <Card key={webhook.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{webhook.name}</CardTitle>
            <p className="text-sm text-muted-foreground truncate">{webhook.url}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", webhook.active ? "bg-green-500" : "bg-gray-500")} />
            <Badge variant={webhook.active ? "default" : "secondary"}>
              {webhook.active ? '已启用' : '已禁用'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">事件</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {webhook.events.slice(0, 3).map((event, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {event.replace('.', '').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
              {webhook.events.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{webhook.events.length - 3}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">成功数</Label>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" />
                {webhook.successCount}
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">失败数</Label>
              <div className="flex items-center gap-1">
                <X className="h-3 w-3 text-red-500" />
                {webhook.failureCount}
              </div>
            </div>
          </div>
          
          {webhook.lastTriggered && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">最后触发</Label>
              <div className="text-sm">{new Date(webhook.lastTriggered).toLocaleString()}</div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyWebhookUrl(webhook.url)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => testWebhook(webhook.id)}
            disabled={isTesting === webhook.id}
          >
            {isTesting === webhook.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={webhook.active}
            onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => editWebhook(webhook)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteWebhook(webhook.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  // 渲染事件列表
  const renderEventsList = () => (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-2 h-2 rounded-full", getStatusColor(event.status))} />
                  <span className="font-medium">{event.event.replace('.', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <Badge variant="outline" className="text-xs">
                    {event.status === 'success' ? '成功' : event.status === 'failed' ? '失败' : event.status === 'pending' ? '待处理' : '重试中'}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-4 mb-1">
                    <span>尝试次数: {event.attempts}</span>
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  
                  {event.error && (
                    <div className="text-red-600 text-xs mt-1">
                      {event.error}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Code className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>事件详情</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-medium">Payload</Label>
                        <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-64">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                      
                      {event.response && (
                        <div>
                          <Label className="text-sm font-medium">Response</Label>
                          <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                            {event.response}
                          </pre>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                {event.status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryEvent(event.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {events.length === 0 && (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">暂无事件</h3>
          <p className="text-sm text-muted-foreground">
            暂无Webhook事件记录。
          </p>
        </div>
      )}
    </div>
  )

  // 渲染编辑对话框
  const renderEditDialog = () => (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedWebhook ? '编辑Webhook' : '创建Webhook'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="webhook-name-input">名称</Label>
              <Input
                id="webhook-name-input"
                aria-label="名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Webhook名称"
              />
            </div>
            
            <div>
              <Label htmlFor="webhook-url-input">URL</Label>
              <Input
                id="webhook-url-input"
                aria-label="URL"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/webhook"
              />
            </div>
          </div>
          
          <div>
            <Label>事件</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableEvents.map((event) => (
                <div key={event} className="flex items-center gap-2">
                  <Switch
                    id={`event-${event}`}
                    checked={formData.events?.includes(event)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          events: [...(prev.events || []), event]
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          events: prev.events?.filter(e => e !== event) || []
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={`event-${event}`} className="text-sm">
                    {event.replace('.', '').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retryCount">重试次数</Label>
              <Input
                id="retryCount"
                type="number"
                min="0"
                max="10"
                value={formData.retryCount}
                onChange={(e) => setFormData(prev => ({ ...prev, retryCount: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="timeout">超时时间 (秒)</Label>
              <Input
                id="timeout"
                type="number"
                min="5"
                max="300"
                value={formData.timeout}
                onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="secret">密钥 (可选)</Label>
            <Input
              id="secret"
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
              placeholder="密钥"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">启用</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                取消
              </Button>
              
              <Button onClick={saveWebhook}>
                {selectedWebhook ? '更新' : '创建'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhook管理
          </h1>
          <p className="text-muted-foreground">管理您的Webhook配置和事件。</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadWebhooks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建Webhook
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">
            Webhook ({webhooks.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            事件 ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                      <div className="h-20 bg-muted rounded mb-4" />
                      <div className="h-8 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webhooks.map(renderWebhookCard)}
            </div>
          )}
          
          {!isLoading && webhooks.length === 0 && (
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">暂无Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                请创建您的第一个Webhook。
              </p>
              <Button onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建第一个Webhook
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events">
          {renderEventsList()}
        </TabsContent>
      </Tabs>

      {/* 编辑对话框 */}
      {renderEditDialog()}
    </div>
  )
}
