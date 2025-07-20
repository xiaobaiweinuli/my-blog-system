import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiClient } from '@/lib/api-client'
import { Users, FileText, Link, Eye, TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardStats {
  total_articles: number
  total_users: number
  total_files: number
  total_friend_links: number
  total_views: number
  recent_articles: number
  recent_users: number
  recent_files: number
  recent_views: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '仪表板统计',
      subtitle: '网站整体数据概览',
      totalArticles: '总文章数',
      totalUsers: '总用户数',
      totalFiles: '总文件数',
      totalFriendLinks: '友情链接数',
      totalViews: '总浏览量',
      recentArticles: '最近文章',
      recentUsers: '最近用户',
      recentFiles: '最近文件',
      recentViews: '最近浏览',
      loading: '加载中...',
      loadError: '加载统计数据失败'
    }
    return translations[key] || key
  }

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await ApiClient.getDashboardStats()
      if (response.success) {
        setStats(response.data.stats || response.data)
      } else {
        console.error('Failed to load dashboard stats')
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('loadError')}</p>
      </div>
    )
  }

  const statCards = [
    {
      title: t('totalArticles'),
      value: stats.total_articles,
      icon: FileText,
      description: `${t('recentArticles')}: ${stats.recent_articles}`,
      trend: stats.recent_articles > 0 ? 'up' : 'neutral'
    },
    {
      title: t('totalUsers'),
      value: stats.total_users,
      icon: Users,
      description: `${t('recentUsers')}: ${stats.recent_users}`,
      trend: stats.recent_users > 0 ? 'up' : 'neutral'
    },
    {
      title: t('totalFiles'),
      value: stats.total_files,
      icon: FileText,
      description: `${t('recentFiles')}: ${stats.recent_files}`,
      trend: stats.recent_files > 0 ? 'up' : 'neutral'
    },
    {
      title: t('totalFriendLinks'),
      value: stats.total_friend_links,
      icon: Link,
      description: '活跃链接',
      trend: 'neutral'
    },
    {
      title: t('totalViews'),
      value: stats.total_views,
      icon: Eye,
      description: `${t('recentViews')}: ${stats.recent_views}`,
      trend: stats.recent_views > 0 ? 'up' : 'down'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  {stat.trend !== 'neutral' && (
                    stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 