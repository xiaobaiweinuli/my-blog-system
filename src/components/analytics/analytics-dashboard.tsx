'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Clock, 
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  overview: {
    totalViews: number
    uniqueVisitors: number
    avgSessionDuration: number
    bounceRate: number
    viewsChange: number
    visitorsChange: number
    durationChange: number
    bounceRateChange: number
  }
  traffic: {
    date: string
    views: number
    visitors: number
    sessions: number
  }[]
  sources: {
    source: string
    visitors: number
    percentage: number
    color: string
  }[]
  devices: {
    device: string
    visitors: number
    percentage: number
  }[]
  topPages: {
    path: string
    title: string
    views: number
    uniqueViews: number
    avgTime: number
    bounceRate: number
  }[]
  geography: {
    country: string
    visitors: number
    percentage: number
  }[]
  realtime: {
    activeUsers: number
    topPages: string[]
    recentEvents: {
      timestamp: string
      event: string
      page: string
      user: string
    }[]
  }
}

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '数据分析',
      subtitle: '网站访问统计和分析',
      loading: '加载中...',
      loadDataFailed: '加载数据失败',
      exportSuccess: '数据导出成功',
      exportFailed: '数据导出失败',
      totalViews: '总浏览量',
      uniqueVisitors: '独立访客',
      avgSessionDuration: '平均会话时长',
      bounceRate: '跳出率',
      viewsChange: '浏览量变化',
      visitorsChange: '访客数变化',
      durationChange: '时长变化',
      bounceRateChange: '跳出率变化',
      traffic: '流量',
      sources: '来源',
      devices: '设备',
      topPages: '热门页面',
      geography: '地理分布',
      realtime: '实时数据',
      activeUsers: '活跃用户',
      recentEvents: '最近事件',
      export: '导出',
      refresh: '刷新',
      dateRange: '日期范围',
      metric: '指标',
      views: '浏览量',
      visitors: '访客数',
      sessions: '会话数',
      duration: '时长',
      bounce: '跳出',
      organic: '自然搜索',
      direct: '直接访问',
      social: '社交媒体',
      referral: '引荐',
      desktop: '桌面端',
      mobile: '移动端',
      tablet: '平板端',
      unknown: '未知',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })
  const [selectedMetric, setSelectedMetric] = useState('views')

  // 加载分析数据
  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      })

      const response = await fetch(`/api/analytics?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      showToast.error(t('loadDataFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 导出数据
  const exportData = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        format
      })

      const response = await fetch(`/api/analytics/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${dateRange.from.toISOString().split('T')[0]}-${dateRange.to.toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast.success(t('exportSuccess'))
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      showToast.error(t('exportFailed'))
    }
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 获取趋势图标
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  // 获取趋势颜色
  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-muted-foreground'
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (!data) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{t('noData')}</h3>
          <p className="text-sm text-muted-foreground">{t('noDataDescription')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部控制栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics')}</h1>
          <p className="text-muted-foreground">{t('analyticsDescription')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            value={dateRange}
            onChange={(date) => {
              if (date) {
                setDateRange({ from: date.from || new Date(), to: date.to || new Date() })
              }
            }}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalyticsData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          <Select onValueChange={(value) => exportData(value as 'csv' | 'json')}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              {t('export')}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 概览指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('totalViews')}</p>
                  <p className="text-2xl font-bold">{formatNumber(data.overview.totalViews)}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(data.overview.viewsChange)}
                <span className={cn("text-sm ml-1", getTrendColor(data.overview.viewsChange))}>
                  {Math.abs(data.overview.viewsChange)}% {t('fromLastPeriod')}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('uniqueVisitors')}</p>
                  <p className="text-2xl font-bold">{formatNumber(data.overview.uniqueVisitors)}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(data.overview.visitorsChange)}
                <span className={cn("text-sm ml-1", getTrendColor(data.overview.visitorsChange))}>
                  {Math.abs(data.overview.visitorsChange)}% {t('fromLastPeriod')}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('avgSessionDuration')}</p>
                  <p className="text-2xl font-bold">{formatDuration(data.overview.avgSessionDuration)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(data.overview.durationChange)}
                <span className={cn("text-sm ml-1", getTrendColor(data.overview.durationChange))}>
                  {Math.abs(data.overview.durationChange)}% {t('fromLastPeriod')}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('bounceRate')}</p>
                  <p className="text-2xl font-bold">{data.overview.bounceRate.toFixed(1)}%</p>
                </div>
                <Globe className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(-data.overview.bounceRateChange)} {/* 反向，因为跳出率降低是好事 */}
                <span className={cn("text-sm ml-1", getTrendColor(-data.overview.bounceRateChange))}>
                  {Math.abs(data.overview.bounceRateChange)}% {t('fromLastPeriod')}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 详细分析 */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">{t('traffic')}</TabsTrigger>
          <TabsTrigger value="sources">{t('sources')}</TabsTrigger>
          <TabsTrigger value="content">{t('content')}</TabsTrigger>
          <TabsTrigger value="audience">{t('audience')}</TabsTrigger>
          <TabsTrigger value="realtime">{t('realtime')}</TabsTrigger>
        </TabsList>

        {/* 流量趋势 */}
        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('trafficTrend')}
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">{t('views')}</SelectItem>
                    <SelectItem value="visitors">{t('visitors')}</SelectItem>
                    <SelectItem value="sessions">{t('sessions')}</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.traffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [formatNumber(value), t(selectedMetric)]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 流量来源 */}
        <TabsContent value="sources">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('trafficSources')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.sources}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="visitors"
                      label={({ source, percentage }) => `${source} (${percentage}%)`}
                    >
                      {data.sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatNumber(value), t('visitors')]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('deviceTypes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.devices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {device.device === 'Desktop' && <Monitor className="h-4 w-4" />}
                        {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                        {device.device === 'Tablet' && <Monitor className="h-4 w-4" />}
                        <span className="font-medium">{device.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(device.visitors)}
                        </span>
                        <Badge variant="secondary">{device.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 内容表现 */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>{t('topPages')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{page.title}</h4>
                      <p className="text-sm text-muted-foreground">{page.path}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium">{formatNumber(page.views)}</p>
                        <p className="text-xs text-muted-foreground">{t('views')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatDuration(page.avgTime)}</p>
                        <p className="text-xs text-muted-foreground">{t('avgTime')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{page.bounceRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">{t('bounceRate')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 受众分析 */}
        <TabsContent value="audience">
          <Card>
            <CardHeader>
              <CardTitle>{t('geography')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.geography.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{country.country}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {formatNumber(country.visitors)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 实时数据 */}
        <TabsContent value="realtime">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {t('activeUsers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500">
                    {data.realtime.activeUsers}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('currentlyOnline')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.realtime.recentEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{event.event}</span>
                        <span className="text-muted-foreground ml-2">{event.page}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
