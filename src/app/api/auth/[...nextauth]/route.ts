// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// All type extensions are handled in src/types/index.ts

export const authOptions: AuthOptions = {
  // 配置认证提供者
  providers: [
    CredentialsProvider({
      name: "Worker",
      credentials: {
        user: { label: "User", type: "text" },
        github_access_token: { label: "GitHub Access Token", type: "text" },
        worker_session_token: { label: "Worker Session Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.user) {
          const user = JSON.parse(credentials.user);
          // Attach tokens to the user object to be passed to the jwt callback
          user.github_access_token = credentials.github_access_token;
          user.worker_session_token = credentials.worker_session_token;
          return user;
        }
        return null;
      },
    }),
  ],
  // 用于加密会话令牌的密钥
  secret: process.env.NEXTAUTH_SECRET as string,
  // 在生产环境中强制使用安全 Cookie (HTTPS)
  useSecureCookies: process.env.NODE_ENV === "production",

  // 回调函数用于自定义会话和 JWT
  callbacks: {
    async jwt({ token, user }) {
      // The `user` object is the one returned from the `authorize` callback
      if (user) {
        const userData = user as any;
        token.github_access_token = userData.github_access_token;
        token.worker_session_token = userData.worker_session_token;
        token.user = {
            id: userData.id?.toString(),
            name: userData.name,
            email: userData.email,
            image: userData.avatar_url, // from worker
            username: userData.login,    // from worker
            role: userData.role,         // from worker
        };
      }
      return token;
    },

    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
      }
      // 不注入 github_access_token 到 session，保证前端不可见
      return session;
    },
  },
};

// 创建 NextAuth 处理程序
const handler = NextAuth(authOptions);

// 导出 GET 和 POST 请求处理程序
export { handler as GET, handler as POST };

// JWT type extension is handled in src/types/index.ts
