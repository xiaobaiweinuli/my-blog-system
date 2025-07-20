'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, Hash, User, Calendar, Clock, Eye, Heart, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'article' | 'tag' | 'category' | 'user'
  title: string
  excerpt?: string
  slug: string
  category?: string
  tags?: string[]
  publishedAt?: string
  author?: {
    name: string
    avatar?: string
    slug: string
  }
  stats?: {
    views: number
    likes: number
    comments: number
  }
  highlight?: string
  score?: number
}

interface SearchResultsProps {
  searchParams: {
    q?: string
    type?: string
    category?: string
    tag?: string
    author?: string
    date?: string
    page?: string
  }
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  // 检查是否有国际化上下文
  let t: any = null
  try {
    t = {
      noResults: '没有找到相关结果',
      noResultsDescription: '没有找到与 "{query}" 相关的结果',
      searchSuggestions: '搜索建议',
      suggestion1: '检查拼写是否正确',
      suggestion2: '尝试使用更简单的关键词',
      suggestion3: '尝试使用同义词',
      resultsCount: '找到 {count} 个与 "{query}" 相关的结果',
      page: '第'
    }
  } catch {
    // 如果没有国际化上下文，使用默认文本
    t = {
      noResults: '没有找到相关结果',
      noResultsDescription: '没有找到与 "{query}" 相关的结果',
      searchSuggestions: '搜索建议',
      suggestion1: '检查拼写是否正确',
      suggestion2: '尝试使用更简单的关键词',
      suggestion3: '尝试使用同义词',
      resultsCount: '找到 {count} 个与 "{query}" 相关的结果',
      page: '第'
    }
  }
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const query = searchParams.q || ''
  const resultsPerPage = 10

  // 执行搜索
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const params = new URLSearchParams({
          q: query,
          page: searchParams.page || '1',
          limit: resultsPerPage.toString(),
          highlight: 'true',
          ...Object.fromEntries(
            Object.entries(searchParams).filter(([key, value]) => 
              value && key !== 'q' && key !== 'page'
            )
          )
        })

        const response = await fetch(`/api/search?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Search request failed')
        }

        const data = await response.json()

        if (data.success) {
          setResults(data.data.results || [])
          setTotalResults(data.data.total || 0)
          setHasMore(data.data.hasMore || false)
          setCurrentPage(parseInt(searchParams.page || '1'))
        } else {
          throw new Error(data.error || 'Search failed')
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [query, searchParams])

  // 高亮搜索关键词
  const highlightText = (text: string, highlight: string) => {
    if (!highlight || !text) return text
    
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  // 获取结果图标
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-5 w-5" />
      case 'tag':
        return <Hash className="h-5 w-5" />
      case 'category':
        return <Hash className="h-5 w-5" />
      case 'user':
        return <User className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // 获取结果链接
  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'article':
        return `/articles/${result.slug}`
      case 'tag':
        return `/tags/${result.slug}`
      case 'category':
        return `/categories/${result.slug}`
      case 'user':
        return `/users/${result.slug}`
      default:
        return '#'
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-16"></div>
                  <div className="h-5 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4">{t.noResults}</h2>
          <p className="text-muted-foreground mb-6">
            {t.noResultsDescription.replace('{query}', query)}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t.searchSuggestions}:</p>
            <ul className="space-y-1">
              <li>• {t.suggestion1}</li>
              <li>• {t.suggestion2}</li>
              <li>• {t.suggestion3}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 搜索结果统计 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t.resultsCount.replace('{count}', totalResults.toString()).replace('{query}', query)}
        </p>
        <div className="text-xs text-muted-foreground">
          {t.page} {currentPage}
        </div>
      </div>

      {/* 搜索结果列表 */}
      <AnimatePresence>
        <div className="space-y-4">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 结果图标 */}
                    <div className="mt-1 text-muted-foreground">
                      {getResultIcon(result.type)}
                    </div>

                    {/* 结果内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h3 className="text-lg font-semibold mb-2">
                        <Link 
                          href={getResultLink(result)}
                          className="hover:text-primary transition-colors"
                        >
                          {result.highlight ? (
                            <span dangerouslySetInnerHTML={{ __html: result.highlight }} />
                          ) : (
                            highlightText(result.title, query)
                          )}
                        </Link>
                      </h3>

                      {/* 摘要 */}
                      {result.excerpt && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {highlightText(result.excerpt, query)}
                        </p>
                      )}

                      {/* 元信息 */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {result.type === 'article' && result.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(result.publishedAt)}
                          </div>
                        )}
                        
                        {result.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <Link 
                              href={`/users/${result.author.slug}`}
                              className="hover:text-primary"
                            >
                              {result.author.name}
                            </Link>
                          </div>
                        )}

                        {result.stats && (
                          <>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {result.stats.views}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {result.stats.likes}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {result.stats.comments}
                            </div>
                          </>
                        )}
                      </div>

                      {/* 标签和分类 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.category && (
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                        )}
                        {result.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {result.tags && result.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{result.tags.length - 3} 更多标签
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 访问链接 */}
                    <div className="mt-1">
                      <Link href={getResultLink(result)}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* 分页 */}
      {totalResults > resultsPerPage && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link 
                href={{
                  pathname: '/search',
                  query: { ...searchParams, page: (currentPage - 1).toString() }
                }}
              >
                <Button variant="outline">上一页</Button>
              </Link>
            )}
            
            <span className="px-4 py-2 text-sm text-muted-foreground">
              {currentPage} / {Math.ceil(totalResults / resultsPerPage)}
            </span>
            
            {hasMore && (
              <Link 
                href={{
                  pathname: '/search',
                  query: { ...searchParams, page: (currentPage + 1).toString() }
                }}
              >
                <Button variant="outline">下一页</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
