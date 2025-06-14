// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { Octokit } from "@octokit/rest";

// 确保导入 DefaultSession 和 DefaultJWT。
// 如果这里仍然爆红，请确认您的 next-auth 版本是否为 v4.x，
// 并尝试彻底清理 node_modules 和缓存后重装依赖。
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * 辅助函数：检查用户对指定 GitHub 仓库的权限级别
 * @param username GitHub 用户名
 * @param owner 仓库所有者
 * @param repo 仓库名称
 * @param accessToken 用户的 GitHub OAuth Access Token
 * @returns 用户的角色 ('admin', 'collaborator', 'user')
 */
async function getUserRepoPermission(username: string, owner: string, repo: string, accessToken: string): Promise<string> {
    try {
        const octokit = new Octokit({ auth: accessToken });
        // 获取用户在仓库中的协作权限级别
        const { data } = await octokit.repos.getCollaboratorPermissionLevel({
            owner: owner,
            repo: repo,
            username: username,
        });
        // data.permission 会是 'admin', 'write', 'read', 'none'
        if (data.permission === 'admin') return 'admin';
        if (data.permission === 'write') return 'collaborator';
        return 'user'; // 默认普通用户（只读或无权限）
    } catch (error) {
        console.error("Error checking GitHub permission for user:", username, "on repo:", owner + '/' + repo, error);
        // 如果检查失败，默认给普通用户权限，避免阻塞登录
        return 'user';
    }
}

export const authOptions = {
  // 配置认证提供者
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: { params: { scope: "read:user repo" } }, // Request repo scope
    }),
  ],
  // 用于加密会话令牌的密钥
  secret: process.env.NEXTAUTH_SECRET as string,
  // 在生产环境中强制使用安全 Cookie (HTTPS)
  useSecureCookies: process.env.NODE_ENV === "production",

  // 回调函数用于自定义会话和 JWT
  callbacks: {
    /**
     * JWT 回调：在创建或更新 JWT 时调用。
     * 这里我们将 GitHub OAuth 的 access_token 和用户的角色添加到 JWT 中。
     */
    async jwt({ token, user, account, profile }: { token: JWT, user: any, account: any, profile?: any }) {
      console.log('--- JWT Callback Start ---');
      console.log('Initial token:', JSON.stringify(token, null, 2));
      console.log('User (from login/session):', JSON.stringify(user, null, 2));
      console.log('Account (from login/provider):', JSON.stringify(account, null, 2));
      console.log('Profile (from provider):', JSON.stringify(profile, null, 2));

      // On initial sign-in, account and profile are available
      if (account && profile) {
        console.log('Initial sign-in: Storing accessToken and user details from profile.');
        token.accessToken = account.access_token; // Store the OAuth access token
        // Initialize token.user if it doesn't exist or to ensure it's the correct type
        token.user = token.user || {}; 
        token.user.id = profile.id?.toString(); // Ensure id is string if it comes as number
        token.user.name = profile.name;
        token.user.email = profile.email;
        token.user.image = profile.avatar_url;
        token.user.username = profile.login; // Use profile.login for GitHub username
        token.user.role = 'user'; // Default role, will be updated by permission check
        

        const owner = process.env.GITHUB_BLOG_REPO_OWNER as string;
        const repoName = process.env.GITHUB_BLOG_REPO_NAME as string;

        if (owner && repoName && token.accessToken && token.user.username) {
          try {
            const role = await getUserRepoPermission(token.user.username, owner, repoName, token.accessToken);
            token.user.role = role;
            console.log(`Assigned role '${role}' to user '${token.user.username}' based on GitHub permission.`);
          } catch (e) {
            console.error('Error assigning role during initial login:', e);
            token.user.role = 'user'; // Default to 'user' on error
          }
        } else {
          token.user.role = 'user';
          console.log('Default role: user (missing GITHUB_BLOG_REPO_OWNER/NAME, accessToken, or username for permission check)');
        }
      }
      // For subsequent requests, the token object should already contain accessToken and user details.
      // We just return it. If accessToken is missing here, it means it was never set or was lost.

      console.log('--- JWT Callback End ---');
      console.log('Final token returned from JWT callback:', JSON.stringify(token, null, 2));
      return token;
    },

    /**
     * Session 回调：在每次请求会话时调用。
     * 这里我们将 JWT 中的 accessToken 和 role 传递到 session 对象中，供客户端和服务器端使用。
     */
    async session({ session, token }: { session: any; token: any }) {
      console.log('--- Session Callback Start ---');
      console.log('Token received in Session callback:', JSON.parse(JSON.stringify(token)));
      console.log('Initial session:', JSON.parse(JSON.stringify(session)));

      // 将 accessToken 从 token 传递到 session
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
        console.log('Set session.accessToken:', session.accessToken);
      } else {
        console.log('token.accessToken is MISSING in Session callback. This might indicate a problem.');
      }

      // 将用户数据（包括角色）从 token 传递到 session
      if (token.user) {
        session.user = token.user as any; // 使用 as any 避免类型检查器报错，因为我们已通过 declare module 扩展了类型
        console.log('Set session.user (including role):', session.user);
      } else {
        console.log('token.user is MISSING in Session callback. Session user might be incomplete.');
      }

      console.log('--- Session Callback End ---');
      console.log('Final session returned from Session callback:', JSON.parse(JSON.stringify(session)));
      return session;
    },
  },
};

// 创建 NextAuth 处理程序
const handler = NextAuth(authOptions);

// 导出 GET 和 POST 请求处理程序
export { handler as GET, handler as POST };

// ============================================================================
// NextAuth 类型增强：
// 扩展 NextAuth 的 Session 和 JWT 接口，以包含我们自定义的属性 (accessToken, role)。
// 这对于 TypeScript 的类型检查至关重要，确保在代码中可以安全地访问这些属性。
// ============================================================================
declare module "next-auth" {
  /**
   * Extends the built-in User model from NextAuth.
   * These are the additional properties available on the user object.
   */
  interface User {
    id?: string | number;
    role?: string;
    username?: string;
  }

  /**
   * Extends the built-in Session model from NextAuth.
   * This is the shape of the session object available via useSession() or getSession().
   */
  interface Session {
    accessToken?: string;
    /** The user object, combining NextAuth's default user fields with our custom ones. */
    user?: DefaultSession["user"] & User;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT model from NextAuth.
   * This is the shape of the token object passed between the jwt callback and session callback,
   * and returned by getToken().
   */
  interface JWT { // This augments the JWT type from "next-auth/jwt"
    accessToken?: string;
    /** Contains all user-related information stored in the JWT. */
    user?: {
      id?: string | number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      username?: string;
    };
  }
}
