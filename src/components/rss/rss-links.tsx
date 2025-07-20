'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rss, Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface RSSLinksProps {
  className?: string
  showTitle?: boolean
  category?: string
  tag?: string
}

export function RSSLinks({ 
  className = '', 
  showTitle = true,
  category,
  tag,
}: RSSLinksProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  const getRSSUrls = () => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)
    const queryString = params.toString()
    const suffix = queryString ? `?${queryString}` : ''

    return {
      rss: `${baseUrl}/api/feed.xml${suffix}`,
      atom: `${baseUrl}/api/feed.atom${suffix}`,
      json: `${baseUrl}/api/feed.json${suffix}`,
    }
  }

  const urls = getRSSUrls()

  const copyToClipboard = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      toast.success('已复制')
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const feedTypes = [
    {
      name: 'RSS 2.0',
      description: 'RSS 2.0 格式的订阅源',
      url: urls.rss,
      icon: <Rss className="h-4 w-4" />,
      color: 'bg-orange-500',
    },
    {
      name: 'Atom',
      description: 'Atom 格式的订阅源',
      url: urls.atom,
      icon: <Rss className="h-4 w-4" />,
      color: 'bg-blue-500',
    },
    {
      name: 'JSON Feed',
      description: 'JSON Feed 格式的订阅源',
      url: urls.json,
      icon: <Download className="h-4 w-4" />,
      color: 'bg-green-500',
    },
  ]

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">RSS 订阅</h2>
          <p className="text-muted-foreground">订阅我们的内容更新</p>
          {(category || tag) && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">已筛选:</span>
              {category && <Badge variant="secondary">{category}</Badge>}
              {tag && <Badge variant="outline">{tag}</Badge>}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {feedTypes.map((feed) => (
          <Card key={feed.name} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${feed.color}`}>
                  {feed.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{feed.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {feed.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <a href={feed.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-2" />
                    订阅
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(feed.url, feed.name)}
                  className="px-3"
                >
                  {copiedUrl === feed.url ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="mt-2">
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                  {feed.url}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RSS 使用说明 */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">如何使用</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">RSS 阅读器</h4>
              <p className="text-muted-foreground">将订阅链接添加到您喜欢的 RSS 阅读器中</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'Feedly', 'Inoreader', 'NewsBlur', 'The Old Reader',
                  'NetNewsWire', 'Reeder', 'Feedbin'
                ].map((reader) => (
                  <Badge key={reader} variant="outline" className="text-xs">
                    {reader}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-1">浏览器</h4>
              <p className="text-muted-foreground">现代浏览器通常支持 RSS 订阅</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">移动应用</h4>
              <p className="text-muted-foreground">在移动设备上使用 RSS 阅读应用</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 简化的RSS订阅按钮
 */
export function RSSButton({
  category,
  tag,
  variant = 'outline',
  size = 'sm',
  className = '',
}: {
  category?: string
  tag?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)
  const queryString = params.toString()
  const rssUrl = `${baseUrl}/api/feed.xml${queryString ? `?${queryString}` : ''}`

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      <a href={rssUrl} target="_blank" rel="noopener noreferrer">
        <Rss className="h-4 w-4" />
        订阅
      </a>
    </Button>
  )
}

/**
 * RSS 图标链接
 */
export function RSSIcon({
  category,
  tag,
  className = '',
}: {
  category?: string
  tag?: string
  className?: string
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)
  const queryString = params.toString()
  const rssUrl = `${baseUrl}/api/feed.xml${queryString ? `?${queryString}` : ''}`

  return (
    <a
      href={rssUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors ${className}`}
      title="RSS 订阅"
    >
      <Rss className="h-4 w-4" />
    </a>
  )
}
