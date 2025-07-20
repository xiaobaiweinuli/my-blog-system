'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Layout, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Code,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface AdPlacement {
  id: string
  name: string
  type: 'banner' | 'sidebar' | 'inline' | 'popup' | 'sticky'
  position: 'header' | 'footer' | 'sidebar-left' | 'sidebar-right' | 'content-top' | 'content-bottom' | 'between-posts'
  size: {
    width: number
    height: number
    responsive: boolean
  }
  targeting: {
    pages: string[]
    devices: string[]
    userTypes: string[]
  }
  active: boolean
  impressions: number
  clicks: number
  revenue: number
  fillRate: number
  createdAt: string
  lastUpdated: string
}

interface AdPlacementProps {
  className?: string
}

export function AdPlacement({ className }: AdPlacementProps) {
  // 中文静态文本
  const t = (key: string) => {
    // 修复重复键名，只保留最后一个
    const translations: Record<string, string> = {
      presetSizes: '预设尺寸',
      cancel: '取消',
      update: '更新',
      create: '创建',
      editPlacement: '编辑广告位',
      createPlacement: '新建广告位',
      placementName: '广告位名称',
      noPlacements: '暂无广告位',
      noPlacementsDescription: '还没有广告位，点击下方按钮新建。',
      createFirstPlacement: '新建第一个广告位',
      type_banner: '横幅',
      type_sidebar: '侧边栏',
      type_inline: '内嵌',
      type_popup: '弹窗',
      type_sticky: '吸底',
      position_header: '页头',
      position_footer: '页脚',
      position_sidebar_left: '左侧栏',
      position_sidebar_right: '右侧栏',
      position_content_top: '内容上方',
      position_content_bottom: '内容下方',
      position_between_posts: '文章间',
      adCodeDescription: '将此代码嵌入你的网站以展示广告',
      // 设备
      device_mobile: '移动端',
      device_tablet: '平板',
      device_desktop: '桌面端',
    }
    // 支持 type.xxx 和 position.xxx
    if (key.startsWith('type.')) return translations['type_' + key.split('.')[1]] || key
    if (key.startsWith('position.')) return translations['position_' + key.split('.')[1].replace('-', '_')] || key
    if (key.startsWith('device.')) return translations['device_' + key.split('.')[1]] || key
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [placements, setPlacements] = useState<AdPlacement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlacement, setSelectedPlacement] = useState<AdPlacement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCode, setShowCode] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<AdPlacement>>({
    name: '',
    type: 'banner',
    position: 'header',
    size: {
      width: 728,
      height: 90,
      responsive: true
    },
    targeting: {
      pages: [],
      devices: [],
      userTypes: []
    },
    active: true
  })

  // 预定义的广告尺寸
  const adSizes = [
    { name: 'Leaderboard', width: 728, height: 90 },
    { name: 'Banner', width: 468, height: 60 },
    { name: 'Rectangle', width: 300, height: 250 },
    { name: 'Square', width: 250, height: 250 },
    { name: 'Skyscraper', width: 160, height: 600 },
    { name: 'Wide Skyscraper', width: 300, height: 600 },
    { name: 'Mobile Banner', width: 320, height: 50 },
    { name: 'Large Mobile Banner', width: 320, height: 100 }
  ]

  // 加载广告位数据
  useEffect(() => {
    loadPlacements()
  }, [])

  const loadPlacements = async () => {
    try {
      const response = await fetch('/api/ads/placements')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPlacements(data.data.placements)
        }
      }
    } catch (error) {
      console.error('Failed to load placements:', error)
      showToast.error(t('loadPlacementsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 创建或更新广告位
  const savePlacement = async () => {
    try {
      const method = selectedPlacement ? 'PUT' : 'POST'
      const url = selectedPlacement ? `/api/ads/placements/${selectedPlacement.id}` : '/api/ads/placements'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(selectedPlacement ? t('placementUpdated') : t('placementCreated'))
          setIsEditing(false)
          setSelectedPlacement(null)
          resetForm()
          await loadPlacements()
        }
      }
    } catch (error) {
      console.error('Failed to save placement:', error)
      showToast.error(t('savePlacementFailed'))
    }
  }

  // 删除广告位
  const deletePlacement = async (placementId: string) => {
    try {
      const response = await fetch(`/api/ads/placements/${placementId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast.success(t('placementDeleted'))
        await loadPlacements()
      }
    } catch (error) {
      console.error('Failed to delete placement:', error)
      showToast.error(t('deletePlacementFailed'))
    }
  }

  // 切换广告位状态
  const togglePlacement = async (placementId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/ads/placements/${placementId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      })

      if (response.ok) {
        showToast.success(active ? t('placementActivated') : t('placementDeactivated'))
        await loadPlacements()
      }
    } catch (error) {
      console.error('Failed to toggle placement:', error)
      showToast.error(t('togglePlacementFailed'))
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'banner',
      position: 'header',
      size: {
        width: 728,
        height: 90,
        responsive: true
      },
      targeting: {
        pages: [],
        devices: [],
        userTypes: []
      },
      active: true
    })
  }

  // 编辑广告位
  const editPlacement = (placement: AdPlacement) => {
    setSelectedPlacement(placement)
    setFormData({
      name: placement.name,
      type: placement.type,
      position: placement.position,
      size: placement.size,
      targeting: placement.targeting,
      active: placement.active
    })
    setIsEditing(true)
  }

  // 生成广告位代码
  const generateAdCode = (placement: AdPlacement) => {
    return `<!-- Ad Placement: ${placement.name} -->
<div 
  id="ad-placement-${placement.id}" 
  class="ad-placement ad-${placement.type}"
  data-placement-id="${placement.id}"
  data-size="${placement.size.width}x${placement.size.height}"
  ${placement.size.responsive ? 'data-responsive="true"' : ''}
  style="width: ${placement.size.width}px; height: ${placement.size.height}px; ${placement.size.responsive ? 'max-width: 100%;' : ''}"
>
  <!-- Ad content will be loaded here -->
</div>

<script>
  // Load ad for placement ${placement.id}
  (function() {
    const adElement = document.getElementById('ad-placement-${placement.id}');
    if (adElement) {
      // Initialize ad loading
      window.loadAd && window.loadAd('${placement.id}');
    }
  })();
</script>`
  }

  // 复制代码到剪贴板
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      showToast.success(t('codeCopied'))
    } catch (error) {
      console.error('Failed to copy code:', error)
      showToast.error(t('copyFailed'))
    }
  }

  // 获取设备图标
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />
      case 'tablet':
        return <Tablet className="h-3 w-3" />
      case 'desktop':
        return <Monitor className="h-3 w-3" />
      default:
        return <Monitor className="h-3 w-3" />
    }
  }

  // 渲染广告位卡片
  const renderPlacementCard = (placement: AdPlacement) => (
    <Card key={placement.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{placement.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(`type.${placement.type}`)} • {t(`position.${placement.position}`)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", placement.active ? "bg-green-500" : "bg-gray-500")} />
            <Badge variant={placement.active ? "default" : "secondary"}>
              {placement.active ? t('active') : t('inactive')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('size')}</Label>
              <div className="text-sm font-medium">
                {placement.size.width} × {placement.size.height}
                {placement.size.responsive && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t('responsive')}
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('fillRate')}</Label>
              <div className="text-sm font-medium">{placement.fillRate.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{placement.impressions.toLocaleString()}</div>
              <div className="text-muted-foreground">{t('impressions')}</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium">{placement.clicks.toLocaleString()}</div>
              <div className="text-muted-foreground">{t('clicks')}</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-green-600">
                ${placement.revenue.toFixed(2)}
              </div>
              <div className="text-muted-foreground">{t('revenue')}</div>
            </div>
          </div>
          
          {placement.targeting.devices.length > 0 && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('targetDevices')}</Label>
              <div className="flex items-center gap-1 mt-1">
                {placement.targeting.devices.map((device, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    {getDeviceIcon(device)}
                    <span>{t(`device.${device}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t('created')}:</span>
              <span>{new Date(placement.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('lastUpdated')}:</span>
              <span>{new Date(placement.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCode(placement.id)}
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyCode(generateAdCode(placement))}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={placement.active}
            onCheckedChange={(checked) => togglePlacement(placement.id, checked)}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => editPlacement(placement)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deletePlacement(placement.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  // 渲染编辑对话框
  const renderEditDialog = () => (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedPlacement ? t('editPlacement') : t('createPlacement')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          请根据需要填写或操作。
        </DialogDescription>
        
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('placementName')}
              />
            </div>
            
            <div>
              <Label htmlFor="type">{t('type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">{t('type.banner')}</SelectItem>
                  <SelectItem value="sidebar">{t('type.sidebar')}</SelectItem>
                  <SelectItem value="inline">{t('type.inline')}</SelectItem>
                  <SelectItem value="popup">{t('type.popup')}</SelectItem>
                  <SelectItem value="sticky">{t('type.sticky')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="position">{t('position')}</Label>
            <Select
              value={formData.position}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, position: value }))}
            >
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">{t('position.header')}</SelectItem>
                <SelectItem value="footer">{t('position.footer')}</SelectItem>
                <SelectItem value="sidebar-left">{t('position.sidebar-left')}</SelectItem>
                <SelectItem value="sidebar-right">{t('position.sidebar-right')}</SelectItem>
                <SelectItem value="content-top">{t('position.content-top')}</SelectItem>
                <SelectItem value="content-bottom">{t('position.content-bottom')}</SelectItem>
                <SelectItem value="between-posts">{t('position.between-posts')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>{t('adSize')}</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="width" className="text-sm">{t('width')}</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.size?.width}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    size: { ...prev.size!, width: parseInt(e.target.value) }
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="height" className="text-sm">{t('height')}</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.size?.height}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    size: { ...prev.size!, height: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Switch
                id="responsive"
                checked={formData.size?.responsive}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  size: { ...prev.size!, responsive: checked }
                }))}
              />
              <Label htmlFor="responsive" className="text-sm">{t('responsive')}</Label>
            </div>
            
            <div className="mt-2">
              <Label className="text-sm">{t('presetSizes')}</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {adSizes.map((size, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      size: { ...prev.size!, width: size.width, height: size.height }
                    }))}
                  >
                    {size.name} ({size.width}×{size.height})
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">{t('active')}</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                {t('cancel')}
              </Button>
              
              <Button onClick={savePlacement}>
                {selectedPlacement ? t('update') : t('create')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // 渲染代码对话框
  const renderCodeDialog = () => {
    const placement = placements.find(p => p.id === showCode)
    if (!placement) return null

    const code = generateAdCode(placement)

    return (
      <Dialog open={!!showCode} onOpenChange={() => setShowCode(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('adCode')} - {placement.name}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('adCodeDescription')}
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyCode(code)}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('copyCode')}
              </Button>
            </div>
            
            <div className="relative">
              <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-sm font-mono">
                {code}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="h-6 w-6" />
            {t('adPlacements')}
          </h1>
          <p className="text-muted-foreground">{t('adPlacementsDescription')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadPlacements}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
          
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createPlacement')}
          </Button>
        </div>
      </div>

      {/* 广告位列表 */}
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
          {placements.map(renderPlacementCard)}
        </div>
      )}
      
      {!isLoading && placements.length === 0 && (
        <div className="text-center py-12">
          <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{t('noPlacements')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('noPlacementsDescription')}
          </p>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createFirstPlacement')}
          </Button>
        </div>
      )}

      {/* 编辑对话框 */}
      {renderEditDialog()}

      {/* 代码对话框 */}
      {renderCodeDialog()}
    </div>
  )
}
