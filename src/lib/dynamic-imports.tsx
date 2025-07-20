import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// 类型定义
interface AdminLayoutProps {
  children: React.ReactNode
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface ArticleEditorProps {
  user: User
  articleId?: string
}

interface FileManagerProps {
  user: User
}

/**
 * 动态导入组件的配置选项
 */
interface DynamicImportOptions {
  loading?: ComponentType
  ssr?: boolean
}

/**
 * 创建带有加载状态的动态组件
 */
export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: DynamicImportOptions = {}
) {
  const { loading: LoadingComponent, ssr = false } = options

  return dynamic(
    () => importFn().then(mod => mod.default).catch(() => {
      // 如果导入失败，返回一个错误组件
      return () => <div>Failed to load component</div>
    }),
    {
      loading: LoadingComponent ? () => <LoadingComponent /> : () => <DefaultLoading />,
      ssr,
    }
  )
}

/**
 * 默认加载组件
 */
function DefaultLoading() {
DefaultLoading.displayName = 'DefaultLoading'
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

/**
 * 骨架屏加载组件
 */
export function SkeletonLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  )
}

/**
 * 卡片骨架屏
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border rounded-lg p-6 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
        <div className="h-10 bg-muted rounded w-1/4"></div>
      </div>
    </div>
  )
}

/**
 * 表格骨架屏
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-3">
        {/* 表头 */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded"></div>
          ))}
        </div>
        {/* 表格行 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 预定义的动态组件
 */

// 管理员组件（仅在需要时加载）
export const DynamicAdminLayout = createDynamicComponent<AdminLayoutProps>(
  () => import('@/components/admin/admin-layout').then(mod => ({ default: mod.AdminLayout as ComponentType<AdminLayoutProps> })),
  { ssr: false }
)

export const DynamicAnalyticsCharts = createDynamicComponent<Record<string, never>>(
  () => import('@/components/analytics/analytics-charts').then(mod => ({ default: mod.AnalyticsCharts as ComponentType<Record<string, never>> })),
  {
    loading: () => <SkeletonLoading className="h-64" />,
    ssr: false
  }
)

export const DynamicDashboardStats = createDynamicComponent<Record<string, never>>(
  () => import('@/components/analytics/dashboard-stats').then(mod => ({ default: mod.DashboardStats as ComponentType<Record<string, never>> })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

// 编辑器组件（较大，按需加载）
export const DynamicArticleEditor = createDynamicComponent<ArticleEditorProps>(
  () => import('@/components/article/article-editor').then(mod => ({ default: mod.ArticleEditor as ComponentType<ArticleEditorProps> })),
  {
    loading: () => <SkeletonLoading className="h-96" />,
    ssr: false
  }
)

export const DynamicMarkdownEditor = createDynamicComponent<Record<string, never>>(
  () => import('@/components/ui/markdown-editor').then(mod => ({ default: mod.MarkdownEditor as ComponentType<Record<string, never>> })),
  {
    loading: () => <SkeletonLoading className="h-64" />,
    ssr: false
  }
)

// 文件管理器（功能复杂，按需加载）
export const DynamicFileManager = createDynamicComponent<FileManagerProps>(
  () => import('@/components/files/file-manager').then(mod => ({ default: mod.FileManager as ComponentType<FileManagerProps> })),
  {
    loading: () => <TableSkeleton rows={8} columns={5} />,
    ssr: false
  }
)

// 评论组件（第三方依赖，按需加载）
interface GiscusCommentsProps {
  mapping?: 'number' | 'title' | 'url' | 'pathname' | 'og:title' | 'specific'
  term?: string
}

export const DynamicGiscusComments = createDynamicComponent<GiscusCommentsProps>(
  () => import('@/components/comments/giscus-comments').then(mod => ({ default: mod.SimpleGiscusComments as ComponentType<GiscusCommentsProps> })),
  {
    loading: () => <SkeletonLoading className="h-32" />,
    ssr: false
  }
)

// 图表组件（可视化库较大）
export const DynamicChart = createDynamicComponent<Record<string, never>>(
  () => import('@/components/ui/chart').then(mod => ({ default: mod.Chart as ComponentType<Record<string, never>> })),
  {
    loading: () => <SkeletonLoading className="h-64" />,
    ssr: false
  }
)

/**
 * 路由级别的代码分割
 */
export const DynamicDashboardPage = createDynamicComponent(
  () => import('@/app/dashboard/page'),
  { ssr: false }
)

export const DynamicAnalyticsPage = createDynamicComponent(
  () => import('@/app/dashboard/analytics/page'),
  { ssr: false }
)

export const DynamicArticlesManagePage = createDynamicComponent(
  () => import('@/app/dashboard/articles/page'),
  { ssr: false }
)

/**
 * 工具函数：预加载组件
 */
export function preloadComponent(importFn: () => Promise<any>) {
  // 在空闲时间预加载组件
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      importFn()
    })
  } else {
    // 降级到 setTimeout
    setTimeout(() => {
      importFn()
    }, 100)
  }
}

/**
 * 预加载关键组件
 */
export function preloadCriticalComponents() {
  // 预加载可能很快就会用到的组件
  preloadComponent(() => import('@/components/admin/admin-layout'))
  preloadComponent(() => import('@/components/analytics/dashboard-stats'))
}

/**
 * 条件加载组件
 */
export function conditionallyLoadComponent<T>(
  condition: boolean,
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType<T>
) {
  if (!condition && fallback) {
    return fallback
  }
  
  return createDynamicComponent(importFn, { ssr: false })
}

/**
 * 懒加载 Hook
 */
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  trigger: boolean = true
) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!trigger || Component) return

    setLoading(true)
    setError(null)

    importFn()
      .then(module => {
        setComponent(() => module.default)
      })
      .catch(err => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [trigger, Component, importFn])

  return { Component, loading, error }
}

// 导入 React hooks
import { useState, useEffect } from 'react'
