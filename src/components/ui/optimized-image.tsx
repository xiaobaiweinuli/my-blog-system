"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
  fill?: boolean
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  objectPosition?: string
  onLoad?: () => void
  fallbackSrc?: string
  lazy?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  [key: string]: any
}

/**
 * 优化的图片组件
 * 提供懒加载、模糊占位符、错误处理等功能
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "100vw",
  quality = 75,
  fill = false,
  objectFit = "cover",
  objectPosition = "center",
  onLoad,
  fallbackSrc = "/images/placeholder.jpg",
  lazy = true,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const [isInView, setIsInView] = useState(!lazy || priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // 懒加载逻辑
  useEffect(() => {
    if (!lazy || priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isInView])

  // 当 src 变化时重置状态
  useEffect(() => {
    setIsLoading(true)
    setError(false)
    setImageSrc(src)
  }, [src])

  // 生成模糊占位符
  const defaultBlurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="

  // 处理图片加载完成
  const handleImageLoad = () => {
    setIsLoading(false)
    if (onLoad) onLoad()
  }

  // 处理图片加载错误
  const handleImageError = () => {
    setError(true)
    setImageSrc(fallbackSrc)
  }

  // 如果图片不在视口内，显示占位符
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "flex items-center justify-center bg-muted animate-pulse",
          className
        )}
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
        }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded mx-auto mb-2"></div>
          <div className="w-16 h-3 bg-muted-foreground/20 rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        isLoading && "animate-pulse bg-muted",
        className
      )}
      style={{
        width: fill ? "100%" : width,
        height: fill ? "100%" : height,
      }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          objectFit === "cover" && "object-cover object-center",
          objectFit === "contain" && "object-contain object-center",
          objectFit === "fill" && "object-fill object-center",
          objectFit === "none" && "object-none object-center",
          objectFit === "scale-down" && "object-scale-down object-center"
        )}
        style={{ objectPosition }}
        priority={priority}
        placeholder="blur"
        blurDataURL={blurDataURL || defaultBlurDataURL}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        quality={quality}
        fill={fill}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  )
}

/**
 * 响应式图片组件
 * 根据屏幕尺寸加载不同大小的图片
 */
export function ResponsiveImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  // 构建响应式图片源
  const basePath = src.replace(/\.[^/.]+$/, "") // 移除扩展名
  const extension = src.split('.').pop() || "jpg"
  
  // 生成不同尺寸的图片路径
  const srcSet = {
    small: `${basePath}-sm.${extension}`,
    medium: `${basePath}-md.${extension}`,
    large: `${basePath}-lg.${extension}`,
    original: src,
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      srcSet={`
        ${srcSet.small} 640w,
        ${srcSet.medium} 1024w,
        ${srcSet.large} 1920w,
        ${srcSet.original} 2560w
      `}
      {...props}
    />
  )
}

/**
 * 背景图片组件
 */
export function BackgroundImage({
  src,
  alt,
  className,
  children,
  overlay = false,
  overlayColor = "rgba(0, 0, 0, 0.5)",
  ...props
}: OptimizedImageProps & {
  children?: React.ReactNode
  overlay?: boolean
  overlayColor?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="absolute inset-0 z-0"
        {...props}
      />
      
      {overlay && (
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: overlayColor }}
        />
      )}
      
      {children && (
        <div className="relative z-20">{children}</div>
      )}
    </div>
  )
}
