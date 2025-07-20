'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  RefreshCw,
  BarChart3,
  Target,
  Calendar,
  MapPin,
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  Settings,
  ExternalLink,
  Copy,
  Download
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
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface AdCampaign {
  id: string
  name: string
  type: 'banner' | 'native' | 'video' | 'popup' | 'sidebar'
  status: 'active' | 'paused' | 'completed' | 'draft'
  advertiser: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  revenue: number
  startDate: string
  endDate: string
  targeting: {
    countries: string[]
    devices: string[]
    interests: string[]
    ageRange: [number, number]
  }
  creative: {
    title: string
    description: string
    imageUrl?: string
    videoUrl?: string
    ctaText: string
    landingUrl: string
  }
  placement: {
    positions: string[]
    pages: string[]
    frequency: number
  }
}

interface AdStats {
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  averageCTR: number
  averageCPM: number
  activeCampaigns: number
  topPerformer: string
  revenueGrowth: number
}

interface AdManagerProps {
  className?: string
}

export function AdManager({ className }: AdManagerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '广告管理',
      subtitle: '管理广告活动和收入',
      loading: '加载中...',
      loadCampaignsFailed: '加载广告活动失败',
      campaignUpdated: '广告活动已更新',
      campaignCreated: '广告活动已创建',
      saveCampaignFailed: '保存广告活动失败',
      campaignDeleted: '广告活动已删除',
      deleteCampaignFailed: '删除广告活动失败',
      campaignPaused: '广告活动已暂停',
      campaignResumed: '广告活动已恢复',
      toggleCampaignFailed: '切换广告活动状态失败',
      totalRevenue: '总收入',
      totalImpressions: '总展示次数',
      totalClicks: '总点击次数',
      averageCTR: '平均点击率',
      averageCPM: '平均千次展示费用',
      activeCampaigns: '活跃活动',
      topPerformer: '最佳表现',
      revenueGrowth: '收入增长',
      createCampaign: '创建广告活动',
      editCampaign: '编辑广告活动',
      deleteCampaign: '删除广告活动',
      pauseCampaign: '暂停广告活动',
      resumeCampaign: '恢复广告活动',
      campaignName: '活动名称',
      campaignType: '活动类型',
      campaignStatus: '活动状态',
      advertiser: '广告主',
      budget: '预算',
      startDate: '开始日期',
      endDate: '结束日期',
      targeting: '定向设置',
      creative: '创意内容',
      placement: '投放位置',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      banner: '横幅广告',
      native: '原生广告',
      video: '视频广告',
      popup: '弹窗广告',
      sidebar: '侧边栏广告',
      active: '活跃',
      paused: '暂停',
      completed: '已完成',
      draft: '草稿',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [stats, setStats] = useState<AdStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<AdCampaign>>({
    name: '',
    type: 'banner',
    status: 'draft',
    advertiser: '',
    budget: 0,
    targeting: {
      countries: [],
      devices: [],
      interests: [],
      ageRange: [18, 65]
    },
    creative: {
      title: '',
      description: '',
      ctaText: '',
      landingUrl: ''
    },
    placement: {
      positions: [],
      pages: [],
      frequency: 3
    }
  })

  // 加载广告数据
  useEffect(() => {
    loadCampaigns()
    loadAdStats()
  }, [])

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/ads/campaigns')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCampaigns(data.data.campaigns)
        }
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      showToast.error(t('loadCampaignsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdStats = async () => {
    try {
      const response = await fetch('/api/ads/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to load ad stats:', error)
    }
  }

  // 创建或更新广告活动
  const saveCampaign = async () => {
    try {
      const method = selectedCampaign ? 'PUT' : 'POST'
      const url = selectedCampaign ? `/api/ads/campaigns/${selectedCampaign.id}` : '/api/ads/campaigns'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(selectedCampaign ? t('campaignUpdated') : t('campaignCreated'))
          setIsEditing(false)
          setSelectedCampaign(null)
          resetForm()
          await loadCampaigns()
        }
      }
    } catch (error) {
      console.error('Failed to save campaign:', error)
      showToast.error(t('saveCampaignFailed'))
    }
  }

  // 删除广告活动
  const deleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/ads/campaigns/${campaignId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast.success(t('campaignDeleted'))
        await loadCampaigns()
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      showToast.error(t('deleteCampaignFailed'))
    }
  }

  // 切换广告活动状态
  const toggleCampaign = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/api/ads/campaigns/${campaignId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        showToast.success(status === 'active' ? t('campaignResumed') : t('campaignPaused'))
        await loadCampaigns()
      }
    } catch (error) {
      console.error('Failed to toggle campaign:', error)
      showToast.error(t('toggleCampaignFailed'))
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'banner',
      status: 'draft',
      advertiser: '',
      budget: 0,
      targeting: {
        countries: [],
        devices: [],
        interests: [],
        ageRange: [18, 65]
      },
      creative: {
        title: '',
        description: '',
        ctaText: '',
        landingUrl: ''
      },
      placement: {
        positions: [],
        pages: [],
        frequency: 3
      }
    })
  }

  // 编辑广告活动
  const editCampaign = (campaign: AdCampaign) => {
    setSelectedCampaign(campaign)
    setFormData({
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      advertiser: campaign.advertiser,
      budget: campaign.budget,
      targeting: campaign.targeting,
      creative: campaign.creative,
      placement: campaign.placement
    })
    setIsEditing(true)
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-blue-500'
      case 'draft':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner':
        return <Target className="h-4 w-4" />
      case 'native':
        return <Users className="h-4 w-4" />
      case 'video':
        return <Play className="h-4 w-4" />
      case 'popup':
        return <ExternalLink className="h-4 w-4" />
      case 'sidebar':
        return <MapPin className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // 渲染统计卡片
  const renderStatsCards = () => {
    if (!stats) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={cn(
                "inline-flex items-center",
                stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
              </span>
              {' '}{t('fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalImpressions')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('averageCPM')}: {formatCurrency(stats.averageCPM)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalClicks')}</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('averageCTR')}: {stats.averageCTR.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeCampaigns')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {t('topPerformer')}: {stats.topPerformer}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 渲染广告活动卡片
  const renderCampaignCard = (campaign: AdCampaign) => (
    <Card key={campaign.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(campaign.type)}
            <div>
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{campaign.advertiser}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor(campaign.status))} />
            <Badge variant={campaign.status === 'active' ? "default" : "secondary"}>
              {t(`status.${campaign.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('budget')}</Label>
              <div className="text-lg font-semibold">{formatCurrency(campaign.budget)}</div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('spent')}</Label>
              <div className="text-lg font-semibold">{formatCurrency(campaign.spent)}</div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t('budgetUsed')}</span>
              <span>{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(campaign.spent / campaign.budget) * 100} />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{campaign.impressions.toLocaleString()}</div>
              <div className="text-muted-foreground">{t('impressions')}</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium">{campaign.clicks.toLocaleString()}</div>
              <div className="text-muted-foreground">{t('clicks')}</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium">{campaign.ctr.toFixed(2)}%</div>
              <div className="text-muted-foreground">{t('ctr')}</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{t('revenue')}:</span>
              <span className="font-medium text-green-600">{formatCurrency(campaign.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('period')}:</span>
              <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(campaign.creative.landingUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(campaign.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={campaign.status === 'active'}
            onCheckedChange={(checked) => 
              toggleCampaign(campaign.id, checked ? 'active' : 'paused')
            }
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => editCampaign(campaign)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteCampaign(campaign.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
          
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createCampaign')}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 主要内容 */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">
            {t('campaigns')} ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {t('analytics')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {t('settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
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
              {campaigns.map(renderCampaignCard)}
            </div>
          )}
          
          {!isLoading && campaigns.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t('noCampaigns')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noCampaignsDescription')}
              </p>
              <Button onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createFirstCampaign')}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">{t('analyticsComingSoon')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('analyticsDescription')}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">{t('settingsComingSoon')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('settingsDescription')}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
