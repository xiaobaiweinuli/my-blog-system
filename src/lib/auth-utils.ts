import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { redirect } from "next/navigation"
import type { User } from "@/types"

// 将session user转换为完整的User类型
function sessionUserToUser(sessionUser: any): User {
  const now = new Date()
  return {
    id: sessionUser.id,
    name: sessionUser.name || '',
    email: sessionUser.email || '',
    avatar: sessionUser.image,
    role: sessionUser.role || 'user',
    createdAt: now, // 对于session用户，使用当前时间作为默认值
    updatedAt: now,
  }
}

// 获取当前用户会话
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  //console.log('[auth-utils] getCurrentUser session:', session)
  const user = session?.user ? sessionUserToUser(session.user) : null
  //console.log('[auth-utils] getCurrentUser user:', user)
  return user
}

// 获取当前用户的认证令牌
export async function getAuthToken(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.token || null
}

// 获取 refreshToken
export async function getRefreshToken(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return null
  return (session.user as typeof session.user & { refreshToken?: string })?.refreshToken || null
}

// 检查用户是否已认证
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  //console.log('[auth-utils] requireAuth user:', user)
  if (!user) {
    console.warn('[auth-utils] requireAuth: 未认证，重定向到登录页')
    redirect('/auth/signin')
  }
  return user
}

// 检查用户是否为管理员
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }
  return user
}

// 检查用户是否为管理员或协作者
export async function requireCollaborator(): Promise<User> {
  const user = await requireAuth()
  //console.log('[auth-utils] requireCollaborator user:', user)
  if (user.role !== 'admin' && user.role !== 'collaborator') {
    console.warn('[auth-utils] requireCollaborator: 权限不足，重定向到未授权页，当前角色:', user.role)
    redirect('/unauthorized')
  }
  return user
}

// 检查用户权限
export function hasPermission(
  userRole: 'admin' | 'collaborator' | 'user',
  requiredRole: 'admin' | 'collaborator' | 'user'
): boolean {
  const roleHierarchy = {
    admin: 3,
    collaborator: 2,
    user: 1,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// 客户端权限检查 Hook
export function usePermissions() {
  // 这个函数将在客户端组件中使用
  return {
    hasPermission,
  }
}

// 登录回调自动保存 token
export function saveTokenFromResponse(response: any) {
  if (response && response.token) {
    localStorage.setItem('token', response.token)
  }
}
