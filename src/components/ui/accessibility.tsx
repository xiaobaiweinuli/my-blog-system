"use client"

import { ReactNode, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

/**
 * 跳过导航链接组件
 * 允许键盘用户跳过导航直接到主要内容
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:border focus:rounded-md"
    >
      跳到主要内容
    </a>
  )
}

/**
 * 可视化隐藏组件
 * 对屏幕阅读器可见，但视觉上隐藏
 */
export function VisuallyHidden({
  children,
  as: Component = "span",
  ...props
}: {
  children: ReactNode
  as?: React.ElementType
  [key: string]: any
}) {
  return (
    <Component
      className="sr-only"
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * 焦点陷阱组件
 * 将键盘焦点限制在组件内部
 */
export function FocusTrap({
  children,
  active = true,
  className,
  ...props
}: {
  children: ReactNode
  active?: boolean
  className?: string
  [key: string]: any
}) {
  const startRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 处理焦点陷阱
  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (!containerRef.current) return

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      // 如果按下 Shift+Tab 并且当前焦点在第一个元素上，则将焦点移到最后一个元素
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
      // 如果按下 Tab 并且当前焦点在最后一个元素上，则将焦点移到第一个元素
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [active])

  return (
    <div
      ref={containerRef}
      className={cn("outline-none", className)}
      tabIndex={-1}
      {...props}
    >
      {active && (
        <div
          ref={startRef}
          tabIndex={0}
          onFocus={() => {
            const focusableElements = containerRef.current?.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement
            lastElement?.focus()
          }}
          className="sr-only"
          aria-hidden="true"
        />
      )}

      {children}

      {active && (
        <div
          ref={endRef}
          tabIndex={0}
          onFocus={() => {
            const focusableElements = containerRef.current?.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements?.[0] as HTMLElement
            firstElement?.focus()
          }}
          className="sr-only"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

/**
 * 无障碍标签组件
 * 为元素提供可访问的标签
 */
export function AccessibleLabel({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="sr-only"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * 无障碍公告组件
 * 向屏幕阅读器用户宣布动态内容变化
 */
export function LiveAnnouncer({
  message,
  politeness = "polite",
}: {
  message: string
  politeness?: "polite" | "assertive"
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * 无障碍对话框组件
 * 确保对话框对屏幕阅读器用户可访问
 */
export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // 处理 ESC 键关闭对话框
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // 当对话框打开时，将焦点移到对话框
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <FocusTrap active={isOpen}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
          className
        )}
        tabIndex={-1}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto">
          <h2 id="dialog-title" className="text-xl font-bold mb-2">
            {title}
          </h2>
          
          {description && (
            <p id="dialog-description" className="text-muted-foreground mb-4">
              {description}
            </p>
          )}
          
          {children}
        </div>
      </div>
    </FocusTrap>
  )
}
