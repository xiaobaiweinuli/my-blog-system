'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Map, 
  Globe, 
  Image, 
  FileText, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Eye,
  ExternalLink
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface SitemapConfig {
  enabled: boolean
  autoGenerate: boolean
  includeImages: boolean
  includeNews: boolean
  includeVideos: boolean
  changeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
  excludePaths: string[]
  customUrls: CustomUrl[]
}

interface CustomUrl {
  url: string
  changeFreq: string
  priority: number
  lastMod?: string
}

interface SitemapStats {
  totalUrls: number
  lastGenerated: string
  fileSize: number
  status: 'generating' | 'success' | 'error'
  errors: string[]
  warnings: string[]
}

interface SitemapFile {
  type: 'main' | 'images' | 'news' | 'videos' | 'language'
  filename: string
  urls: number
  size: number
  lastModified: string
  status: 'active' | 'outdated' | 'error'
}

interface SitemapGeneratorProps {
  className?: string
}

export function SitemapGenerator({ className }: SitemapGeneratorProps) {
  const { showToast } = useToast()
  
  const [config, setConfig] = useState<SitemapConfig>({
    enabled: true,
    autoGenerate: true,
    includeImages: true,
    includeNews: false,
    includeVideos: false,
    changeFreq: 'weekly',
    priority: 0.8,
    excludePaths: ['/admin', '/api', '/private'],
    customUrls: []
  })
  
  const [stats, setStats] = useState<SitemapStats | null>(null)
  const [files, setFiles] = useState<SitemapFile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 加载站点地图数据
  useEffect(() => {
    loadSitemapData()
  }, [])

  const loadSitemapData = async () => {
    setIsLoading(true)
    try {
      const [configRes, statsRes, filesRes] = await Promise.all([
        fetch('/api/sitemap/config'),
        fetch('/api/sitemap/stats'),
        fetch('/api/sitemap/files')
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        if (configData.success) {
          setConfig(configData.data.config)
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.data.stats)
        }
      }

      if (filesRes.ok) {
        const filesData = await filesRes.json()
        if (filesData.success) {
          setFiles(filesData.data.files)
        }
      }
    } catch (error) {
      console.error('Failed to load sitemap data:', error)
      showToast.error('加载站点地图数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 生成站点地图
  const generateSitemap = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/sitemap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success('站点地图生成成功')
          await loadSitemapData()
        }
      }
    } catch (error) {
      console.error('Failed to generate sitemap:', error)
      showToast.error('站点地图生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  // 更新配置
  const updateConfig = async (newConfig: Partial<SitemapConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)

    try {
      const response = await fetch('/api/sitemap/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      })

      if (response.ok) {
        showToast.success('配置已更新')
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      showToast.error('更新配置失败')
    }
  }

  // 下载站点地图
  const downloadSitemap = async (filename: string) => {
    try {
      const response = await fetch(`/api/sitemap/download/${filename}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download sitemap:', error)
      showToast.error('下载站点地图失败')
    }
  }

  // 提交到搜索引擎
  const submitToSearchEngines = async () => {
    try {
      const response = await fetch('/api/sitemap/submit', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success('站点地图已提交')
        }
      }
    } catch (error) {
      console.error('Failed to submit sitemap:', error)
      showToast.error('提交站点地图失败')
    }
  }

  // 添加自定义URL
  const addCustomUrl = () => {
    const newUrl: CustomUrl = {
      url: '',
      changeFreq: 'weekly',
      priority: 0.5
    }
    updateConfig({
      customUrls: [...config.customUrls, newUrl]
    })
  }

  // 移除自定义URL
  const removeCustomUrl = (index: number) => {
    const newUrls = config.customUrls.filter((_, i) => i !== index)
    updateConfig({ customUrls: newUrls })
  }

  // 更新自定义URL
  const updateCustomUrl = (index: number, updates: Partial<CustomUrl>) => {
    const newUrls = config.customUrls.map((url, i) => 
      i === index ? { ...url, ...updates } : url
    )
    updateConfig({ customUrls: newUrls })
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'outdated':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6" />
            站点地图生成器
          </h1>
          <p className="text-muted-foreground">站点地图生成器，帮助您管理和优化网站的站点地图。</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={generateSitemap}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isGenerating ? '生成中...' : '立即生成'}
          </Button>
          
          <Button
            variant="outline"
            onClick={submitToSearchEngines}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            提交到搜索引擎
          </Button>
        </div>
      </div>

      {/* 状态概览 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总URL数</p>
                  <p className="text-2xl font-bold">{stats.totalUrls.toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">文件大小</p>
                  <p className="text-2xl font-bold">{formatFileSize(stats.fileSize)}</p>
                </div>
                <Globe className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">最后生成</p>
                  <p className="text-sm font-medium">
                    {new Date(stats.lastGenerated).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">状态</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.status)}
                    <span className="text-sm font-medium">{stats.status === 'generating' ? '生成中' : stats.status === 'success' ? '成功' : stats.status === 'error' ? '失败' : '未知'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容 */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">站点地图文件</TabsTrigger>
          <TabsTrigger value="config">配置设置</TabsTrigger>
          <TabsTrigger value="custom">自定义URL</TabsTrigger>
        </TabsList>

        {/* 站点地图文件 */}
        <TabsContent value="files">
          <div className="space-y-4">
            {files.map((file, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {file.type === 'main' && <Map className="h-5 w-5 text-blue-500" />}
                      {file.type === 'images' && <Image className="h-5 w-5 text-green-500" />}
                      {file.type === 'news' && <FileText className="h-5 w-5 text-orange-500" />}
                      {file.type === 'videos' && <FileText className="h-5 w-5 text-purple-500" />}
                      {file.type === 'language' && <Globe className="h-5 w-5 text-pink-500" />}
                      
                      <div>
                        <h4 className="font-medium">{file.filename}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{file.urls} 个URL</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <Badge variant={file.status === 'active' ? 'default' : 'secondary'}>
                        {file.status === 'active' ? '活跃' : '过期'}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSitemap(file.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/sitemap/${file.filename}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 配置设置 */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                站点地图配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基本设置 */}
              <div className="space-y-4">
                <h4 className="font-medium">基本设置</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">启用站点地图</Label>
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoGenerate">自动生成</Label>
                  <Switch
                    id="autoGenerate"
                    checked={config.autoGenerate}
                    onCheckedChange={(checked) => updateConfig({ autoGenerate: checked })}
                  />
                </div>
              </div>

              {/* 内容类型 */}
              <div className="space-y-4">
                <h4 className="font-medium">内容类型</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeImages">包含图片</Label>
                  <Switch
                    id="includeImages"
                    checked={config.includeImages}
                    onCheckedChange={(checked) => updateConfig({ includeImages: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeNews">包含新闻</Label>
                  <Switch
                    id="includeNews"
                    checked={config.includeNews}
                    onCheckedChange={(checked) => updateConfig({ includeNews: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeVideos">包含视频</Label>
                  <Switch
                    id="includeVideos"
                    checked={config.includeVideos}
                    onCheckedChange={(checked) => updateConfig({ includeVideos: checked })}
                  />
                </div>
              </div>

              {/* 默认设置 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="changeFreq">默认更新频率</Label>
                  <Select
                    value={config.changeFreq}
                    onValueChange={(value: any) => updateConfig({ changeFreq: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">始终</SelectItem>
                      <SelectItem value="hourly">每小时</SelectItem>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="monthly">每月</SelectItem>
                      <SelectItem value="yearly">每年</SelectItem>
                      <SelectItem value="never">从不</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">默认优先级</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.priority}
                    onChange={(e) => updateConfig({ priority: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              {/* 排除路径 */}
              <div>
                <Label htmlFor="excludePaths">排除路径</Label>
                <Input
                  id="excludePaths"
                  value={config.excludePaths.join(', ')}
                  onChange={(e) => updateConfig({ 
                    excludePaths: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                  })}
                  placeholder="/admin, /api, /private"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 自定义URL */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                自定义URL
                <Button onClick={addCustomUrl} size="sm">
                  添加URL
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.customUrls.map((url, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <Input
                      placeholder="https://example.com/page"
                      value={url.url}
                      onChange={(e) => updateCustomUrl(index, { url: e.target.value })}
                    />
                    
                    <Select
                      value={url.changeFreq}
                      onValueChange={(value) => updateCustomUrl(index, { changeFreq: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">始终</SelectItem>
                        <SelectItem value="hourly">每小时</SelectItem>
                        <SelectItem value="daily">每天</SelectItem>
                        <SelectItem value="weekly">每周</SelectItem>
                        <SelectItem value="monthly">每月</SelectItem>
                        <SelectItem value="yearly">每年</SelectItem>
                        <SelectItem value="never">从不</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={url.priority}
                      onChange={(e) => updateCustomUrl(index, { priority: parseFloat(e.target.value) })}
                    />
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCustomUrl(index)}
                    >
                      移除
                    </Button>
                  </div>
                ))}
                
                {config.customUrls.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无自定义URL</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
