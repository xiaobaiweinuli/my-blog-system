"use client"

import { useEffect } from "react"

/**
 * 性能监控组件
 * 监控页面性能指标并上报
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // 监控 Core Web Vitals
    if (typeof window !== "undefined" && "performance" in window) {
      // 监控 LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            //console.log("LCP:", entry.startTime)
            // 在实际应用中，这里应该上报到分析服务
          }
        }
      })

      try {
        observer.observe({ entryTypes: ["largest-contentful-paint"] })
      } catch (e) {
        // 浏览器不支持
      }

      // 监控 FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "first-input") {
            const fid = (entry as any).processingStart - entry.startTime
            //console.log("FID:", fid)
            // 在实际应用中，这里应该上报到分析服务
          }
        }
      })

      try {
        fidObserver.observe({ entryTypes: ["first-input"] })
      } catch (e) {
        // 浏览器不支持
      }

      // 监控 CLS (Cumulative Layout Shift)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        //console.log("CLS:", clsValue)
      })

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] })
      } catch (e) {
        // 浏览器不支持
      }

      // 监控页面加载时间
      window.addEventListener("load", () => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
          const firstByte = navigation.responseStart - navigation.fetchStart

          //console.log("Page Load Time:", loadTime)
          //console.log("DOM Content Loaded:", domContentLoaded)
          //console.log("Time to First Byte:", firstByte)
        }
      })

      // 清理函数
      return () => {
        observer.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [])

  return null // 这是一个监控组件，不渲染任何内容
}

/**
 * 资源预加载 Hook
 */
export function useResourcePreload() {
  useEffect(() => {
    // 预加载关键资源
    const preloadResources = [
      { href: "/fonts/inter.woff2", as: "font", type: "font/woff2" },
      // 可以添加更多需要预加载的资源
    ]

    preloadResources.forEach(({ href, as, type }) => {
      const link = document.createElement("link")
      link.rel = "preload"
      link.href = href
      link.as = as
      if (type) link.type = type
      link.crossOrigin = "anonymous"
      document.head.appendChild(link)
    })
  }, [])
}

/**
 * 代码分割和懒加载工具
 */
export const LazyComponents = {
  // 懒加载文章编辑器
  ArticleEditor: dynamic(() => import("@/components/article/article-editor").then(mod => ({ default: mod.ArticleEditor })), {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg"></div>,
    ssr: false,
  }),

  // 懒加载文件管理器
  FileManager: dynamic(() => import("@/components/files/file-manager").then(mod => ({ default: mod.FileManager })), {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg"></div>,
    ssr: false,
  }),

  // 懒加载搜索界面
  SearchInterface: dynamic(() => import("@/components/search/search-interface").then(mod => ({ default: mod.SearchInterface })), {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg"></div>,
    ssr: false,
  }),

  // 懒加载 AI 助手
  AIAssistant: dynamic(() => import("@/components/article/ai-assistant").then(mod => ({ default: mod.AIAssistant })), {
    loading: () => <div className="animate-pulse h-48 bg-muted rounded-lg"></div>,
    ssr: false,
  }),
}

// 需要在文件顶部导入 dynamic
import dynamic from "next/dynamic"

/**
 * 图片优化组件
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  ...props
}: {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  [key: string]: any
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      loading={priority ? "eager" : "lazy"}
      {...props}
    />
  )
}

// 需要在文件顶部导入 Image
import Image from "next/image"
