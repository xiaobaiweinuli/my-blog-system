"use client";

import { ReactNode } from 'react'
import { useAuth } from "@/components/providers/global-auth-context";
import { AdminSidebar, MobileAdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { session, status, loading } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 加载状态（修复：只要 loading=true 就渲染加载中）
  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">访问被拒绝</h1>
          <p className="text-muted-foreground mb-6">请先登录</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            登录
          </Button>
        </div>
      </div>
    )
  }

  // 权限检查
  const userRole = session?.user?.role
  const hasAdminAccess = userRole === 'admin' || userRole === 'collaborator'

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">权限不足</h1>
          <p className="text-muted-foreground mb-6">需要管理员权限</p>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 桌面端侧边栏 */}
      <div
        className="hidden md:flex md:flex-col transition-all duration-200"
        style={{ width: sidebarCollapsed ? 40 : 256, minWidth: sidebarCollapsed ? 40 : 256 }}
      >
        <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <AdminHeader />

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {/* 权限提示 */}
            {userRole === 'collaborator' && (
              <Alert className="mb-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  您当前以协作者身份登录，部分功能可能受限。
                </AlertDescription>
              </Alert>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * 管理员页面包装器
 */
export function withAdminLayout<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AdminPageWrapper(props: P) {
    return (
      <AdminLayout>
        <Component {...props} />
      </AdminLayout>
    )
  }
}
