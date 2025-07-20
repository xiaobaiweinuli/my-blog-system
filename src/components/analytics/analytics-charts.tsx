'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Eye, Users, FileText, Globe } from 'lucide-react'

// 简化的图表组件，不依赖外部库
interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }>
}

interface AnalyticsData {
  total_stats: {
    total_views: number
    unique_visitors: number
    articles_viewed: number
    countries: number
  }
  daily_stats: Array<{
    date: string
    views: number
    unique_visitors: number
    articles_viewed: number
  }>
  top_articles: Array<{
    id: string
    title: string
    slug: string
    views: number
    unique_visitors: number
  }>
  top_countries: Array<{
    country: string
    views: number
    unique_visitors: number
  }>
}

export function AnalyticsCharts() {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      loading: '加载中...',
      noData: '暂无数据',
      title: '网站分析',
      subtitle: '流量、用户、内容等多维度统计',
      periods_7d: '近7天',
      periods_30d: '近30天',
      periods_90d: '近90天',
      periods_1y: '近1年',
      metrics_totalViews: '总浏览量',
      metrics_uniqueVisitors: '独立访客',
      metrics_articlesViewed: '被浏览文章',
      metrics_countries: '国家/地区',
      metrics_views: '浏览量',
      metrics_visitors: '访客',
      charts_viewsTrend: '浏览趋势',
      charts_viewsTrendDesc: '每日浏览量与访客数变化',
      charts_topArticles: '热门文章',
      charts_topArticlesDesc: '浏览量最多的文章',
      charts_geography: '地域分布',
      charts_geographyDesc: '访客来源国家/地区',
    }
    if (key.startsWith('periods.')) return translations['periods_' + key.split('.')[1]] || key
    if (key.startsWith('metrics.')) return translations['metrics_' + key.split('.')[1]] || key
    if (key.startsWith('charts.')) return translations['charts_' + key.split('.')[1]] || key
    return translations[key] || key
  }
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true)
      try {
        // 这里应该调用实际的 API
        const mockData: AnalyticsData = {
          total_stats: {
            total_views: 12543,
            unique_visitors: 8921,
            articles_viewed: 156,
            countries: 45,
          },
          daily_stats: [
            { date: '2024-01-01', views: 1200, unique_visitors: 800, articles_viewed: 25 },
            { date: '2024-01-02', views: 1350, unique_visitors: 900, articles_viewed: 28 },
            { date: '2024-01-03', views: 1100, unique_visitors: 750, articles_viewed: 22 },
            { date: '2024-01-04', views: 1450, unique_visitors: 950, articles_viewed: 30 },
            { date: '2024-01-05', views: 1600, unique_visitors: 1100, articles_viewed: 35 },
            { date: '2024-01-06', views: 1300, unique_visitors: 850, articles_viewed: 26 },
            { date: '2024-01-07', views: 1500, unique_visitors: 1000, articles_viewed: 32 },
          ],
          top_articles: [
            { id: '1', title: 'Next.js 13 新特性详解', slug: 'nextjs-13-features', views: 2543, unique_visitors: 1876 },
            { id: '2', title: 'React 18 并发特性', slug: 'react-18-concurrent', views: 2156, unique_visitors: 1654 },
            { id: '3', title: 'TypeScript 5.0 更新', slug: 'typescript-5-updates', views: 1987, unique_visitors: 1432 },
            { id: '4', title: 'Tailwind CSS 最佳实践', slug: 'tailwind-best-practices', views: 1765, unique_visitors: 1298 },
            { id: '5', title: 'Cloudflare Workers 入门', slug: 'cloudflare-workers-intro', views: 1543, unique_visitors: 1123 },
          ],
          top_countries: [
            { country: 'CN', views: 5432, unique_visitors: 3876 },
            { country: 'US', views: 2156, unique_visitors: 1654 },
            { country: 'JP', views: 1234, unique_visitors: 987 },
            { country: 'DE', views: 876, unique_visitors: 654 },
            { country: 'GB', views: 543, unique_visitors: 432 },
          ],
        }
        setData(mockData)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t('periods_7d')}</SelectItem>
            <SelectItem value="30d">{t('periods_30d')}</SelectItem>
            <SelectItem value="90d">{t('periods_90d')}</SelectItem>
            <SelectItem value="1y">{t('periods_1y')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('metrics_totalViews')}
          value={data.total_stats.total_views}
          icon={<Eye className="h-4 w-4" />}
          trend={12.5}
        />
        <StatCard
          title={t('metrics_uniqueVisitors')}
          value={data.total_stats.unique_visitors}
          icon={<Users className="h-4 w-4" />}
          trend={8.3}
        />
        <StatCard
          title={t('metrics_articlesViewed')}
          value={data.total_stats.articles_viewed}
          icon={<FileText className="h-4 w-4" />}
          trend={-2.1}
        />
        <StatCard
          title={t('metrics_countries')}
          value={data.total_stats.countries}
          icon={<Globe className="h-4 w-4" />}
          trend={5.7}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 浏览量趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('charts_viewsTrend')}</CardTitle>
            <CardDescription>{t('charts_viewsTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={{
                labels: data.daily_stats.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [
                  {
                    label: t('metrics_views'),
                    data: data.daily_stats.map(d => d.views),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  },
                  {
                    label: t('metrics_uniqueVisitors'),
                    data: data.daily_stats.map(d => d.unique_visitors),
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  },
                ],
              }}
            />
          </CardContent>
        </Card>

        {/* 热门文章 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('charts_topArticles')}</CardTitle>
            <CardDescription>{t('charts_topArticlesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_articles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{article.title}</p>
                      <p className="text-xs text-muted-foreground">{article.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{article.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.unique_visitors.toLocaleString()} {t('metrics_visitors')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 地理分布 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts_geography')}</CardTitle>
          <CardDescription>{t('charts_geographyDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.top_countries.map((country) => (
              <div key={country.country} className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">{getCountryFlag(country.country)}</div>
                <p className="font-medium">{getCountryName(country.country)}</p>
                <p className="text-sm text-muted-foreground">
                  {country.views.toLocaleString()} {t('metrics_views')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {country.unique_visitors.toLocaleString()} {t('metrics_visitors')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: number
  icon: React.ReactNode
  trend: number
}) {
  const isPositive = trend > 0
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="flex items-center mt-4">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-sm text-muted-foreground ml-1">vs last period</span>
        </div>
      </CardContent>
    </Card>
  )
}

function SimpleLineChart({ data }: { data: ChartData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.datasets.length) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 简单的折线图实现
    const padding = 40
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    // 计算数据范围
    const allValues = data.datasets.flatMap(d => d.data)
    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const valueRange = maxValue - minValue || 1

    // 绘制网格线
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + width, y)
      ctx.stroke()
    }

    // 绘制数据线
    data.datasets.forEach((dataset, datasetIndex) => {
      ctx.strokeStyle = dataset.borderColor || '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()

      dataset.data.forEach((value, index) => {
        const x = padding + (width / (dataset.data.length - 1)) * index
        const y = padding + height - ((value - minValue) / valueRange) * height

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // 绘制数据点
      ctx.fillStyle = dataset.borderColor || '#3b82f6'
      dataset.data.forEach((value, index) => {
        const x = padding + (width / (dataset.data.length - 1)) * index
        const y = padding + height - ((value - minValue) / valueRange) * height
        
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    })

    // 绘制标签
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    data.labels.forEach((label, index) => {
      const x = padding + (width / (data.labels.length - 1)) * index
      ctx.fillText(label, x, canvas.height - 10)
    })
  }, [data])

  return (
    <div className="w-full h-64">
      <canvas
        ref={canvasRef}
        width={600}
        height={256}
        className="w-full h-full"
      />
    </div>
  )
}

function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    CN: '🇨🇳',
    US: '🇺🇸',
    JP: '🇯🇵',
    DE: '🇩🇪',
    GB: '🇬🇧',
    FR: '🇫🇷',
    KR: '🇰🇷',
    CA: '🇨🇦',
    AU: '🇦🇺',
    IN: '🇮🇳',
  }
  return flags[countryCode] || '🌍'
}

function getCountryName(countryCode: string): string {
  const names: Record<string, string> = {
    CN: '中国',
    US: '美国',
    JP: '日本',
    DE: '德国',
    GB: '英国',
    FR: '法国',
    KR: '韩国',
    CA: '加拿大',
    AU: '澳大利亚',
    IN: '印度',
  }
  return names[countryCode] || countryCode
}
