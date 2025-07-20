"use client";

import { useAuth } from "@/components/providers/global-auth-context";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileAdminSidebar } from './admin-sidebar'
import {
  Bell,
  Settings,
  User,
  LogOut,
  ExternalLink,
  Home,
  Search,
  Globe,
} from 'lucide-react'
import { signOut } from "next-auth/react";
import { useEffect, useState } from 'react';
import { getFriendLinks } from '@/lib/data-service';
import { ApiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function AdminHeader() {
  const { session } = useAuth();
  const user = session?.user
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();
  const [fullUser, setFullUser] = useState<any>(null);

  useEffect(() => {
    ApiClient.getCurrentUser().then((res: any) => {
      if (res && res.success && res.data && res.data.user) setFullUser(res.data.user);
    });
  }, []);

  useEffect(() => {
    getFriendLinks({ status: 'pending' })
      .then((links: any[]) => setPendingCount(Array.isArray(links) ? links.length : 0))
      .catch(() => setPendingCount(0));
  }, []);

  const displayUser = fullUser || user;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* 移动端菜单按钮 */}
        <MobileAdminSidebar />



        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 通知 */}
          <Button variant="ghost" size="sm" className="relative" onClick={() => router.push('/dashboard/links')}>
            <Bell className="h-4 w-4" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          </Button>

          {/* 快速访问 */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" target="_blank">
              <Home className="h-4 w-4" />
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>

          {/* 主题切换 */}
          <ThemeToggle />

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayUser?.avatar_url || displayUser?.image || ''} alt={displayUser?.name || displayUser?.username || ''} />
                  <AvatarFallback>
                    {displayUser?.name?.charAt(0)?.toUpperCase() || displayUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayUser?.name || '未知用户'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayUser?.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {displayUser?.role === 'admin' ? '管理员' : '协作者'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>个人资料</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>设置</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

/**
 * 管理员页面面包屑导航
 */
export function AdminBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>
}) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
