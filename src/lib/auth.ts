import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth.js配置选项
 * 用于处理认证相关功能
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 这里应该实现实际的用户验证逻辑
        // 示例：简单检查用户名和密码
        if (credentials?.username === 'admin' && credentials?.password === 'password') {
          return {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com'
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
};