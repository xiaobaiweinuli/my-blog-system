'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ArrowRight, Clock, TrendingUp, FileText, Hash, User, Calendar, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { getCurrentTimestamp } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'article' | 'tag' | 'category' | 'user'
  title: string
  excerpt?: string
  slug: string
  category?: string
  tags?: string[]
  publishedAt?: string
  author?: string
  highlight?: string
  score?: number
}

interface SearchHistory {
  query: string
  timestamp: number
  resultCount: number
}

interface SearchFilters {
  type?: string
  category?: string
  dateRange?: string
  author?: string
}

export function EnhancedSearch() {
  const router = useRouter()
  
  // 检查是否有国际化上下文
  let t: any = null
  try {
    t = (key: string, values?: any) => {
      const defaultTexts: Record<string, string> = {
        placeholder: '搜索文章、标签、分类...',
        noResults: '没有找到相关结果',
        searchFailed: '搜索失败',
        recentSearches: '最近搜索',
        clearHistory: '清除历史',
        viewAllResults: '查看所有结果',
        searchHistory: '搜索历史',
        suggestions: '搜索建议',
        articles: '文章',
        tags: '标签',
        categories: '分类',
        users: '用户'
      }
      return defaultTexts[key] || key
    }
  } catch {
    // 如果没有国际化上下文，使用默认文本函数
    t = (key: string, values?: any) => {
      const defaultTexts: Record<string, string> = {
        placeholder: '搜索文章、标签、分类...',
        noResults: '没有找到相关结果',
        searchFailed: '搜索失败',
        recentSearches: '最近搜索',
        clearHistory: '清除历史',
        viewAllResults: '查看所有结果',
        searchHistory: '搜索历史',
        suggestions: '搜索建议',
        articles: '文章',
        tags: '标签',
        categories: '分类',
        users: '用户'
      }
      return defaultTexts[key] || key
    }
  }
  
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // 防抖搜索
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    
    debounceTimeout.current = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)
  }, [])

  // 加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = useCallback((searchQuery: string, resultCount: number) => {
    const newHistory: SearchHistory = {
      query: searchQuery,
      timestamp: getCurrentTimestamp(),
      resultCount,
    }

    const updatedHistory = [
      newHistory,
      ...searchHistory.filter(item => item.query !== searchQuery)
    ].slice(0, 10)

    setSearchHistory(updatedHistory)
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory))
  }, [searchHistory])

  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }, [])

  // 获取搜索建议
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data.suggestions || [])
        }
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error)
    }
  }, [])

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      return
    }
    
    setIsLoading(true)
    setSelectedIndex(-1)
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "8",
        highlight: "true",
        ...filters
      })
      
      const response = await fetch(`/api/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(t('searchFailed'))
      }
      
      const data = await response.json()
      
      if (data.success) {
        const searchResults = data.data.results || []
        setResults(searchResults)
        
        if (searchResults.length > 0) {
          saveSearchHistory(searchQuery, searchResults.length)
        }
      } else {
        throw new Error(data.error || t('searchFailed'))
      }
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, saveSearchHistory, t])

  // 监听快捷键
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          )
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex(prev => prev > -1 ? prev - 1 : prev)
        } else if (e.key === "Enter" && selectedIndex >= 0) {
          e.preventDefault()
          const selectedResult = results[selectedIndex]
          if (selectedResult) {
            handleResultClick(selectedResult)
          }
        } else if (e.key === "Escape") {
          setOpen(false)
        }
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, results, selectedIndex])

  // 当查询变化时执行搜索和获取建议
  useEffect(() => {
    if (open) {
      debouncedSearch(query)
      getSuggestions(query)
    }
  }, [query, open, debouncedSearch, getSuggestions])

  // 处理搜索结果点击
  const handleResultClick = (result: SearchResult) => {
    let path = ''
    switch (result.type) {
      case 'article':
        path = `/articles/${result.slug}`
        break
      case 'tag':
        path = `/tags/${result.slug}`
        break
      case 'category':
        path = `/categories/${result.slug}`
        break
      case 'user':
        path = `/users/${result.slug}`
        break
      default:
        path = `/search?q=${encodeURIComponent(query)}`
    }
    
    setOpen(false)
    router.push(path)
  }

  // 处理历史记录点击
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
  }

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
  }

  // 处理查看所有结果
  const handleViewAllResults = () => {
    setOpen(false)
    const params = new URLSearchParams({ q: query, ...filters })
    router.push(`/search?${params.toString()}`)
  }

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
        return <FileText className="h-4 w-4" />
      case 'tag':
        return <Hash className="h-4 w-4" />
      case 'category':
        return <Hash className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 hover:bg-accent transition-colors"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-flex">{t('placeholder')}</span>
        <span className="inline-flex lg:hidden">{t('search')}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            aria-label="增强搜索"
            placeholder={t('inputPlaceholder')}
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* 搜索过滤器 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b px-3 py-2"
            >
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="cursor-pointer">
                  {t('allTypes')}
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  {t('articles')}
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  {t('tags')}
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CommandList>
          {/* 搜索历史 */}
          {!query && searchHistory.length > 0 && (
            <CommandGroup heading={t('recentSearches')}>
              {searchHistory.slice(0, 5).map((history, index) => (
                <CommandItem
                  key={index}
                  value={history.query}
                  onSelect={() => handleHistoryClick(history.query)}
                  className="flex items-center gap-3 p-3"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{history.query}</div>
                    <div className="text-xs text-muted-foreground">
                      {history.resultCount} {t('results')} • {new Date(history.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </CommandItem>
              ))}
              {searchHistory.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={clearSearchHistory}
                    className="text-muted-foreground text-sm p-2"
                  >
                    <X className="h-3 w-3 mr-2" />
                    {t('clearHistory')}
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          )}

          {/* 搜索建议 */}
          {query && suggestions.length > 0 && !isLoading && (
            <CommandGroup heading={t('suggestions')}>
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <CommandItem
                  key={index}
                  value={suggestion}
                  onSelect={() => handleSuggestionClick(suggestion)}
                  className="flex items-center gap-3 p-3"
                >
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{suggestion}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-6 w-6 border-b-2 border-primary"
              />
            </div>
          )}
          
          {/* 无结果 */}
          {!isLoading && query && results.length === 0 && suggestions.length === 0 && (
            <CommandEmpty>
              <div className="text-center py-6">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('noResultsDesc', { query })}
                </p>
              </div>
            </CommandEmpty>
          )}
          
          {/* 搜索结果 */}
          {!isLoading && results.length > 0 && (
            <CommandGroup heading={`${results.length} ${t('results')}`}>
              {results.map((result, index) => (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleResultClick(result)}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    selectedIndex === index && "bg-accent"
                  )}
                >
                  <div className="mt-0.5">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {result.highlight ? (
                        <span dangerouslySetInnerHTML={{ __html: result.highlight }} />
                      ) : (
                        highlightText(result.title, query)
                      )}
                    </div>
                    {result.excerpt && (
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {highlightText(result.excerpt, query)}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {result.category && (
                        <Badge variant="secondary" className="text-xs">
                          {result.category}
                        </Badge>
                      )}
                      {result.publishedAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.publishedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                </CommandItem>
              ))}
              
              {query && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={handleViewAllResults}
                    className="flex items-center gap-2 p-3 text-primary font-medium"
                  >
                    <Search className="h-4 w-4" />
                    <span>{t('viewAllResults', { query })}</span>
                    <ArrowRight className="h-4 w-4" />
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
