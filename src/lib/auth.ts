import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { User } from "@/types"
import type { AdapterUser } from "next-auth/adapters"

// 扩展 NextAuth 类型
declare module "next-auth" {
  interface Session {
    user: User & {
      id: string
      token?: string
      refreshToken?: string
    }
  }
  
  interface User {
    role: 'admin' | 'collaborator' | 'user'
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: 'admin' | 'collaborator' | 'user'
    accessToken?: string
    refreshToken?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // 兼容服务端和客户端环境变量
          const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) throw new Error('API_URL 环境变量未配置');
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || '登录失败');
          }

          const data = await response.json()
          
          if (data.success && data.data && data.data.user) {
            return {
              id: data.data.user.id,
              name: data.data.user.name,
              email: data.data.user.email,
              image: data.data.user.avatar_url,
              role: data.data.user.role,
              accessToken: data.data.token,
              refreshToken: data.data.refreshToken,
            }
          }

          throw new Error(data.error || '登录失败');
        } catch (error) {
          console.error('Authentication error:', error)
          throw error
        }
      }
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = user.role
        if (user.accessToken) {
          token.accessToken = user.accessToken
        }
        if (user.refreshToken) {
          token.refreshToken = user.refreshToken
        }
      }
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub || '') as string
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.role = token.role
        session.user.token = token.accessToken
        session.user.refreshToken = token.refreshToken
      }
      return session
    },
    
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}
