'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TouchGestureProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  className?: string
  threshold?: number
  longPressDelay?: number
  disabled?: boolean
}

interface TouchPoint {
  x: number
  y: number
  time: number
}

export function TouchGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  className,
  threshold = 50,
  longPressDelay = 500,
  disabled = false,
}: TouchGestureProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    if (disabled) return

    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
      setIsPressed(true)

      // 长按检测
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress()
          setIsPressed(false)
        }, longPressDelay)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      // 如果有移动，取消长按
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      setIsPressed(false)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      const deltaX = touchEndRef.current.x - touchStartRef.current.x
      const deltaY = touchEndRef.current.y - touchStartRef.current.y
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // 检测滑动手势
      if (distance > threshold && deltaTime < 300) {
        const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * (180 / Math.PI)
        
        if (angle < 45) {
          // 水平滑动
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft()
          }
        } else {
          // 垂直滑动
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown()
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp()
          }
        }
      } else if (distance < 10 && deltaTime < 300) {
        // 检测点击
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current

        if (timeSinceLastTap < 300 && onDoubleTap) {
          // 双击
          onDoubleTap()
          lastTapRef.current = 0
        } else {
          // 单击
          if (onTap) {
            onTap()
          }
          lastTapRef.current = now
        }
      }

      touchStartRef.current = null
      touchEndRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [
    disabled,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold,
    longPressDelay,
  ])

  return (
    <div
      ref={elementRef}
      className={cn(
        'touch-manipulation select-none',
        isPressed && 'scale-95 transition-transform duration-100',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * 可滑动的卡片组件
 */
interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipeActive, setIsSwipeActive] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX
      setIsSwipeActive(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeActive) return

      const currentX = e.touches[0].clientX
      const deltaX = currentX - startXRef.current
      const maxOffset = 100

      // 限制滑动距离
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
      setSwipeOffset(clampedOffset)
    }

    const handleTouchEnd = () => {
      setIsSwipeActive(false)
      
      if (Math.abs(swipeOffset) > 50) {
        if (swipeOffset > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (swipeOffset < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
      
      setSwipeOffset(0)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isSwipeActive, swipeOffset, onSwipeLeft, onSwipeRight])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* 左侧操作 */}
      {leftAction && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 flex items-center justify-center bg-green-500 text-white transition-transform duration-200',
            swipeOffset > 0 ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ width: Math.max(0, swipeOffset) }}
        >
          {leftAction}
        </div>
      )}

      {/* 右侧操作 */}
      {rightAction && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 text-white transition-transform duration-200',
            swipeOffset < 0 ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{ width: Math.max(0, -swipeOffset) }}
        >
          {rightAction}
        </div>
      )}

      {/* 主要内容 */}
      <div
        ref={elementRef}
        className="relative z-10 bg-background transition-transform duration-200"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * 下拉刷新组件
 */
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  refreshThreshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - startYRef.current

      if (deltaY > 0) {
        e.preventDefault()
        const distance = Math.min(deltaY * 0.5, refreshThreshold * 1.5)
        setPullDistance(distance)
        setCanRefresh(distance >= refreshThreshold)
      }
    }

    const handleTouchEnd = async () => {
      if (canRefresh && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
      setCanRefresh(false)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [canRefresh, isRefreshing, onRefresh, refreshThreshold])

  return (
    <div ref={elementRef} className={cn('relative', className)}>
      {/* 下拉刷新指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-background/90 backdrop-blur transition-all duration-200"
        style={{
          height: pullDistance,
          transform: `translateY(-${Math.max(0, refreshThreshold - pullDistance)}px)`,
        }}
      >
        {isRefreshing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        ) : (
          <div className={cn(
            'transition-transform duration-200',
            canRefresh && 'rotate-180'
          )}>
            ↓
          </div>
        )}
      </div>

      {/* 主要内容 */}
      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
