import { Env, Context, ApiError } from '../types';
import { GitHubService } from '../services/github';
import { DatabaseService } from '../services/database';
import { JWT } from '../utils/jwt';
import { createSuccessResponse, createErrorResponse, safeJsonParse } from '../utils';
import { getLogger } from '../utils/logger';
import { handleApiError } from '../utils/http';

/**
 * NextAuth 兼容性适配器
 * 提供与 NextAuth.js 兼容的 API 端点
 */

/**
 * 获取会话信息 (兼容 NextAuth.js)
 */
export async function getSession(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      return createSuccessResponse(null);
    }

    // 优先从 Authorization header 获取 token
    let token: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    // 如果 header 没有，再从 cookie 获取
    if (!token) {
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies['next-auth.session-token'] || null;
      }
    }

    // 返回 NextAuth 格式的会话数据，并带 token 字段
    const session = {
      user: {
        id: context.user.username,
        name: context.user.name,
        email: context.user.email,
        image: context.user.avatar_url,
        role: context.user.role,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 天后过期
      token,
    };

    return createSuccessResponse(session);
  } catch (error) {
    await logger.error('Get session error', error instanceof Error ? error : new Error(String(error)));
    return createSuccessResponse(null);
  }
}

/**
 * 获取 CSRF Token (兼容 NextAuth.js)
 */
export async function getCsrfToken(
  request: Request,
  env: Env,
  ctx: any
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // 生成 CSRF token
    const csrfToken = crypto.randomUUID();
    // 存储到 KV (短期有效)
    await env.CACHE.put(`csrf_${csrfToken}`, 'valid', { expirationTtl: 3600 }); // 1小时过期
    return createSuccessResponse({ csrfToken });
  } catch (error) {
    await logger.error('Get CSRF token error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('Failed to generate CSRF token', 500);
  }
}

/**
 * 获取提供者信息 (兼容 NextAuth.js)
 */
export async function getProviders(
  request: Request,
  env: Env,
  ctx: any
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const providers = {
      github: {
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        signinUrl: '/api/auth/signin/github',
        callbackUrl: '/api/auth/callback/github',
      },
    };
    return createSuccessResponse(providers);
  } catch (error) {
    await logger.error('Get providers error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('Failed to get providers', 500);
  }
}

/**
 * GitHub 登录页面 (兼容 NextAuth.js)
 */
export async function signInGitHub(
  request: Request,
  env: Env,
  ctx: any
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // 从 KV 获取 client_secret
    const clientSecret = await env.CACHE.get('github:client_secret');
    const githubService = new GitHubService(clientSecret, env.FRONTEND_URL);
    const state = crypto.randomUUID();
    await env.CACHE.put(`oauth_state_${state}`, 'valid', { expirationTtl: 600 });
    const authUrl = githubService.getAuthUrl(state);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl,
      },
    });
  } catch (error) {
    await logger.error('GitHub sign in error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('Failed to initiate GitHub sign in', 500);
  }
}

/**
 * GitHub OAuth 回调 (兼容 NextAuth.js)
 */
export async function callbackGitHub(
  request: Request,
  env: Env,
  ctx: any
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const frontendUrl = env.FRONTEND_URL;
    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`,
        },
      });
    }
    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/auth/error?error=missing_code`,
        },
      });
    }
    if (state) {
      const storedState = await env.CACHE.get(`oauth_state_${state}`);
      if (!storedState) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `${frontendUrl}/auth/error?error=invalid_state`,
          },
        });
      }
      await env.CACHE.delete(`oauth_state_${state}`);
    }
    // 从 KV 获取 client_secret
    const clientSecret = await env.CACHE.get('github:client_secret');
    const githubService = new GitHubService(clientSecret, frontendUrl);
    const dbService = new DatabaseService(env.DB, env.CACHE);
    const jwt = new JWT(env.JWT_SECRET);
    // 管理员邮箱列表从 KV 获取（如有需要）
    let adminEmails: string[] = [];
    const adminEmailsStr = await env.CACHE.get('admin:emails');
    if (adminEmailsStr) {
      try { adminEmails = JSON.parse(adminEmailsStr); } catch {}
    }
    // 执行 GitHub OAuth 认证
    const { user: githubUser, role } = await githubService.authenticateUser(code, adminEmails);
    // 创建或更新用户
    const user = await dbService.upsertUser({
      username: githubUser.login,
      email: githubUser.email,
      name: githubUser.name,
      avatar_url: githubUser.avatar_url,
      bio: githubUser.bio,
      location: githubUser.location,
      website: githubUser.blog,
      role,
    });
    const token = await jwt.generateUserToken(user);
    const sessionCookie = `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
    const callbackUrl = url.searchParams.get('callbackUrl') || '/';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}${callbackUrl}`,
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (error) {
    await logger.error('GitHub callback error', error instanceof Error ? error : new Error(String(error)));
    const frontendUrl = env.FRONTEND_URL;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}/auth/error?error=callback_error`,
      },
    });
  }
}

/**
 * 登出 (兼容 NextAuth.js)
 */
export async function signOut(
  request: Request,
  env: Env,
  ctx: any
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const frontendUrl = env.FRONTEND_URL;
    // 清除会话 cookie
    const clearCookie = 'next-auth.session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    // 如果是 POST 请求，返回 JSON
    if (request.method === 'POST') {
      return new Response(JSON.stringify({ url: `${frontendUrl}/` }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearCookie,
        },
      });
    }
    // 如果是 GET 请求，重定向
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}/`,
        'Set-Cookie': clearCookie,
      },
    });
  } catch (error) {
    await logger.error('Sign out error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('Sign out failed', 500);
  }
}

/**
 * 验证会话 token (从 cookie 中提取)
 */
export async function validateSessionFromCookie(
  request: Request,
  env: Env
): Promise<any> {
  const logger = getLogger(env);
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    const sessionToken = cookies['next-auth.session-token'];
    if (!sessionToken) return null;
    const jwt = new JWT(env.JWT_SECRET);
    const payload = await jwt.verify(sessionToken);
    const dbService = new DatabaseService(env.DB, env.CACHE);
    const user = await dbService.getUserByUsername(payload.username);
    if (!user || !user.is_active) return null;
    return user;
  } catch (error) {
    await logger.error('Validate session from cookie error', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
