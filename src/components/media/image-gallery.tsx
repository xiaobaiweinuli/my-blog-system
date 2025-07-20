'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize, 
  Download,
  Share2,
  Info,
  Grid,
  Image as ImageIcon,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Heart,
  MessageSquare,
  Eye
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface GalleryImage {
  src: string
  alt: string
  width?: number
  height?: number
  blurDataUrl?: string
  caption?: string
  tags?: string[]
  likes?: number
  comments?: number
  views?: number
}

interface ImageGalleryProps {
  images: GalleryImage[]
  initialIndex?: number
  columns?: number
  gap?: number
  aspectRatio?: string
  lightbox?: boolean
  masonry?: boolean
  showInfo?: boolean
  showThumbnails?: boolean
  className?: string
  onImageClick?: (image: GalleryImage, index: number) => void
}

export function ImageGallery({
  images,
  initialIndex = 0,
  columns = 3,
  gap = 8,
  aspectRatio = '1/1',
  lightbox = true,
  masonry = false,
  showInfo = true,
  showThumbnails = true,
  className,
  onImageClick
}: ImageGalleryProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '图片画廊',
      loading: '加载中...',
      error: '加载失败',
      download: '下载',
      share: '分享',
      info: '信息',
      close: '关闭',
      previous: '上一张',
      next: '下一张',
      zoomIn: '放大',
      zoomOut: '缩小',
      rotate: '旋转',
      reset: '重置',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      image: '图片',
      of: '共',
      likes: '点赞',
      comments: '评论',
      views: '浏览',
      tags: '标签',
      caption: '说明',
      noImages: '暂无图片',
      shareSuccess: '分享成功',
      shareFailed: '分享失败',
      downloadSuccess: '下载成功',
      downloadFailed: '下载失败',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [containerWidth, setContainerWidth] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const lightboxImageRef = useRef<HTMLImageElement>(null)

  // 计算容器宽度
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
      
      const handleResize = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth)
        }
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return
      
      switch (e.key) {
        case 'ArrowLeft':
          navigateToPrevious()
          break
        case 'ArrowRight':
          navigateToNext()
          break
        case 'Escape':
          closeLightbox()
          break
        case '+':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case 'r':
          rotate()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, currentIndex])

  // 打开灯箱
  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsLightboxOpen(true)
    setZoom(1)
    setRotation(0)
    setDragPosition({ x: 0, y: 0 })
    document.body.style.overflow = 'hidden'
    
    if (onImageClick) {
      onImageClick(images[index], index)
    }
  }

  // 关闭灯箱
  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = ''
  }

  // 导航到上一张图片
  const navigateToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
    resetZoomAndRotation()
  }

  // 导航到下一张图片
  const navigateToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    resetZoomAndRotation()
  }

  // 重置缩放和旋转
  const resetZoomAndRotation = () => {
    setZoom(1)
    setRotation(0)
    setDragPosition({ x: 0, y: 0 })
    setIsLoading(true)
  }

  // 缩放图片
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  // 旋转图片
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1) {
      setIsDragging(true)
    }
  }

  // 处理拖动
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 1) {
      setDragPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }))
    }
  }

  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // 下载图片
  const downloadImage = () => {
    const image = images[currentIndex]
    const a = document.createElement('a')
    a.href = image.src
    a.download = image.alt || `image-${currentIndex}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 分享图片
  const shareImage = async () => {
    const image = images[currentIndex]
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.alt || t('image'),
          text: image.caption || t('checkOutImage'),
          url: image.src
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(image.src)
        showToast.success(t('linkCopied'))
      } catch (error) {
        console.error('Failed to copy link:', error)
        showToast.error(t('copyFailed'))
      }
    }
  }

  // 计算图片网格样式
  const getGridStyle = () => {
    if (masonry) {
      return {
        columnCount: columns,
        columnGap: `${gap}px`
      }
    }
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${gap}px`
    }
  }

  // 渲染图片网格
  const renderImageGrid = () => (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={getGridStyle()}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            "relative overflow-hidden rounded-lg cursor-pointer",
            masonry ? "mb-2 break-inside-avoid" : ""
          )}
          style={!masonry ? { aspectRatio } : {}}
          onClick={() => lightbox && openLightbox(index)}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            loading="lazy"
            style={masonry ? { display: 'block', width: '100%' } : {}}
          />
          
          {showInfo && (image.caption || image.tags) && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white">
              {image.caption && (
                <p className="text-sm truncate">{image.caption}</p>
              )}
              
              {image.tags && image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {image.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {image.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{image.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // 渲染灯箱
  const renderLightbox = () => (
    <AnimatePresence>
      {isLightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        >
          {/* 灯箱头部 */}
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeLightbox}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={rotate}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={shareImage}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 灯箱内容 */}
          <div 
            className="flex-1 flex items-center justify-center overflow-hidden"
            onMouseDown={handleDragStart}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-12 w-12 text-white animate-spin" />
              </div>
            )}
            
            <img
              ref={lightboxImageRef}
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              className="max-w-full max-h-full object-contain transition-opacity duration-300"
              style={{
                transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                opacity: isLoading ? 0 : 1,
                cursor: isDragging ? 'grabbing' : 'inherit'
              }}
              onLoad={() => setIsLoading(false)}
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateToPrevious}
              className="absolute left-4 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateToNext}
              className="absolute right-4 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
          
          {/* 灯箱底部 */}
          <div className="p-4 text-white">
            {showInfo && (
              <div className="mb-4">
                <h3 className="text-lg font-medium">{images[currentIndex].alt}</h3>
                
                {images[currentIndex].caption && (
                  <p className="text-sm text-gray-300 mt-1">{images[currentIndex].caption}</p>
                )}
                
                {images[currentIndex].tags && images[currentIndex].tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {images[currentIndex].tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {(images[currentIndex].likes !== undefined || 
                  images[currentIndex].comments !== undefined || 
                  images[currentIndex].views !== undefined) && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                    {images[currentIndex].likes !== undefined && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {images[currentIndex].likes}
                      </div>
                    )}
                    
                    {images[currentIndex].comments !== undefined && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {images[currentIndex].comments}
                      </div>
                    )}
                    
                    {images[currentIndex].views !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {images[currentIndex].views}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {showThumbnails && (
              <div className="overflow-x-auto">
                <div className="flex gap-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2",
                        index === currentIndex ? "border-primary" : "border-transparent"
                      )}
                      onClick={() => {
                        setCurrentIndex(index)
                        resetZoomAndRotation()
                      }}
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover object-center mx-auto block"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {renderImageGrid()}
      {renderLightbox()}
    </>
  )
}
