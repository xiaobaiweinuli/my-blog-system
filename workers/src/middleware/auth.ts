import { Env, Context, User, ApiError } from '../types';
import { JWT, extractTokenFromHeader, hasPermission } from '../utils/jwt';
import { DatabaseService } from '../services/database';
import { getLogger } from '../utils/logger';
import { createErrorResponse } from '../utils';

/**
 * 认证中间件
 */
export async function authMiddleware(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Context> {
  // 首先尝试从 Authorization header 获取 token
  const token = extractTokenFromHeader(request);

  if (token) {
    try {
      const jwt = new JWT(env.JWT_SECRET);
      const payload = await jwt.verify(token);
      // 优先用username查KV
      let user = null;
      if (payload.username) {
        const userData = await env.CACHE.get(`user:${payload.username}`, 'json');
        if (userData && userData.is_active) {
          user = userData;
        }
      }
      // 兼容老逻辑：如有userId且上面没查到再查一次
      if (!user && payload.userId) {
        const userData = await env.CACHE.get(`user:${payload.userId}`, 'json');
        if (userData && userData.is_active) {
          user = userData;
        }
      }
      if (user) {
        return {
          ...context,
          user,
        };
      }
    } catch (error) {
      console.error('JWT auth error:', error);
    }
  }

  // 如果 JWT 认证失败，尝试从 cookie 获取会话
  try {
    const { validateSessionFromCookie } = await import('../routes/nextauth-compat');
    const user = await validateSessionFromCookie(request, env);

    if (user) {
      return {
        ...context,
        user,
      };
    }
  } catch (error) {
    console.error('Cookie auth error:', error);
  }

  return context; // 不抛出错误，让路由处理器决定是否需要认证
}

/**
 * 要求认证的中间件
 */
export function requireAuth(
  handler: (request: Request, env: Env, ctx: any, context: Context) => Promise<Response>
) {
  return async (
    request: Request,
    env: Env,
    ctx: any,
    context: Context
  ): Promise<Response> => {
    if (!context.user) {
      return createErrorResponse('Authentication required', 401, undefined, context?.extraHeaders);
    }
    
    return handler(request, env, ctx, context);
  };
}

/**
 * 要求特定角色的中间件
 */
export function requireRole(
  role: 'admin' | 'collaborator' | 'user',
  handler: (request: Request, env: Env, ctx: any, context: Context) => Promise<Response>
) {
  return async (
    request: Request,
    env: Env,
    ctx: any,
    context: Context
  ): Promise<Response> => {
    if (!context.user) {
      return createErrorResponse('Authentication required', 401, undefined, context?.extraHeaders);
    }
    
    if (!hasPermission(context.user.role, role)) {
      return createErrorResponse('Insufficient permissions', 403, undefined, context?.extraHeaders);
    }
    
    return handler(request, env, ctx, context);
  };
}

/**
 * 速率限制中间件
 */
export async function rateLimitMiddleware(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  options: {
    windowMs: number; // 时间窗口（毫秒）
    maxRequests: number; // 最大请求数
    keyGenerator?: (request: Request, context: Context) => string;
  }
): Promise<Context> {
  const { windowMs, maxRequests, keyGenerator } = options;
  
  // 生成限制键
  const key = keyGenerator 
    ? keyGenerator(request, context)
    : `rate_limit_${request.headers.get('CF-Connecting-IP') || 'unknown'}`;
  
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const rateLimitKey = `${key}_${windowStart}`;
  
  // 获取当前计数
  const currentCount = await env.CACHE.get(rateLimitKey);
  const count = currentCount ? parseInt(currentCount) : 0;
  
  if (count >= maxRequests) {
    throw new ApiError('Rate limit exceeded', 429);
  }
  
  // 增加计数
  await env.CACHE.put(rateLimitKey, (count + 1).toString(), {
    expirationTtl: Math.ceil(windowMs / 1000),
  });
  
  return context;
}

/**
 * CORS 中间件
 */
export function corsMiddleware(allowedOrigins: string[] = ['*']) {
  return (request: Request): Headers => {
    const headers = new Headers();
    // 无条件强制加上
    headers.set('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');
    return headers;
  };
}

/**
 * 日志中间件
 */
export async function loggingMiddleware(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Context> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logger = getLogger(env);
  
  // 记录请求信息
  await logger.info(`[${requestId}] ${request.method} ${request.url} - Start`);
  
  // 在响应完成后记录
  ctx.waitUntil(
    (async () => {
      const duration = Date.now() - startTime;
      await logger.info(`[${requestId}] ${request.method} ${request.url} - ${duration}ms`);
    })()
  );
  
  return {
    ...context,
    requestId,
  };
}
