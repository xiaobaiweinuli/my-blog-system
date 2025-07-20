"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search as SearchIcon, Filter, X, Clock, Tag, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleCard } from "@/components/ui/article-card"
import { ArticleCardSkeleton } from "@/components/ui/loading"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { SearchResultsStructuredData } from "@/components/seo/structured-data"
import { debounce } from "@/lib/utils"
import type { Article } from "@/types"

interface SearchInterfaceProps {
  initialQuery?: string
  initialPage?: number
  initialCategory?: string
  initialTag?: string
}

interface SearchResults {
  articles: Article[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  query: string
  suggestions: string[]
}

export function SearchInterface({
  initialQuery = "",
  initialPage = 1,
  initialCategory = "",
  initialTag = "",
}: SearchInterfaceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(initialPage)
  const [category, setCategory] = useState(initialCategory)
  const [tag, setTag] = useState(initialTag)
  const [activeTab, setActiveTab] = useState<"all" | "articles" | "tags" | "title" | "content" | "category" | "author">("all")
  
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [content, setContent] = useState("")
  const [author, setAuthor] = useState("")
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [authorResults, setAuthorResults] = useState<Article[]>([])
  const [isAuthorLoading, setIsAuthorLoading] = useState(false)

  // 执行搜索
  const performSearch = useCallback(async () => {
    if (!query.trim() && !content.trim() && !category.trim() && !tag.trim() && !author.trim()) {
      setResults(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const payload: any = {}
      if (query.trim()) payload.q = query.trim()
      if (content.trim()) payload.content = content.trim()
      if (category.trim()) payload.category = category.trim()
      if (tag.trim()) payload.tag = tag.trim()
      if (author.trim()) payload.author_username = author.trim()
      payload.page = page
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        throw new Error('搜索请求失败')
      }
      const data = await response.json()
      if (data.success) {
        setResults(data.data)
      } else {
        throw new Error(data.error || '搜索失败')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : '搜索过程中发生错误')
    } finally {
      setIsLoading(false)
    }
  }, [query, content, category, tag, author, page])
  
  // 更新 URL 参数
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }
    
    if (page > 1) {
      params.set("page", page.toString())
    } else {
      params.delete("page")
    }
    
    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }
    
    if (tag) {
      params.set("tag", tag)
    } else {
      params.delete("tag")
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }, [query, page, category, tag, pathname, router, searchParams])
  
  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce(() => {
      performSearch()
      updateUrlParams()
    }, 300),
    [performSearch, updateUrlParams]
  )
  
  // 当搜索参数变化时执行搜索
  useEffect(() => {
    if (query.trim() || content.trim() || category.trim() || tag.trim() || author.trim()) {
      debouncedSearch()
    } else {
      setResults(null)
      updateUrlParams()
    }
  }, [query, content, category, tag, author, page, debouncedSearch, updateUrlParams])
  
  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
    updateUrlParams()
  }
  
  // 处理搜索建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setPage(1)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }
  
  // 处理分页
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // 清除搜索
  const handleClearSearch = () => {
    setQuery("")
    setPage(1)
    setCategory("")
    setTag("")
    setResults(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }
  
  // 在组件内部添加过滤函数
  // 过滤文章
  const getFilteredArticles = (tab?: string) => {
    if (!Array.isArray(results?.articles)) return []
    const articles = results.articles
    const keyword = query.trim()
    const contentKeyword = content.trim()
    const categoryKeyword = category.trim()
    const authorKeyword = author.trim()
    const t = tab || activeTab
    switch (t) {
      case "title":
        return articles.filter(a => keyword && a.title && a.title.includes(keyword))
      case "content":
        return articles.filter(a => contentKeyword && a.content && a.content.includes(contentKeyword))
      case "category":
        // 分类Tab只显示分类包含关键词的文章（用主搜索框关键词）
        return articles.filter(a => keyword && a.category && a.category.includes(keyword))
      case "author":
        // 作者Tab直接返回authorResults
        return authorResults
      case "tags":
        return articles.filter(a => keyword && Array.isArray(a.tags) && a.tags.some(t => t.includes(keyword)))
      case "articles":
        // 文章Tab只显示内容包含关键词的文章
        return articles.filter(a => keyword && a.content && a.content.includes(keyword))
      case "all":
      default:
        // 全部Tab只显示标题或内容包含关键词的文章
        return articles.filter(a => (
          (keyword && a.title && a.title.includes(keyword)) ||
          (keyword && a.content && a.content.includes(keyword))
        ))
    }
  }
  
  return (
    <div className="space-y-6">
      {/* 搜索表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="搜索文章、标签或关键词..."
              className="pl-10 w-full"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              autoFocus
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button type="submit" disabled={!query.trim() || isLoading}>
            <SearchIcon className="w-4 h-4 mr-2" />
            搜索
          </Button>
        </div>
        
        {/* 高级筛选 */}
        <div className="flex flex-wrap gap-2">
          {category && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              分类: {category}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => setCategory("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {tag && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              标签: {tag}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => setTag("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      </form>
      
      {/* 搜索结果 */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="animate-pulse h-6 w-48 bg-muted rounded"></div>
          <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </ResponsiveGrid>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-destructive mb-2">搜索出错</div>
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={performSearch}
            >
              重试
            </Button>
          </CardContent>
        </Card>
      ) : results ? (
        <div className="space-y-6">
          {/* 搜索结果标签页 */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">
                全部 ({getFilteredArticles('all').length})
              </TabsTrigger>
              <TabsTrigger value="articles">
                文章 ({getFilteredArticles('articles').length})
              </TabsTrigger>
              <TabsTrigger value="tags">
                标签 ({getFilteredArticles('tags').length})
              </TabsTrigger>
              <TabsTrigger value="title">标题 ({getFilteredArticles('title').length})</TabsTrigger>
              <TabsTrigger value="content">内容 ({getFilteredArticles('content').length})</TabsTrigger>
              <TabsTrigger value="category">分类 ({getFilteredArticles('category').length})</TabsTrigger>
              <TabsTrigger value="author">作者 ({getFilteredArticles('author').length})</TabsTrigger>
            </TabsList>

            {/* 文章结果 */}
            {getFilteredArticles().length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    搜索结果 ({getFilteredArticles().length})
                  </h2>
                </div>
                <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
                  {getFilteredArticles().map((article) => {
                    const a = article as any
                    return (
                      <ArticleCard
                        key={a.id}
                        article={{
                          ...a,
                          coverImage: a.cover_image || a.coverImage
                        }}
                        variant="default"
                      />
                    )
                  })}
                </ResponsiveGrid>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">未找到结果</h3>
                <p className="text-muted-foreground mb-4">
                  没有找到与当前筛选条件相关的内容
                </p>
                <Button variant="outline" onClick={handleClearSearch}>
                  清除搜索
                </Button>
              </div>
            )}
          </Tabs>
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">搜索中...</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">搜索网站内容</h3>
          <p className="text-muted-foreground">
            输入关键词开始搜索文章、标签和分类
          </p>
        </div>
      )}
    </div>
  )
}
