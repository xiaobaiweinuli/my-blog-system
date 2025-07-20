'use client'

import { cn } from '@/lib/utils'
import { generateId } from '@/lib/utils'

interface SkipLink {
  href: string
  label: string
}

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  // 使用静态文本替代useTranslations，避免NextIntl依赖
  const defaultLinks: SkipLink[] = [
    { href: '#main-content', label: '跳转到主要内容' },
    { href: '#navigation', label: '跳转到导航' },
    { href: '#footer', label: '跳转到页脚' },
  ]

  const skipLinks = links || defaultLinks

  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      <div className="fixed top-0 left-0 z-50 bg-background border border-border p-2 m-2 rounded-md shadow-lg">
        <nav aria-label="跳转链接">
          <ul className="flex flex-col gap-1">
            {skipLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="inline-block px-3 py-2 text-sm font-medium text-foreground bg-primary text-primary-foreground rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => {
                    e.preventDefault()
                    const target = document.querySelector(link.href)
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth' })
                      // 设置焦点到目标元素
                      if (target instanceof HTMLElement) {
                        target.focus()
                      }
                    }
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

/**
 * 焦点管理 Hook
 */
export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const focusFirstInteractive = (container?: HTMLElement) => {
    const root = container || document
    const focusableElements = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) {
      firstElement.focus()
    }
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }

  return {
    focusElement,
    focusFirstInteractive,
    trapFocus,
  }
}

/**
 * 键盘导航 Hook
 */
export function useKeyboardNavigation() {
  const handleArrowNavigation = (
    e: KeyboardEvent,
    items: NodeListOf<HTMLElement> | HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        onIndexChange(nextIndex)
        items[nextIndex]?.focus()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        onIndexChange(prevIndex)
        items[prevIndex]?.focus()
        break
      case 'Home':
        e.preventDefault()
        onIndexChange(0)
        items[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        const lastIndex = items.length - 1
        onIndexChange(lastIndex)
        items[lastIndex]?.focus()
        break
    }
  }

  const handleEscapeKey = (e: KeyboardEvent, onEscape: () => void) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onEscape()
    }
  }

  return {
    handleArrowNavigation,
    handleEscapeKey,
  }
}

/**
 * 屏幕阅读器公告组件
 */
export function ScreenReaderAnnouncement({
  message,
  priority = 'polite',
}: {
  message: string
  priority?: 'polite' | 'assertive'
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * 可访问的按钮组件
 */
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
  [key: string]: any
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * 可访问的链接组件
 */
export function AccessibleLink({
  href,
  children,
  external = false,
  ariaLabel,
  className,
  ...props
}: {
  href: string
  children: React.ReactNode
  external?: boolean
  ariaLabel?: string
  className?: string
  [key: string]: any
}) {
  const externalProps = external
    ? {
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': ariaLabel || `${children} (在新窗口中打开)`,
      }
    : {}

  return (
    <a
      href={href}
      className={cn(
        'text-primary underline-offset-4 hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...externalProps}
      {...props}
    >
      {children}
      {external && (
        <span className="sr-only"> (在新窗口中打开)</span>
      )}
    </a>
  )
}

/**
 * 可访问的表单字段组件
 */
export function AccessibleFormField({
  label,
  children,
  error,
  description,
  required = false,
  className,
}: {
  label: string
  children: React.ReactNode
  error?: string
  description?: string
  required?: boolean
  className?: string
}) {
  const fieldId = `field-${generateId()}`
  const errorId = error ? `${fieldId}-error` : undefined
  const descriptionId = description ? `${fieldId}-description` : undefined

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1" aria-label="必填">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        } as any)}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// 导入 React
import React from 'react'
