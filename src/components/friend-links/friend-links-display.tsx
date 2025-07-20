'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'

interface FriendLink {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  order_index: number
  is_featured: boolean
  contact_email?: string
  created_at: string
  updated_at: string
  approved_at?: string
  created_by?: string
  approved_by?: string
}

export function FriendLinksDisplay() {
  const [links, setLinks] = useState<FriendLink[]>([])
  const [loading, setLoading] = useState(true)

  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '友情链接',
      subtitle: '与志同道合的朋友们',
      tech: '技术',
      blog: '博客',
      friend: '朋友',
      other: '其他',
      loading: '加载中...',
      loadError: '加载友情链接失败'
    }
    return translations[key] || key
  }

  useEffect(() => {
    const loadLinks = async () => {
      try {
        setLoading(true)
        const response = await ApiClient.getFriendLinks({ status: 'approved' })
        if (response.success) {
          setLinks(response.data.links || response.data)
        } else {
          console.error('Failed to load friend links')
        }
      } catch (error) {
        console.error('Failed to load friend links:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLinks()
  }, [])

  // 获取分类文本
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'tech':
        return t('tech')
      case 'blog':
        return t('blog')
      case 'friend':
        return t('friend')
      default:
        return t('other')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (links.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          {t('title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-4 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start space-x-3">
                {link.avatar && (
                  <img
                    src={link.avatar}
                    alt={link.name}
                    className="w-12 h-12 rounded-lg object-cover object-center flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {link.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {link.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {getCategoryText(link.category)}
                    </span>
                    {link.is_featured && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        推荐
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
