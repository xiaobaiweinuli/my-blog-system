'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  User,
  Globe,
  Tag,
  Calendar
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface NewsletterConfig {
  provider: 'mailchimp' | 'convertkit' | 'sendinblue' | 'custom'
  apiKey: string
  listId: string
  doubleOptIn: boolean
  welcomeEmail: boolean
  captureFields: ('name' | 'tags' | 'language')[]
  frequency: 'daily' | 'weekly' | 'monthly'
  customFields: {
    name: string
    value: string
  }[]
}

interface NewsletterStats {
  subscribers: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
  lastCampaign: {
    title: string
    date: string
    opens: number
    clicks: number
  }
}

interface NewsletterSubscriptionProps {
  variant?: 'inline' | 'card' | 'popup' | 'minimal'
  position?: 'sidebar' | 'footer' | 'article' | 'popup'
  showStats?: boolean
  showSettings?: boolean
  className?: string
}

export function NewsletterSubscription({
  variant = 'card',
  position = 'sidebar',
  showStats = false,
  showSettings = false,
  className
}: NewsletterSubscriptionProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '订阅我们的通讯',
      subtitle: '获取最新的文章和更新',
      placeholder: '输入您的邮箱地址',
      subscribe: '订阅',
      subscribed: '订阅成功',
      error: '订阅失败',
      unsubscribe: '取消订阅',
      unsubscribed: '取消订阅成功',
      emailRequired: '请输入邮箱地址',
      emailPlaceholder: '输入您的邮箱地址',
      namePlaceholder: '输入您的姓名',
      subscribeSuccess: '订阅成功！',
      subscribeFailed: '订阅失败',
      configUpdated: '配置已更新',
      updateConfigFailed: '更新配置失败',
      subscribers: '订阅者',
      openRate: '打开率',
      clickRate: '点击率',
      unsubscribeRate: '退订率',
      lastCampaign: '最后活动',
      settings: '设置',
      stats: '统计',
      provider: '服务商',
      apiKey: 'API密钥',
      listId: '列表ID',
      doubleOptIn: '双重确认',
      welcomeEmail: '欢迎邮件',
      captureFields: '捕获字段',
      frequency: '频率',
      customFields: '自定义字段',
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      save: '保存',
      cancel: '取消',
      loading: '加载中...',
    }
    return translations[key] || key
  }
  
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [language, setLanguage] = useState('zh')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [config, setConfig] = useState<NewsletterConfig>({
    provider: 'mailchimp',
    apiKey: '',
    listId: '',
    doubleOptIn: true,
    welcomeEmail: true,
    captureFields: ['name'],
    frequency: 'weekly',
    customFields: []
  })
  const [stats, setStats] = useState<NewsletterStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 加载配置和统计数据
  useEffect(() => {
    loadNewsletterConfig()
    if (showStats) {
      loadNewsletterStats()
    }
  }, [showStats])

  const loadNewsletterConfig = async () => {
    try {
      const response = await fetch('/api/integrations/newsletter/config')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConfig(data.data.config)
        }
      }
    } catch (error) {
      console.error('Failed to load newsletter config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNewsletterStats = async () => {
    try {
      const response = await fetch('/api/integrations/newsletter/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to load newsletter stats:', error)
    }
  }

  // 更新配置
  const updateConfig = async (newConfig: Partial<NewsletterConfig>) => {
    try {
      const response = await fetch('/api/integrations/newsletter/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })

      if (response.ok) {
        setConfig(prev => ({ ...prev, ...newConfig }))
        showToast.success(t('configUpdated'))
      }
    } catch (error) {
      console.error('Failed to update newsletter config:', error)
      showToast.error(t('updateConfigFailed'))
    }
  }

  // 提交订阅
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      showToast.error(t('emailRequired'))
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = { email }

      if (config.captureFields.includes('name') && name) {
        payload.name = name
      }

      if (config.captureFields.includes('tags') && tags.length > 0) {
        payload.tags = tags
      }

      if (config.captureFields.includes('language')) {
        payload.language = language
      }

      const response = await fetch('/api/integrations/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsSubscribed(true)
          setEmail('')
          setName('')
          setTags([])
          showToast.success(t('subscribeSuccess'))
        } else {
          showToast.error(data.error || t('subscribeFailed'))
        }
      } else {
        showToast.error(t('subscribeFailed'))
      }
    } catch (error) {
      console.error('Newsletter subscription failed:', error)
      showToast.error(t('subscribeFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 渲染不同变体的订阅表单
  const renderSubscriptionForm = () => {
    switch (variant) {
      case 'inline':
        return (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            {config.captureFields.includes('name') && (
              <Input
                id="newsletter-name"
                aria-label={t('name')}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="flex-1"
              />
            )}
            <Input
              id="newsletter-email"
              aria-label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t('subscribe')}
            </Button>
          </form>
        )

      case 'minimal':
        return (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              id="newsletter-email"
              aria-label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )

      case 'popup':
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                {t('subscribeToNewsletter')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('subscribeToNewsletter')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {config.captureFields.includes('name') && (
                  <div>
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>

                {config.captureFields.includes('language') && (
                  <div>
                    <Label htmlFor="language">{t('preferredLanguage')}</Label>
                    <Select value="zh" disabled>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {t('subscribe')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )

      case 'card':
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('subscribeToNewsletter')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t('newsletterDescription')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {config.captureFields.includes('name') && (
                  <div>
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="newsletter-email"
                    aria-label={t('email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>

                {config.captureFields.includes('tags') && (
                  <div>
                    <Label>{t('interests')}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['technology', 'design', 'development', 'business'].map((tag) => (
                        <div key={tag} className="flex items-center gap-2">
                          <Switch
                            id={`tag-${tag}`}
                            checked={tags.includes(tag)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTags(prev => [...prev, tag])
                              } else {
                                setTags(prev => prev.filter(t => t !== tag))
                              }
                            }}
                          />
                          <Label htmlFor={`tag-${tag}`} className="text-sm">
                            {t(`tag.${tag}`)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {config.captureFields.includes('language') && (
                  <div>
                    <Label htmlFor="language">{t('preferredLanguage')}</Label>
                    <Select value="zh" disabled>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {t('subscribe')}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              {t('privacyNotice')}
            </CardFooter>
          </Card>
        )
    }
  }

  // 渲染统计数据
  const renderStats = () => {
    if (!stats) return null

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">{t('newsletterStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.subscribers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{t('subscribers')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.openRate}%</div>
              <div className="text-xs text-muted-foreground">{t('openRate')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.clickRate}%</div>
              <div className="text-xs text-muted-foreground">{t('clickRate')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.unsubscribeRate}%</div>
              <div className="text-xs text-muted-foreground">{t('unsubscribeRate')}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">{t('lastCampaign')}</div>
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between mb-1">
                <span>{stats.lastCampaign.title}</span>
                <span>{new Date(stats.lastCampaign.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('opens')}: {stats.lastCampaign.opens}</span>
                <span>{t('clicks')}: {stats.lastCampaign.clicks}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 渲染设置面板
  const renderSettings = () => {
    if (!showSettings) return null

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-4">
            <Settings className="h-4 w-4 mr-2" />
            {t('newsletterSettings')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('newsletterSettings')}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t('general')}</TabsTrigger>
              <TabsTrigger value="provider">{t('provider')}</TabsTrigger>
              <TabsTrigger value="fields">{t('fields')}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="doubleOptIn">{t('doubleOptIn')}</Label>
                <Switch
                  id="doubleOptIn"
                  checked={config.doubleOptIn}
                  onCheckedChange={(checked) => updateConfig({ doubleOptIn: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="welcomeEmail">{t('welcomeEmail')}</Label>
                <Switch
                  id="welcomeEmail"
                  checked={config.welcomeEmail}
                  onCheckedChange={(checked) => updateConfig({ welcomeEmail: checked })}
                />
              </div>

              <div>
                <Label htmlFor="frequency">{t('frequency')}</Label>
                <Select
                  value={config.frequency}
                  onValueChange={(value: any) => updateConfig({ frequency: value })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('daily')}</SelectItem>
                    <SelectItem value="weekly">{t('weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="provider" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="provider">{t('provider')}</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: any) => updateConfig({ provider: value })}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    <SelectItem value="convertkit">ConvertKit</SelectItem>
                    <SelectItem value="sendinblue">Sendinblue</SelectItem>
                    <SelectItem value="custom">{t('custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="apiKey">{t('apiKey')}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateConfig({ apiKey: e.target.value })}
                  placeholder="••••••••••••••••"
                />
              </div>

              <div>
                <Label htmlFor="listId">{t('listId')}</Label>
                <Input
                  id="listId"
                  value={config.listId}
                  onChange={(e) => updateConfig({ listId: e.target.value })}
                  placeholder="list_123456"
                />
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('captureFields')}</Label>

                <div className="flex items-center justify-between">
                  <Label htmlFor="captureName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('name')}
                  </Label>
                  <Switch
                    id="captureName"
                    checked={config.captureFields.includes('name')}
                    onCheckedChange={(checked) => {
                      const newFields = checked
                        ? [...config.captureFields, 'name' as const]
                        : config.captureFields.filter(f => f !== 'name')
                      updateConfig({ captureFields: newFields as ('name' | 'language' | 'tags')[] })
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="captureTags" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t('tags')}
                  </Label>
                  <Switch
                    id="captureTags"
                    checked={config.captureFields.includes('tags')}
                    onCheckedChange={(checked) => {
                      const newFields = checked
                        ? [...config.captureFields, 'tags' as const]
                        : config.captureFields.filter(f => f !== 'tags')
                      updateConfig({ captureFields: newFields as ('name' | 'language' | 'tags')[] })
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="captureLanguage" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('language')}
                  </Label>
                  <Switch
                    id="captureLanguage"
                    checked={config.captureFields.includes('language')}
                    onCheckedChange={(checked) => {
                      const newFields = checked
                        ? [...config.captureFields, 'language' as const]
                        : config.captureFields.filter(f => f !== 'language')
                      updateConfig({ captureFields: newFields as ('name' | 'language' | 'tags')[] })
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    )
  }

  // 渲染成功订阅消息
  const renderSuccessMessage = () => {
    if (!isSubscribed) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>{t('thankYou')}</AlertTitle>
          <AlertDescription>
            {t('subscribeConfirmation')}
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  return (
    <div className={className}>
      {renderSubscriptionForm()}
      {renderSuccessMessage()}
      {showStats && renderStats()}
      {showSettings && renderSettings()}
    </div>
  )
}