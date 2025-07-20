'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderOpen,
  Tag,
  Image,
  Settings,
  BarChart3,
  MessageSquare,
  Link as LinkIcon,
  Globe,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'

interface AdminSidebarProps {
  className?: string
  collapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
  onCollapse?: () => void // 新增
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
}

export function AdminSidebar({ className, collapsed: externalCollapsed, setCollapsed, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  const handleToggle = () => {
    if (onCollapse) {
      onCollapse(); // 移动端：直接关闭侧边栏
    } else if (setCollapsed) {
      setCollapsed(!collapsed)
    } else {
      setInternalCollapsed(!collapsed)
    }
  }
  

  const navItems: NavItem[] = [
    {
      title: '仪表板',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: '内容管理',
      href: '/dashboard/content',
      icon: FileText,
      children: [
        {
          title: '文章',
          href: '/dashboard/articles',
          icon: FileText,
        },
        {
          title: '页面',
          href: '/dashboard/pages',
          icon: Globe,
        },
        {
          title: '分类',
          href: '/dashboard/categories',
          icon: FolderOpen,
        },
        {
          title: '标签',
          href: '/dashboard/tags',
          icon: Tag,
        },
      ],
    },
    {
      title: '媒体',
      href: '/dashboard/files',
      icon: Image,
    },
    {
      title: '用户',
      href: '/dashboard/users',
      icon: Users,
    },
    {
      title: '评论',
      href: '/dashboard/giscus',
      icon: MessageSquare,
    },
    {
      title: '友链',
      href: '/dashboard/links',
      icon: MessageSquare,
    },
    {
      title: '分析',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      title: '设置',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r transition-all duration-200',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className={cn('flex items-center justify-between p-4 border-b', collapsed && 'justify-center p-2')}> 
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="font-semibold">管理后台</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn('ml-auto', collapsed && 'ml-0')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className={cn('flex-1', collapsed ? 'px-1 py-2' : 'px-3 py-4')}>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn('p-4 border-t', collapsed && 'p-2')}> 
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p>版本 1.0.0</p>
            <p>最后更新: {new Date().toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NavItemComponent({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem
  isActive: (href: string) => boolean
  collapsed: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div>
        <Button
          variant="ghost"
          className={cn(
            collapsed ? 'w-full justify-center h-10' : 'w-full justify-start gap-2 h-9',
            isActive(item.href) && 'bg-accent text-accent-foreground'
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  expanded && 'rotate-90'
                )}
              />
            </>
          )}
        </Button>
        {expanded && !collapsed && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children?.map((child) => (
              <Link key={child.href} href={child.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start gap-2 h-8',
                    isActive(child.href) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <child.icon className="h-3 w-3" />
                  <span>{child.title}</span>
                  {child.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {child.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link href={item.href}>
      <Button
        variant="ghost"
        className={cn(
          collapsed ? 'w-full justify-center h-10' : 'w-full justify-start gap-2 h-9',
          isActive(item.href) && 'bg-accent text-accent-foreground'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    </Link>
  )
}

/**
 * 移动端侧边栏
 */
export function MobileAdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-72 bg-background border-r">
            <AdminSidebar onCollapse={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
