"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Archive, MessageSquare, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '文章', href: '/articles', icon: FileText },
    { name: '归档', href: '/archive', icon: Archive },
    { name: '现在', href: '/now', icon: Clock },
    { name: '留言', href: '/guestbook', icon: MessageSquare },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const bottomNavContent = (
    <div
      id="bottom-nav-portal"
      className="fixed bottom-0 left-0 right-0 z-[99999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden"
      style={{
        position: 'fixed',
        bottom: '0px',
        left: '0px',
        right: '0px',
        zIndex: 99999,
        width: '100vw',
        height: '56px',
        backgroundColor: 'var(--background)',
        borderTopColor: 'var(--border)'
      }}
    >
      <nav className="h-full w-full">
        <div className="flex justify-around items-center h-14">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center text-xs transition-colors ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )

  // 使用 Portal 直接渲染到 body
  return createPortal(bottomNavContent, document.body)
}
