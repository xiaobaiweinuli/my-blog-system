'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Hash, User, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SearchFiltersProps {
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

interface FilterOption {
  value: string
  label: string
  count?: number
}

export function SearchFilters({ searchParams }: SearchFiltersProps) {
  // 检查是否有国际化上下文
  const t = {
    allTypes: '所有类型',
    articles: '文章',
    tags: '标签',
    categories: '分类',
    users: '用户',
    allTime: '所有时间',
    today: '今天',
    thisWeek: '本周',
    thisMonth: '本月',
    thisYear: '今年',
    activeFilters: '活跃过滤器',
    clearAll: '清除全部',
    type: '类型',
    category: '分类',
    tag: '标签',
    author: '作者',
    date: '日期',
    contentType: '内容类型',
    selectCategory: '选择分类',
    allCategories: '所有分类',
    selectTag: '选择标签',
    allTags: '所有标签',
    selectAuthor: '选择作者',
    allAuthors: '所有作者',
    dateRange: '日期范围',
    selectDateRange: '选择日期范围'
  }
  
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [tags, setTags] = useState<FilterOption[]>([])
  const [authors, setAuthors] = useState<FilterOption[]>([])

  // 加载过滤器选项
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/search/filters')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCategories(data.data.categories || [])
            setTags(data.data.tags || [])
            setAuthors(data.data.authors || [])
          }
        }
      } catch (error) {
        console.error('Failed to load filter options:', error)
      }
    }

    loadFilterOptions()
  }, [])

  // 更新搜索参数
  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // 重置页码
    params.delete('page')
    
    router.push(`/search?${params.toString()}`)
  }

  // 清除所有过滤器
  const clearAllFilters = () => {
    const params = new URLSearchParams()
    if (searchParams.q) {
      params.set('q', searchParams.q)
    }
    router.push(`/search?${params.toString()}`)
  }

  // 检查是否有活跃的过滤器
  const hasActiveFilters = Boolean(
    searchParams.type || 
    searchParams.category || 
    searchParams.tag || 
    searchParams.author || 
    searchParams.date
  )

  const contentTypes = [
    { value: 'all', label: t.allTypes, icon: null },
    { value: 'article', label: t.articles, icon: FileText },
    { value: 'tag', label: t.tags, icon: Hash },
    { value: 'category', label: t.categories, icon: Hash },
    { value: 'user', label: t.users, icon: User },
  ]

  const dateRanges = [
    { value: 'all', label: t.allTime },
    { value: 'today', label: t.today },
    { value: 'week', label: t.thisWeek },
    { value: 'month', label: t.thisMonth },
    { value: 'year', label: t.thisYear },
  ]

  return (
    <div className="space-y-6">
      {/* 活跃过滤器 */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t.activeFilters}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              {t.clearAll}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {searchParams.type && searchParams.type !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {t.type}: {contentTypes.find(t => t.value === searchParams.type)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateSearchParams('type', null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {searchParams.category && (
              <Badge variant="secondary" className="text-xs">
                {t.category}: {categories.find(c => c.value === searchParams.category)?.label || searchParams.category}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateSearchParams('category', null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {searchParams.tag && (
              <Badge variant="secondary" className="text-xs">
                {t.tag}: {tags.find(t => t.value === searchParams.tag)?.label || searchParams.tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateSearchParams('tag', null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {searchParams.author && (
              <Badge variant="secondary" className="text-xs">
                {t.author}: {authors.find(a => a.value === searchParams.author)?.label || searchParams.author}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateSearchParams('author', null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {searchParams.date && searchParams.date !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {t.date}: {dateRanges.find(d => d.value === searchParams.date)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateSearchParams('date', null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          
          <Separator />
        </div>
      )}

      {/* 内容类型过滤器 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.contentType}</Label>
        <div className="grid grid-cols-1 gap-2">
          {contentTypes.map((type) => {
            const Icon = type.icon
            const isActive = (searchParams.type || 'all') === type.value
            
            return (
              <Button
                key={type.value}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "justify-start h-auto py-2 px-3",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSearchParams('type', type.value)}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                <span className="flex-1 text-left">{type.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* 分类过滤器 */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t.category}</Label>
          <Select
            value={searchParams.category || 'all'}
            onValueChange={(value) => updateSearchParams('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.selectCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCategories}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{category.label}</span>
                    {category.count && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({category.count})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 标签过滤器 */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t.tag}</Label>
          <Select
            value={searchParams.tag || 'all'}
            onValueChange={(value) => updateSearchParams('tag', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.selectTag} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTags}</SelectItem>
              {tags.slice(0, 20).map((tag) => (
                <SelectItem key={tag.value} value={tag.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>#{tag.label}</span>
                    {tag.count && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({tag.count})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 作者过滤器 */}
      {authors.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t.author}</Label>
          <Select
            value={searchParams.author || 'all'}
            onValueChange={(value) => updateSearchParams('author', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.selectAuthor} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allAuthors}</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.value} value={author.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{author.label}</span>
                    {author.count && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({author.count})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      {/* 日期范围过滤器 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.dateRange}</Label>
        <Select
          value={searchParams.date || 'all'}
          onValueChange={(value) => updateSearchParams('date', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.selectDateRange} />
          </SelectTrigger>
          <SelectContent>
            {dateRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
