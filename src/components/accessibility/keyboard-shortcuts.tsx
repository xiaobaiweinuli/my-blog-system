'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Keyboard, X } from 'lucide-react'

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  category?: string
  disabled?: boolean
}

interface KeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[]
  disabled?: boolean
}

export function KeyboardShortcuts({ shortcuts = [], disabled = false }: KeyboardShortcutsProps) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  // 默认快捷键
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: '搜索',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      category: '导航',
    },
    {
      key: 'h',
      description: '首页',
      action: () => router.push('/'),
      category: '导航',
    },
    {
      key: 'a',
      description: '文章',
      action: () => router.push('/articles'),
      category: '导航',
    },
    {
      key: 'd',
      description: '管理后台',
      action: () => router.push('/dashboard'),
      category: '导航',
    },
    {
      key: '?',
      description: '帮助',
      action: () => setShowHelp(true),
      category: '帮助',
    },
    {
      key: 'Escape',
      description: '关闭',
      action: () => {
        // 关闭模态框或返回上一页
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          const closeButton = modal.querySelector('button[aria-label*="关闭"], button[aria-label*="close"]') as HTMLButtonElement
          if (closeButton) {
            closeButton.click()
          }
        }
      },
      category: '通用',
    },
  ]

  const allShortcuts = [...defaultShortcuts, ...shortcuts]

  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // 只处理 Escape 键
        if (e.key === 'Escape') {
          const shortcut = allShortcuts.find(s => s.key === 'Escape' && !s.disabled)
          if (shortcut) {
            e.preventDefault()
            shortcut.action()
          }
        }
        return
      }

      // 查找匹配的快捷键
      const shortcut = allShortcuts.find(s => {
        if (s.disabled) return false
        
        // 处理修饰键组合
        if (s.key.includes('+')) {
          const keys = s.key.split('+')
          const mainKey = keys[keys.length - 1].toLowerCase()
          const hasCtrl = keys.includes('Ctrl') && e.ctrlKey
          const hasAlt = keys.includes('Alt') && e.altKey
          const hasShift = keys.includes('Shift') && e.shiftKey
          const hasMeta = keys.includes('Meta') && e.metaKey
          
          return e.key.toLowerCase() === mainKey && 
                 (!keys.includes('Ctrl') || hasCtrl) &&
                 (!keys.includes('Alt') || hasAlt) &&
                 (!keys.includes('Shift') || hasShift) &&
                 (!keys.includes('Meta') || hasMeta)
        }
        
        return e.key === s.key
      })

      if (shortcut) {
        e.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [allShortcuts, disabled])

  // 按类别分组快捷键
  const groupedShortcuts = allShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || '通用'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(shortcut)
    return groups
  }, {} as Record<string, KeyboardShortcut[]>)

  return (
    <>
      {/* 快捷键帮助按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 z-40 bg-background/80 backdrop-blur-sm border shadow-lg"
        aria-label="显示帮助"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {/* 快捷键帮助对话框 */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              键盘快捷键
            </DialogTitle>
            <DialogDescription>
              使用键盘快捷键快速导航和操作
            </DialogDescription>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <KeyBadge keys={shortcut.key} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowHelp(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 按键徽章组件
 */
function KeyBadge({ keys }: { keys: string }) {
  const keyArray = keys.split('+').map(key => key.trim())

  return (
    <div className="flex items-center gap-1">
      {keyArray.map((key, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-muted-foreground">+</span>}
          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
            {formatKey(key)}
          </Badge>
        </div>
      ))}
    </div>
  )
}

/**
 * 格式化按键显示
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'Ctrl': '⌃',
    'Alt': '⌥',
    'Shift': '⇧',
    'Meta': '⌘',
    'Cmd': '⌘',
    'Enter': '↵',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Backspace': '⌫',
    'Delete': '⌦',
    'Tab': '⇥',
    'Space': '␣',
  }

  return keyMap[key] || key.toUpperCase()
}

/**
 * 自定义快捷键 Hook
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    disabled?: boolean
    preventDefault?: boolean
    stopPropagation?: boolean
  } = {}
) {
  const { disabled = false, preventDefault = true, stopPropagation = false } = options

  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键（除非是 Escape）
      const target = e.target as HTMLElement
      if (
        key !== 'Escape' &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')
      ) {
        return
      }

      // 检查按键匹配
      let matches = false
      if (key.includes('+')) {
        const keys = key.split('+')
        const mainKey = keys[keys.length - 1].toLowerCase()
        const hasCtrl = keys.includes('Ctrl') && e.ctrlKey
        const hasAlt = keys.includes('Alt') && e.altKey
        const hasShift = keys.includes('Shift') && e.shiftKey
        const hasMeta = keys.includes('Meta') && e.metaKey
        
        matches = e.key.toLowerCase() === mainKey && 
                 (!keys.includes('Ctrl') || hasCtrl) &&
                 (!keys.includes('Alt') || hasAlt) &&
                 (!keys.includes('Shift') || hasShift) &&
                 (!keys.includes('Meta') || hasMeta)
      } else {
        matches = e.key === key
      }

      if (matches) {
        if (preventDefault) e.preventDefault()
        if (stopPropagation) e.stopPropagation()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, disabled, preventDefault, stopPropagation])
}

/**
 * 焦点陷阱 Hook
 */
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return

    const focusableElements = document.querySelectorAll(
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

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive])
}
