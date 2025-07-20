"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ArrowRight, Clock, TrendingUp, FileText, Hash, User, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command"
import { debounce, cn, getCurrentTimestamp } from "@/lib/utils"
import { secureFetch } from '@/lib/utils/secure-fetch';

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
}

interface SearchHistory {
  query: string
  timestamp: number
  resultCount: number
}

export function GlobalSearch() {
  const router = useRouter()
  
  // 检查是否有国际化上下文
  const t = (key: string) => {
    const fallback = {
      searchPlaceholder: '搜索文章、标签、用户...',
      searchButton: '搜索',
      recentSearches: '最近搜索',
      trendingSearches: '热门搜索',
      noResults: '没有找到相关结果',
      searchSuggestions: '搜索建议',
      suggestion1: '检查拼写是否正确',
      suggestion2: '尝试使用更简单的关键词',
      suggestion3: '尝试使用同义词',
      clearHistory: '清除历史',
      articles: '文章',
      tags: '标签',
      users: '用户',
      categories: '分类',
      viewAll: '查看全部',
      noRecentSearches: '暂无搜索历史',
      searchFailed: '搜索失败'
    }
    return (fallback as any)[key] || key
  }
  
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
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
    setSearchHistory(prevHistory => {
      const newHistory = [
        { query: searchQuery, timestamp: getCurrentTimestamp(), resultCount },
        ...prevHistory.filter(item => item.query !== searchQuery)
      ].slice(0, 10)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }, [])

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
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, results, selectedIndex])
  
  // 获取搜索建议
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await secureFetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
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

  // 当查询变化时执行搜索和获取建议
  useEffect(() => {
    if (open) {
      // 直接定义函数，避免依赖项死循环
      const doSearch = debounce(async (searchQuery: string) => {
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
            highlight: "true"
          })
          const response = await secureFetch(`/api/search?${params.toString()}`)
          if (!response.ok) throw new Error(t('searchFailed'))
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
      }, 300)
      const doSuggestions = async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
          setSuggestions([])
          return
        }
        try {
          const response = await secureFetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setSuggestions(data.data.suggestions || [])
            }
          }
        } catch (error) {
          console.error('Failed to get suggestions:', error)
        }
      }
      doSearch(query)
      doSuggestions(query)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open])

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
    router.push(`/search?q=${encodeURIComponent(query)}`)
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
        <span className="hidden lg:inline-flex">{t('searchPlaceholder')}</span>
        <span className="inline-flex lg:hidden">{t('searchButton')}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          aria-label="全局搜索"
          placeholder={t('searchPlaceholder')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="py-6 text-center text-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2">搜索中...</p>
              </div>
            ) : (
              <div className="py-6 text-center text-sm">
                没有找到与 "{query}" 相关的内容
              </div>
            )}
          </CommandEmpty>
          
          {results.length > 0 && (
            <>
              <CommandGroup heading="文章">
                {results.map((article) => (
                  <CommandItem
                    key={article.id}
                    onSelect={() => handleResultClick(article as SearchResult)}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{article.title}</div>
                      {article.excerpt && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {article.excerpt}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup>
                <CommandItem
                  onSelect={handleViewAllResults}
                  className="justify-center text-center"
                >
                  <div className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    查看所有结果
                  </div>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
