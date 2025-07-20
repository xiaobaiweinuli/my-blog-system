"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useLazyLoading } from "@/hooks/use-lazy-loading"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
  [key: string]: any
}

/**
 * 懒加载图片组件
 * 使用 Intersection Observer 实现图片懒加载
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkwyNCAyNE0yNCAxNkwxNiAyNCIgc3Ryb2tlPSIjOUI5QkEwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K",
  fallbackSrc = "/images/placeholder.jpg",
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
  const imgRef = useRef<HTMLImageElement>(null)
  
  const { ref: containerRef, hasIntersected } = useLazyLoading<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: "50px",
  })

  // 当元素进入视口时开始加载图片
  useEffect(() => {
    if (hasIntersected && !imageSrc && !hasError) {
      setImageSrc(src)
    }
  }, [hasIntersected, src, imageSrc, hasError])

  // 处理图片加载完成
  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()
  }

  // 处理图片加载错误
  const handleError = () => {
    setHasError(true)
    setImageSrc(fallbackSrc)
    if (onError) onError()
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        !isLoaded && "animate-pulse",
        className
      )}
      style={{ width, height }}
      {...props}
    >
      {/* 占位符 */}
      {!hasIntersected && (
        <img
          src={placeholder}
          alt=""
          className="w-full h-full object-cover opacity-50"
          aria-hidden="true"
        />
      )}

      {/* 实际图片 */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* 加载指示器 */}
      {hasIntersected && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 懒加载背景图片组件
 */
export function LazyBackgroundImage({
  src,
  alt,
  className,
  children,
  overlay = false,
  overlayColor = "rgba(0, 0, 0, 0.5)",
  ...props
}: LazyImageProps & {
  children?: React.ReactNode
  overlay?: boolean
  overlayColor?: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined)
  
  const { ref, hasIntersected } = useLazyLoading<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: "50px",
  })

  // 当元素进入视口时开始加载背景图片
  useEffect(() => {
    if (hasIntersected && !backgroundImage) {
      const img = new Image()
      img.onload = () => {
        setBackgroundImage(`url(${src})`)
        setIsLoaded(true)
      }
      img.src = src
    }
  }, [hasIntersected, src, backgroundImage])

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-muted",
        !isLoaded && "animate-pulse",
        className
      )}
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      {...props}
    >
      {/* 遮罩层 */}
      {overlay && isLoaded && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor }}
        />
      )}

      {/* 加载指示器 */}
      {hasIntersected && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 内容 */}
      {children && (
        <div className="relative z-10">{children}</div>
      )}

      {/* 无障碍访问 */}
      <span className="sr-only">{alt}</span>
    </div>
  )
}
