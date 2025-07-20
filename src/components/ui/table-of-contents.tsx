"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { List, X } from "lucide-react"
import { createPortal } from "react-dom"

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
  className?: string
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dragDataRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 })
  const dragThreshold = 5 // 拖拽阈值，超过这个距离才算拖拽

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // 解析 Markdown 内容中的标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: TocItem[] = []
    let match

    // 调试：打印内容长度和前100个字符
    //console.log('TableOfContents - Content length:', content?.length || 0)
    //console.log('TableOfContents - Content preview:', content?.substring(0, 100) || 'No content')

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      // 使用与 MarkdownRenderer 相同的 ID 生成算法
      const id = text
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // 支持中文字符，与 MarkdownRenderer 保持一致
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      headings.push({ id, text, level })
    }

    //console.log('TableOfContents - Found headings:', headings.length, headings)
    setToc(headings)
  }, [content])

  useEffect(() => {
    // 监听滚动事件，高亮当前章节
    const handleScroll = () => {
      const headingElements = toc.map(item =>
        document.getElementById(item.id)
      ).filter(Boolean)

      const scrollPosition = window.scrollY + 100

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(toc[i].id)
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // 初始调用

    return () => window.removeEventListener("scroll", handleScroll)
  }, [toc])

  // 拖拽处理 - 简化版本
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 记录拖拽数据
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y
    }
    setHasMoved(false)

    // 延迟启动拖拽，避免误触
    const dragTimer = setTimeout(() => {
      setIsDragging(true)
    }, 100)

    // 清理函数
    const cleanup = () => {
      clearTimeout(dragTimer)
      document.removeEventListener('mousemove', checkDragStart)
      document.removeEventListener('mouseup', cleanup)
    }

    // 检查是否开始拖拽
    const checkDragStart = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - dragDataRef.current.startX)
      const deltaY = Math.abs(moveEvent.clientY - dragDataRef.current.startY)

      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setIsDragging(true)
        setHasMoved(true)
        clearTimeout(dragTimer)
      }
    }

    document.addEventListener('mousemove', checkDragStart)
    document.addEventListener('mouseup', cleanup)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const touch = e.touches[0]
    dragDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: touch.clientX - position.x,
      offsetY: touch.clientY - position.y
    }
    setHasMoved(false)

    // 延迟启动拖拽，避免误触
    const dragTimer = setTimeout(() => {
      setIsDragging(true)
    }, 150)

    // 清理函数
    const cleanup = () => {
      clearTimeout(dragTimer)
      document.removeEventListener('touchmove', checkDragStart)
      document.removeEventListener('touchend', cleanup)
    }

    // 检查是否开始拖拽
    const checkDragStart = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0]
      const deltaX = Math.abs(touch.clientX - dragDataRef.current.startX)
      const deltaY = Math.abs(touch.clientY - dragDataRef.current.startY)

      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setIsDragging(true)
        setHasMoved(true)
        clearTimeout(dragTimer)
      }
    }

    document.addEventListener('touchmove', checkDragStart, { passive: false })
    document.addEventListener('touchend', cleanup)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const newX = Math.max(10, Math.min(window.innerWidth - 58, e.clientX - dragDataRef.current.offsetX))
      const newY = Math.max(10, Math.min(window.innerHeight - 58, e.clientY - dragDataRef.current.offsetY))

      setPosition({ x: newX, y: newY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const touch = e.touches[0]
      const newX = Math.max(10, Math.min(window.innerWidth - 58, touch.clientX - dragDataRef.current.offsetX))
      const newY = Math.max(10, Math.min(window.innerHeight - 58, touch.clientY - dragDataRef.current.offsetY))

      setPosition({ x: newX, y: newY })
    }

    const handleEnd = () => {
      setIsDragging(false)
      // 延迟重置 hasMoved，避免拖拽结束后立即触发点击
      setTimeout(() => setHasMoved(false), 50)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleEnd, { passive: false })
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd, { passive: false })

      // 防止页面滚动
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      // 恢复页面滚动
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)

      // 确保清理时恢复页面滚动
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isDragging])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      setIsOpen(false) // 点击后关闭目录
    }
  }

  // 桌面端显示
  const desktopToc = toc.length > 0 ? (
    <div className={cn("space-y-2 hidden lg:block", className)}>
      <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-4">
        <List className="h-4 w-4" />
        目录
      </div>

      <nav className="space-y-1">
        {toc.map((item, idx) => (
          <button
            key={`${item.id || 'toc'}-${idx}`}
            onClick={() => scrollToHeading(item.id)}
            className={cn(
              "block w-full text-left text-sm transition-colors hover:text-primary",
              "py-1 px-2 rounded-sm",
              activeId === item.id
                ? "text-primary bg-primary/10 font-medium"
                : "text-muted-foreground hover:text-foreground",
              // 根据标题级别设置缩进
              item.level === 1 && "pl-2",
              item.level === 2 && "pl-4",
              item.level === 3 && "pl-6",
              item.level === 4 && "pl-8",
              item.level === 5 && "pl-10",
              item.level === 6 && "pl-12"
            )}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  ) : null

  // 移动端悬浮按钮 - 临时测试：始终显示
  const mobileToc = mounted ? createPortal(
    <>
      {/* 悬浮按钮 */}
      <button
        ref={buttonRef}
        className="fixed z-[9998] w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center lg:hidden transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          // 只有在没有拖拽移动的情况下才触发点击
          if (!hasMoved) {
            setIsOpen(!isOpen)
          }
        }}
      >
        <List className="h-5 w-5" />
      </button>

      {/* 目录弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* 目录内容 */}
          <div className="absolute bottom-20 left-4 right-4 max-h-[60vh] bg-background border rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <List className="h-4 w-4" />
                目录
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="p-2 overflow-y-auto max-h-[50vh]">
              {toc.map((item, idx) => (
                <button
                  key={`${item.id || 'toc'}-${idx}`}
                  onClick={() => scrollToHeading(item.id)}
                  className={cn(
                    "block w-full text-left text-sm transition-colors hover:text-primary",
                    "py-2 px-3 rounded-sm",
                    activeId === item.id
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-muted-foreground hover:text-foreground",
                    // 根据标题级别设置缩进
                    item.level === 1 && "pl-3",
                    item.level === 2 && "pl-6",
                    item.level === 3 && "pl-9",
                    item.level === 4 && "pl-12",
                    item.level === 5 && "pl-15",
                    item.level === 6 && "pl-18"
                  )}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>,
    document.body
  ) : null

  return (
    <>
      {desktopToc}
      {mobileToc}
    </>
  )
}

// 阅读进度条组件
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setProgress(Math.min(100, Math.max(0, scrollPercent)))
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
