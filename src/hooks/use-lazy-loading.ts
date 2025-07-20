"use client"

import { useEffect, useRef, useState } from "react"

/**
 * 懒加载 Hook
 * 使用 Intersection Observer API 实现元素懒加载
 */
export function useLazyLoading<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasIntersected, options])

  return {
    ref,
    isIntersecting,
    hasIntersected,
  }
}

/**
 * 图片懒加载 Hook
 * 专门用于图片懒加载
 */
export function useImageLazyLoading(src: string) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { ref, hasIntersected } = useLazyLoading<HTMLImageElement>()

  useEffect(() => {
    if (hasIntersected && !imageSrc) {
      setImageSrc(src)
    }
  }, [hasIntersected, src, imageSrc])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
  }

  return {
    ref,
    imageSrc,
    isLoaded,
    error,
    handleLoad,
    handleError,
  }
}

/**
 * 无限滚动 Hook
 * 用于实现无限滚动加载
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const { ref, isIntersecting } = useLazyLoading<T>(options)

  useEffect(() => {
    if (isIntersecting) {
      callback()
    }
  }, [isIntersecting, callback])

  return ref
}

/**
 * 虚拟滚动 Hook
 * 用于大列表的性能优化
 */
export function useVirtualScroll<T = any>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
  }))

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  }
}

/**
 * 预加载 Hook
 * 用于预加载资源
 */
export function usePreload() {
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }

  const preloadImages = async (srcs: string[]): Promise<void> => {
    try {
      await Promise.all(srcs.map(preloadImage))
    } catch (error) {
      console.error("Failed to preload images:", error)
    }
  }

  const preloadResource = (href: string, as: string, type?: string) => {
    const link = document.createElement("link")
    link.rel = "preload"
    link.href = href
    link.as = as
    if (type) link.type = type
    link.crossOrigin = "anonymous"
    document.head.appendChild(link)
  }

  return {
    preloadImage,
    preloadImages,
    preloadResource,
  }
}
