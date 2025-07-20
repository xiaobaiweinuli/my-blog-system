"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])

  // 点击外部关闭
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, setOpen])

  // ESC键关闭
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, setOpen])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ children, asChild, className, ...props }: PopoverTriggerProps) {
  const { setOpen, triggerRef } = React.useContext(PopoverContext)

  const handleClick = () => {
    setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick,
      className: cn(className, (children.props as any)?.className),
      ...props,
    } as any)
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export function PopoverContent({ 
  children, 
  className, 
  align = 'center', 
  side = 'bottom',
  sideOffset = 4,
  ...props 
}: PopoverContentProps) {
  const { open, triggerRef } = React.useContext(PopoverContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    
    let top = 0
    let left = 0

    // 计算垂直位置
    switch (side) {
      case 'top':
        top = triggerRect.top - contentRect.height - sideOffset
        break
      case 'bottom':
        top = triggerRect.bottom + sideOffset
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        break
    }

    // 计算水平位置
    switch (side) {
      case 'top':
      case 'bottom':
        switch (align) {
          case 'start':
            left = triggerRect.left
            break
          case 'center':
            left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
            break
          case 'end':
            left = triggerRect.right - contentRect.width
            break
        }
        break
      case 'left':
        left = triggerRect.left - contentRect.width - sideOffset
        break
      case 'right':
        left = triggerRect.right + sideOffset
        break
    }

    setPosition({ top, left })
  }, [open, align, side, sideOffset])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
