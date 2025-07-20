'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Users, FileText, Eye, HardDrive, Calendar, BarChart3 } from 'lucide-react'
import { ApiClient, ApiError } from '@/lib/api-client'
import { toast } from 'sonner'

interface DashboardStatsData {
  articles: {
    total: number
    published: number
    draft: number
    recent: number
  }
  users: {
    total: number
    admins: number
    collaborators: number
    recent: number
  }
  views: {
    total_views: number
    unique_visitors: number
    viewed_articles: number
    recent_views: number
  }
  files: {
    total: number
    total_size: number
    images: number
    recent: number
  }
  view_trend: Array<{
    date: string
    views: number
    unique_visitors: number
  }>
  popular_articles: Array<{
    id: string
    title: string
    slug: string
    views: number
  }>
}

export function DashboardStats() {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '仪表板统计',
      articles: '文章',
      users: '用户',
      views: '浏览量',
      files: '文件',
      total: '总计',
      published: '已发布',
      draft: '草稿',
      recent: '最近',
      admins: '管理员',
      collaborators: '协作者',
      totalViews: '总浏览量',
      uniqueVisitors: '独立访客',
      viewedArticles: '被浏览文章',
      recentViews: '最近浏览',
      totalFiles: '总文件数',
      totalSize: '总大小',
      images: '图片',
      recentFiles: '最近文件',
      viewTrend: '浏览趋势',
      popularArticles: '热门文章',
      loading: '加载中...',
      loadError: '加载失败',
      noData: '暂无数据',
    }
    return translations[key] || key
  }

  const [data, setData] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const response = await ApiClient.getDashboardStats()
        if (response.success) {
          setData(response.data.stats)
        } else {
          toast.error(t('loadError'))
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        toast.error(t('loadError'))
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

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

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 计算变化率
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 文章统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('articles')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.articles.total}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{t('published')}: {data.articles.published}</span>
              <span>•</span>
              <span>{t('draft')}: {data.articles.draft}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{data.articles.recent} {t('recent')}</span>
            </div>
          </CardContent>
        </Card>

        {/* 用户统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.total}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{t('admins')}: {data.users.admins}</span>
              <span>•</span>
              <span>{t('collaborators')}: {data.users.collaborators}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{data.users.recent} {t('recent')}</span>
            </div>
          </CardContent>
        </Card>

        {/* 浏览量统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('views')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.views.total_views.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{t('uniqueVisitors')}: {data.views.unique_visitors.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{data.views.recent_views.toLocaleString()} {t('recentViews')}</span>
            </div>
          </CardContent>
        </Card>

        {/* 文件统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('files')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.files.total}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{t('totalSize')}: {formatFileSize(data.files.total_size)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{data.files.recent} {t('recentFiles')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 浏览趋势和热门文章 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 浏览趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('viewTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.view_trend.slice(-7).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('zh-CN', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('uniqueVisitors')}: {day.unique_visitors}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{day.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t('views')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 热门文章 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('popularArticles')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.popular_articles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={article.title}>
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{article.slug}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{article.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t('views')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 文章状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('articles')} {t('status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('published')}</span>
                <Badge variant="default">{data.articles.published}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('draft')}</span>
                <Badge variant="secondary">{data.articles.draft}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户角色分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('users')} {t('roles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('admins')}</span>
                <Badge variant="destructive">{data.users.admins}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('collaborators')}</span>
                <Badge variant="outline">{data.users.collaborators}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 文件类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('files')} {t('types')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('images')}</span>
                <Badge variant="default">{data.files.images}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('other')}</span>
                <Badge variant="secondary">{data.files.total - data.files.images}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
