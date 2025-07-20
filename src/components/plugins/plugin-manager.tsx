'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Puzzle, 
  Download, 
  Trash2, 
  Settings, 
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Star,
  Shield,
  Code,
  Package,
  Search,
  Filter,
  ExternalLink,
  Upload,
  FileCode,
  Zap
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: 'content' | 'ui' | 'analytics' | 'social' | 'seo' | 'utility'
  status: 'active' | 'inactive' | 'error' | 'updating'
  installed: boolean
  enabled: boolean
  rating: number
  downloads: number
  lastUpdated: string
  homepage?: string
  repository?: string
  documentation?: string
  screenshots?: string[]
  dependencies?: string[]
  permissions?: string[]
  config?: Record<string, any>
}

interface PluginManagerProps {
  className?: string
}

export function PluginManager({ className }: PluginManagerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '插件管理',
      subtitle: '管理博客插件和扩展',
      loading: '加载中...',
      loadPluginsFailed: '加载插件失败',
      installSuccess: '插件安装成功',
      installFailed: '插件安装失败',
      uninstallSuccess: '插件卸载成功',
      uninstallFailed: '插件卸载失败',
      enableSuccess: '插件启用成功',
      disableSuccess: '插件禁用成功',
      toggleFailed: '切换插件状态失败',
      updateSuccess: '插件更新成功',
      updateFailed: '插件更新失败',
      configureSuccess: '插件配置成功',
      configureFailed: '插件配置失败',
      marketplace: '插件市场',
      installed: '已安装',
      all: '全部',
      content: '内容',
      ui: '界面',
      analytics: '分析',
      social: '社交',
      seo: 'SEO',
      utility: '工具',
      active: '活跃',
      inactive: '未激活',
      error: '错误',
      updating: '更新中',
      install: '安装',
      uninstall: '卸载',
      enable: '启用',
      disable: '禁用',
      update: '更新',
      configure: '配置',
      settings: '设置',
      documentation: '文档',
      homepage: '主页',
      repository: '仓库',
      version: '版本',
      author: '作者',
      category: '分类',
      status: '状态',
      rating: '评分',
      downloads: '下载量',
      lastUpdated: '最后更新',
      dependencies: '依赖',
      permissions: '权限',
      searchPlaceholder: '搜索插件...',
      noPlugins: '暂无插件',
      noInstalledPlugins: '暂无已安装插件',
      confirmUninstall: '确定要卸载这个插件吗？',
      confirmDisable: '确定要禁用这个插件吗？',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [isInstalling, setIsInstalling] = useState<string | null>(null)

  // 加载插件数据
  useEffect(() => {
    loadPlugins()
    loadInstalledPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      const response = await fetch('/api/plugins/marketplace')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPlugins(data.data.plugins)
        }
      }
    } catch (error) {
      console.error('Failed to load plugins:', error)
      showToast.error(t('loadPluginsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadInstalledPlugins = async () => {
    try {
      const response = await fetch('/api/plugins/installed')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setInstalledPlugins(data.data.plugins)
        }
      }
    } catch (error) {
      console.error('Failed to load installed plugins:', error)
    }
  }

  // 安装插件
  const installPlugin = async (pluginId: string) => {
    setIsInstalling(pluginId)
    try {
      const response = await fetch('/api/plugins/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(t('installSuccess'))
          await loadInstalledPlugins()
          
          // 更新插件状态
          setPlugins(prev => prev.map(plugin => 
            plugin.id === pluginId 
              ? { ...plugin, installed: true, status: 'inactive' }
              : plugin
          ))
        } else {
          showToast.error(data.error || t('installFailed'))
        }
      }
    } catch (error) {
      console.error('Plugin installation failed:', error)
      showToast.error(t('installFailed'))
    } finally {
      setIsInstalling(null)
    }
  }

  // 卸载插件
  const uninstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/plugins/uninstall/${pluginId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast.success(t('uninstallSuccess'))
        await loadInstalledPlugins()
        
        // 更新插件状态
        setPlugins(prev => prev.map(plugin => 
          plugin.id === pluginId 
            ? { ...plugin, installed: false, enabled: false, status: 'inactive' }
            : plugin
        ))
      }
    } catch (error) {
      console.error('Plugin uninstallation failed:', error)
      showToast.error(t('uninstallFailed'))
    }
  }

  // 启用/禁用插件
  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/plugins/toggle/${pluginId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        showToast.success(enabled ? t('enableSuccess') : t('disableSuccess'))
        
        // 更新插件状态
        setInstalledPlugins(prev => prev.map(plugin => 
          plugin.id === pluginId 
            ? { ...plugin, enabled, status: enabled ? 'active' : 'inactive' }
            : plugin
        ))
      }
    } catch (error) {
      console.error('Plugin toggle failed:', error)
      showToast.error(t('toggleFailed'))
    }
  }

  // 更新插件
  const updatePlugin = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/plugins/update/${pluginId}`, {
        method: 'PUT'
      })

      if (response.ok) {
        showToast.success(t('updateSuccess'))
        await loadInstalledPlugins()
      }
    } catch (error) {
      console.error('Plugin update failed:', error)
      showToast.error(t('updateFailed'))
    }
  }

  // 配置插件
  const configurePlugin = async (pluginId: string, config: Record<string, any>) => {
    try {
      const response = await fetch(`/api/plugins/configure/${pluginId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })

      if (response.ok) {
        showToast.success(t('configureSuccess'))
        await loadInstalledPlugins()
      }
    } catch (error) {
      console.error('Plugin configuration failed:', error)
      showToast.error(t('configureFailed'))
    }
  }

  // 过滤插件
  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || plugin.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'installed' && plugin.installed) ||
                         (statusFilter === 'not-installed' && !plugin.installed)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // 获取类别图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return <FileCode className="h-4 w-4" />
      case 'ui':
        return <Puzzle className="h-4 w-4" />
      case 'analytics':
        return <Zap className="h-4 w-4" />
      case 'social':
        return <Package className="h-4 w-4" />
      case 'seo':
        return <Search className="h-4 w-4" />
      case 'utility':
        return <Settings className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      case 'updating':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 渲染插件卡片
  const renderPluginCard = (plugin: Plugin) => (
    <Card key={plugin.id} className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(plugin.category)}
            <div>
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('by')} {plugin.author} • v{plugin.version}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {plugin.installed && (
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(plugin.status))} />
            )}
            <Badge variant="outline">{t(`category.${plugin.category}`)}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {plugin.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {plugin.rating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {plugin.downloads.toLocaleString()}
          </div>
          <div>
            {new Date(plugin.lastUpdated).toLocaleDateString()}
          </div>
        </div>
        
        {plugin.permissions && plugin.permissions.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium mb-2 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {t('permissions')}
            </div>
            <div className="flex flex-wrap gap-1">
              {plugin.permissions.slice(0, 3).map((permission, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {t(`permission.${permission}`)}
                </Badge>
              ))}
              {plugin.permissions.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{plugin.permissions.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {plugin.homepage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(plugin.homepage, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPlugin(plugin)}
          >
            {t('details')}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {plugin.installed ? (
            <>
              {plugin.enabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlugin(plugin.id, false)}
                >
                  {t('disable')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlugin(plugin.id, true)}
                >
                  {t('enable')}
                </Button>
              )}
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => uninstallPlugin(plugin.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => installPlugin(plugin.id)}
              disabled={isInstalling === plugin.id}
              size="sm"
            >
              {isInstalling === plugin.id ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('install')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )

  // 渲染插件详情对话框
  const renderPluginDetails = () => {
    if (!selectedPlugin) return null
    
    return (
      <Dialog open={!!selectedPlugin} onOpenChange={() => setSelectedPlugin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getCategoryIcon(selectedPlugin.category)}
              {selectedPlugin.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div>
              <h4 className="font-medium mb-2">{t('description')}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedPlugin.description}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">{t('information')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('version')}:</span>
                    <span>{selectedPlugin.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('author')}:</span>
                    <span>{selectedPlugin.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('category')}:</span>
                    <span>{t(`category.${selectedPlugin.category}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('downloads')}:</span>
                    <span>{selectedPlugin.downloads.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">{t('rating')}</h4>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(selectedPlugin.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {selectedPlugin.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {selectedPlugin.dependencies && selectedPlugin.dependencies.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">{t('dependencies')}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlugin.dependencies.map((dep, index) => (
                    <Badge key={index} variant="outline">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedPlugin.permissions && selectedPlugin.permissions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {t('permissions')}
                </h4>
                <div className="space-y-2">
                  {selectedPlugin.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-500" />
                      {t(`permission.${permission}`)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-4 border-t">
              {selectedPlugin.homepage && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedPlugin.homepage, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('homepage')}
                </Button>
              )}
              
              {selectedPlugin.repository && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedPlugin.repository, '_blank')}
                >
                  <Code className="h-4 w-4 mr-2" />
                  {t('repository')}
                </Button>
              )}
              
              {selectedPlugin.documentation && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedPlugin.documentation, '_blank')}
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  {t('documentation')}
                </Button>
              )}
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
            <Puzzle className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadPlugins}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('update')}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                {t('uploadPlugin')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('uploadPlugin')}</DialogTitle>
              </DialogHeader>
              <div className="pt-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('uploadPluginDescription')}
                  </p>
                  <Button variant="outline">
                    {t('selectFile')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="content">{t('content')}</SelectItem>
            <SelectItem value="ui">{t('ui')}</SelectItem>
            <SelectItem value="analytics">{t('analytics')}</SelectItem>
            <SelectItem value="social">{t('social')}</SelectItem>
            <SelectItem value="seo">{t('seo')}</SelectItem>
            <SelectItem value="utility">{t('utility')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allPlugins')}</SelectItem>
            <SelectItem value="installed">{t('installed')}</SelectItem>
            <SelectItem value="not-installed">{t('notInstalled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 插件列表 */}
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace">{t('marketplace')}</TabsTrigger>
          <TabsTrigger value="installed">
            {t('installed')} ({installedPlugins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
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
              {filteredPlugins.map(renderPluginCard)}
            </div>
          )}
          
          {!isLoading && filteredPlugins.length === 0 && (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t('noPlugins')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('noPluginsFoundDescription')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="installed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {installedPlugins.map(renderPluginCard)}
          </div>
          
          {installedPlugins.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t('noInstalledPlugins')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noInstalledPluginsDescription')}
              </p>
              <Button onClick={() => setSearchQuery('')}>
                {t('browseMarketplace')}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 插件详情对话框 */}
      {renderPluginDetails()}
    </div>
  )
}
