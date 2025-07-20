'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
  showHome?: boolean
  homeLabel?: string
  homeHref?: string
}

export function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true,
  homeLabel,
  homeHref = '/',
}: BreadcrumbProps) {
  // 检查是否有国际化上下文
  const t = (key: string) => {
    const fallback = {
      home: '首页'
    }
    return (fallback as any)[key] || key
  }
  
  const finalHomeLabel = homeLabel || t('home')
  
  const allItems = showHome 
    ? [{ label: finalHomeLabel, href: homeHref, current: false }, ...items]
    : items

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isCurrent = item.current || isLast
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground/60" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {index === 0 && showHome && (
                    <Home className="h-4 w-4" />
                  )}
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={cn(
                    'flex items-center gap-1',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {index === 0 && showHome && (
                    <Home className="h-4 w-4" />
                  )}
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * 简化的面包屑组件，自动处理常见路径
 */
export function AutoBreadcrumb({
  currentPage,
  className,
}: {
  currentPage: string
  className?: string
}) {
  // 检查是否有国际化上下文
  const t = (key: string) => {
    const fallback = {
      articles: '文章',
      dashboard: '管理后台',
      files: '文件',
      categories: '分类',
      friendLinks: '友情链接',
      pages: '页面',
      archive: '归档',
      now: '现在',
      guestbook: '留言'
    }
    return (fallback as any)[key] || key
  }
  
  // 根据当前路径自动生成面包屑
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const path = window.location.pathname
    const segments = path.split('/').filter(Boolean)
    
    const breadcrumbs: BreadcrumbItem[] = []
    
    // 处理常见路径
    if (segments.includes('articles')) {
      breadcrumbs.push({ label: t('articles'), href: '/articles' })
      
      if (segments.length > 2) {
        // 文章详情页
        breadcrumbs.push({ label: currentPage, current: true })
      }
    } else if (segments.includes('dashboard')) {
      breadcrumbs.push({ label: t('dashboard'), href: '/dashboard' })
      
      if (segments.includes('articles')) {
        breadcrumbs.push({ label: t('articles'), href: '/dashboard/articles' })
      } else if (segments.includes('files')) {
        breadcrumbs.push({ label: t('files'), href: '/dashboard/files' })
      } else if (segments.includes('categories')) {
        breadcrumbs.push({ label: t('categories'), href: '/dashboard/categories' })
      } else if (segments.includes('friend-links')) {
        breadcrumbs.push({ label: t('friendLinks'), href: '/dashboard/friend-links' })
      } else if (segments.includes('pages')) {
        breadcrumbs.push({ label: t('pages'), href: '/dashboard/pages' })
      }
      
      if (segments[segments.length - 1] !== 'dashboard') {
        breadcrumbs.push({ label: currentPage, current: true })
      }
    } else if (segments.includes('friends')) {
      breadcrumbs.push({ label: t('friendLinks'), current: true })
    } else if (segments.includes('archive')) {
      breadcrumbs.push({ label: t('archive'), current: true })
    } else if (segments.includes('now')) {
      breadcrumbs.push({ label: t('now'), current: true })
    } else if (segments.includes('guestbook')) {
      breadcrumbs.push({ label: t('guestbook'), current: true })
    } else {
      // 其他页面
      breadcrumbs.push({ label: currentPage, current: true })
    }
    
    return breadcrumbs
  }
  
  const items = generateBreadcrumbs()
  
  return <Breadcrumb items={items} className={className} />
}

/**
 * 文章面包屑组件
 */
export function ArticleBreadcrumb({
  category,
  title,
  className,
}: {
  category?: string
  title: string
  className?: string
}) {
  // 检查是否有国际化上下文
  const t = (key: string) => {
    const fallback = {
      articles: '文章'
    }
    return (fallback as any)[key] || key
  }
  
  const items: BreadcrumbItem[] = [
    { label: t('articles'), href: '/articles' },
  ]
  
  if (category) {
    items.push({ 
      label: category, 
      href: `/articles?category=${encodeURIComponent(category)}` 
    })
  }
  
  items.push({ label: title, current: true })
  
  return <Breadcrumb items={items} className={className} />
}

/**
 * 管理后台面包屑组件
 */
export function AdminBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  // 检查是否有国际化上下文
  const t = (key: string) => {
    const fallback = {
      dashboard: '管理后台'
    }
    return (fallback as any)[key] || key
  }
  
  const adminItems: BreadcrumbItem[] = [
    { label: t('dashboard'), href: '/dashboard' },
    ...items,
  ]
  
  return <Breadcrumb items={adminItems} className={className} />
}

/**
 * 页面面包屑组件
 */
export function PageBreadcrumb({
  title,
  parentPages = [],
  className,
}: {
  title: string
  parentPages?: Array<{ title: string; slug: string }>
  className?: string
}) {
  const items: BreadcrumbItem[] = []
  
  // 添加父页面
  parentPages.forEach(page => {
    items.push({ 
      label: page.title, 
      href: `/pages/${page.slug}` 
    })
  })
  
  // 添加当前页面
  items.push({ label: title, current: true })
  
  return <Breadcrumb items={items} className={className} />
}

/**
 * 结构化数据面包屑
 */
export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${window.location.origin}${item.href}` }),
    })),
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
