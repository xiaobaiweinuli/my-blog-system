import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 需要认证的路径
const protectedPaths = [
  '/dashboard',
  '/admin',
  '/files',
  '/profile',
  '/settings',
  '/api/admin',
  '/api/files',
  '/api/articles/create',
  '/api/articles/edit',
  '/api/articles/delete',
]

// 管理员专用路径
const adminPaths = [
  '/admin',
  '/api/admin',
]

// 协作者及以上权限路径
const collaboratorPaths = [
  '/dashboard',
  '/api/articles/create',
  '/api/articles/edit',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  // 检查是否是管理员路径
  const isAdminPath = adminPaths.some(path =>
    pathname.startsWith(path)
  )

  // 检查是否是协作者路径
  const isCollaboratorPath = collaboratorPaths.some(path =>
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // 获取用户 token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
      // 未认证，重定向到登录页
      const loginUrl = new URL('/auth/signin', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 检查管理员权限
    if (isAdminPath && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // 检查协作者权限
    if (isCollaboratorPath && token.role !== 'admin' && token.role !== 'collaborator') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
