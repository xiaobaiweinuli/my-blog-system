"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { LogOut, Settings, User, Shield, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/global-auth-context";

interface UserNavProps {
  showDashboard?: boolean
  mobile?: boolean
}

export function UserNav({ showDashboard = false, mobile = false }: UserNavProps) {
  const { session, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!session?.user) {
    if (showDashboard) return null;
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/auth/signin">
          登录
        </Link>
      </Button>
    )
  }

  const { user } = session
  const initials = user.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || '?'

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs">管理员</Badge>
      case 'collaborator':
        return <Badge variant="secondary" className="text-xs">协作者</Badge>
      default:
        return <Badge variant="outline" className="text-xs">用户</Badge>
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (showDashboard) {
    // 只渲染后台管理入口（用于导航栏或移动端菜单）
    if (user.role === 'admin' || user.role === 'collaborator') {
      return (
        <Link href="/dashboard" className={mobile ? "block px-3 py-3 text-base font-medium rounded-lg hover:bg-accent transition-colors" : "ml-2 text-sm font-medium hover:text-primary transition-colors"}>
          <FileText className="mr-2 h-4 w-4 inline-block align-text-bottom" />
          后台管理
        </Link>
      )
    }
    return null;
  }

  // 默认渲染用户菜单
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="pt-1">
              {getRoleBadge(user.role)}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            个人资料
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            设置
          </Link>
        </DropdownMenuItem>
        
        {(user.role === 'admin' || user.role === 'collaborator') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <FileText className="mr-2 h-4 w-4" />
                系统管理
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
