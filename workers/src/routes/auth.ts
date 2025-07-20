import { Env, Context, ApiError } from '../types';
import { DatabaseService } from '../services/database';
import { JWT } from '../utils/jwt';
import { createSuccessResponse, createErrorResponse, parseJSON, safeJsonParse } from '../utils';
import { hashString } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from './users';
import { getBeijingTimeISOString } from '../utils/time';
import { verifyEmail } from './users';
import { containsSensitiveWords, strongSanitizeHtml, validateEmailOptions, requireFields, isValidEmail } from '../utils/safe';
import { checkUserUniqueness, buildUserObject, createAndStoreEmailToken } from '../utils/user';
import { withCorsHeaders, handleApiError } from '../utils/http';
import { omitSensitiveFields } from '../utils/user';
import { buildVerificationEmailOptions } from '../utils/email';
import { EMAIL_TOKEN_TTL, PENDING_CLEANUP_TTL } from '../config/constants';
import { getLogger } from '../utils/logger';

/**
 * 用户登录
 */
export async function login(
  request: Request,
  env: Env,
  _ctx: any,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info(`[login] 进入`, { request });
    const { username, password } = await parseJSON(request);
    await logger.info('[LOGIN] 请求体', { username, password });
    
    if (!username || !password) {
      throw new ApiError('用户名和密码不能为空', 400);
    }

    // 用 CACHE KV
    const userKey = `user:${username}`;
    const userData = await env.CACHE.get(userKey, 'json');
    await logger.info('[login] KV查到的userData', { userData });
    
    if (!userData) {
      await logger.info('[login] userData不存在，用户名错误或账号已被清理');
      throw new ApiError('用户名或密码错误，或账号已被清理', 401);
    }

    // 明文密码直接比对
    // 修正：只允许明文密码登录，不允许用 hash 作为密码登录
    if (!password || password.length < 6 || password.length > 64) {
      throw new ApiError('密码格式错误', 400);
    }
    const hashedInput = await hashString(password);
    if (userData.password !== hashedInput) {
      await logger.info('[login] 密码不匹配', { userDataPassword: userData.password, hashedInput });
      throw new ApiError('用户名或密码错误', 401);
    }

    // 检查用户状态
    if (userData.is_active === false) {
      throw new ApiError('账户已被禁用', 403);
    }
    // 新增：邮箱未验证禁止登录
    if (userData.is_email_verified === false) {
      throw new ApiError('用户未验证邮箱', 403);
    }

    // 生成JWT
    const jwt = new JWT(env.JWT_SECRET);
    const token = await jwt.generateUserToken({
      id: userData.id || '',
      username: userData.username,
      email: userData.email || '',
      role: userData.role,
    });
    // 新增：生成 refreshToken
    const refreshToken = await jwt.signRefreshToken({
      username: userData.username,
      email: userData.email || '',
      role: userData.role,
      userId: userData.id || '',
    });
    await logger.info('[login] 生成/返回的token', { token, refreshToken });

    // 可选：更新登录时间
    await env.CACHE.put(userKey, JSON.stringify({
      ...userData,
      last_login_at: getBeijingTimeISOString(),
    }));
    await logger.info('[login] 登录成功，返回token');

    const res = createSuccessResponse({
      user: {
        username: userData.username,
        role: userData.role,
      },
      token,
      refreshToken // 新增
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Login error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : '登录失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(
  request: Request,
  env: Env,
  _ctx: any,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info(`[verifyToken] 进入`, { request });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authorization header is required', 401);
    }
    
    const token = authHeader.slice(7);
    await logger.info('[verifyToken] Authorization header', { authHeader });
    await logger.info('[verifyToken] 校验前token', { token });
    const jwt = new JWT(env.JWT_SECRET);
    const payload = await jwt.verify(token);
    await logger.info('[verifyToken] 校验payload', { payload });
    
    // 用 CACHE KV
    const userKey = `user:${payload.username}`;
    const userData = await env.CACHE.get(userKey, 'json');
    await logger.info('[verifyToken] KV查到的userData', { userData });
    
    if (!userData || userData.is_active === false) {
      throw new ApiError('User not found or inactive', 401);
    }
    
    const res = createSuccessResponse({
      user: {
        username: userData.username,
        role: userData.role,
      },
      payload,
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Token verification error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Token verification failed', 401, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 刷新 Token
 */
export async function refreshToken(
  request: Request,
  env: Env,
  _ctx: any,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info(`[refreshToken] 进入`, { request });
    const { refreshToken: oldToken } = await parseJSON(request);
    
    if (!oldToken) {
      throw new ApiError('Refresh token is required', 400);
    }
    
    const jwt = new JWT(env.JWT_SECRET);
    const payload = await jwt.verify(oldToken);
    
    // 从KV获取用户信息
    const userKey = `user:${payload.username}`;
    const userData = await env.CACHE.get(userKey, 'json');
    
    if (!userData || !userData.is_active) {
      throw new ApiError('User not found or inactive', 401);
    }
    
    // 生成新的 Token
    const newToken = await jwt.generateUserToken({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    });
    await logger.info('[refreshToken] 生成/返回的token', { newToken });
    
    const res = createSuccessResponse({
      token: newToken,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.avatar_url,
        role: userData.role,
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Token refresh error', error instanceof Error ? error : new Error(String(error)));
    const cors = corsHeaders(request);
    const headers = new Headers();
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return createErrorResponse(error instanceof ApiError ? error : 'Token refresh failed', 401, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 登出
 */
export async function logout(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // 只需返回成功，前端自行清除 token
    const res = createSuccessResponse({ message: '登出成功' });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
    const cors = corsHeaders(request);
    const headers = new Headers();
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return createErrorResponse('登出失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(
  _request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info(`[getCurrentUser] 进入`, { _request });
    if (!context.user) {
      throw new ApiError('未认证', 401);
    }
    // 用 CACHE KV
    const userKey = `user:${context.user.username}`;
    const userData = await env.CACHE.get(userKey, 'json');
    await logger.info('[getCurrentUser] KV查到的userData', { userData });
    if (!userData) {
      throw new ApiError('用户不存在', 404);
    }
    const res = createSuccessResponse({
      user: {
        username: userData.username,
        role: userData.role,
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(_request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get current user error', error instanceof Error ? error : new Error(String(error)));
    const cors = corsHeaders(_request);
    const headers = new Headers();
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return createErrorResponse(error instanceof ApiError ? error : '获取用户信息失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info(`[updateUser] 进入`, { request });
    if (!context.user) {
      throw new ApiError('未认证', 401);
    }

    const { name, email, avatar_url } = await parseJSON(request);
    
    // 从KV获取用户信息
    const userKey = `user:${context.user.username}`;
    const userData = await env.CACHE.get(userKey, 'json');
    await logger.info('[updateUser] KV查到的userData', { userData });
    
    if (!userData) {
      throw new ApiError('用户不存在', 404);
    }

    // 更新用户信息
    const updatedUser = {
      ...userData,
      name: name || userData.name,
      email: email || userData.email,
      avatar_url: avatar_url || userData.avatar_url,
      updated_at: getBeijingTimeISOString(),
    };

    await env.CACHE.put(userKey, JSON.stringify(updatedUser));
    await logger.info('[updateUser] 已写入更新后的用户', { updatedUser });

    const res = createSuccessResponse({
      user: {
        id: updatedUser.username,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar_url: updatedUser.avatar_url,
        role: updatedUser.role,
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Update user error', error instanceof Error ? error : new Error(String(error)));
    const cors = corsHeaders(request);
    const headers = new Headers();
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return createErrorResponse(error instanceof ApiError ? error : '更新用户信息失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

// hCaptcha 校验函数
async function verifyCaptcha(token: string, env: Env): Promise<boolean> {
  const secret = env.HCAPTCHA_SECRET;
  if (!secret) return false;
  const resp = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await resp.json() as { success: boolean };
  return data.success;
}
// 邮箱有效性检测（可选）
async function checkEmailValid(email: string, env: Env): Promise<boolean> {
  const key = env.MAILBOXLAYER_KEY || '';
  if (!key) return true;
  const resp = await fetch(`https://apilayer.net/api/check?access_key=${key}&email=${encodeURIComponent(email)}`);
  const data = await resp.json() as { format_valid: boolean; smtp_check: boolean };
  return data.format_valid && data.smtp_check;
}

/**
 * 用户注册（开放注册接口）
 */
export async function register(
  request: Request,
  env: Env,
  ctx: any,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // 1. 解析参数（只解构一次）
    const {
      username, email, name, password, captchaToken,
      avatar_url, bio, location, website,
      subject, html, from: fromParam, verifyUrl,
      successRedirectUrl, failRedirectUrl, showSupportContact, expireMinutes
    } = await parseJSON(request);

    // 2. 校验验证码
    if (!captchaToken || !(await verifyCaptcha(captchaToken, env))) {
      return createErrorResponse('验证码校验失败', 400);
    }

    // 3. 限流（IP+邮箱）
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
    const ipKey = `register_limit:${ip}`;
    const ipCount = parseInt(await env.CACHE.get(ipKey) || '0', 10);
    if (ipCount >= 5) {
      return createErrorResponse('注册过于频繁，请稍后再试', 429);
    }
    await env.CACHE.put(ipKey, (ipCount + 1).toString(), { expirationTtl: 3600 });

    const emailKey = `register_email_limit:${email}`;
    const emailCount = parseInt(await env.CACHE.get(emailKey) || '0', 10);
    if (emailCount >= 3) {
      return createErrorResponse('该邮箱注册过于频繁', 429);
    }
    await env.CACHE.put(emailKey, (emailCount + 1).toString(), { expirationTtl: 3600 });

    // 4. 邮箱有效性检测（可选）
    if (!(await checkEmailValid(email, env))) {
      return createErrorResponse('邮箱无效或不存在', 400);
    }

    // 5. 原有注册逻辑（参数校验、唯一性校验、加密、发邮件等）
    // 邮件自定义参数校验
    validateEmailOptions({ subject, html, from: fromParam, verifyUrl });
    // 强XSS过滤
    const safeHtml = html ? strongSanitizeHtml(html) : undefined;
    if (fromParam && (typeof fromParam !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromParam))) {
      throw new ApiError('发件人邮箱格式无效', 400);
    }
    if (verifyUrl && (typeof verifyUrl !== 'string' || !/^https?:\/\//.test(verifyUrl) || verifyUrl.length > 300)) {
      throw new ApiError('验证链接无效，必须为 http(s):// 开头且不超过300字符', 400);
    }
    // 参数必填校验
    requireFields({ username, email, name, password }, ['username', 'email', 'name', 'password']);
    if (!isValidEmail(email)) throw new ApiError('邮箱格式无效', 400);
    // 用户唯一性校验
    await checkUserUniqueness(env, { username, email, name });
    // 加密密码
    const hashedPassword = await hashString(password);
    // 构建用户对象
    const newUser = buildUserObject({ username, email, name, password: hashedPassword, role: 'user', avatar_url, bio, location, website });
    // 生成邮箱验证token并写入
    const token = await createAndStoreEmailToken(env, username, EMAIL_TOKEN_TTL);
    // 邮件参数组装
    const emailOptions = buildVerificationEmailOptions({ subject, html: safeHtml, from: fromParam, verifyUrl, successRedirectUrl, failRedirectUrl, showSupportContact, expireMinutes });
    await sendVerificationEmail(email, token, env, emailOptions);
    await env.CACHE.put(`user:${username}`, JSON.stringify(newUser));
    await env.CACHE.put(`pending_cleanup:${username}`, '1', { expirationTtl: PENDING_CLEANUP_TTL });
    // 新增：注册成功自动生成token和refreshToken
    const jwtInstance = new JWT(env.JWT_SECRET);
    const accessToken = await jwtInstance.generateUserToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role as 'user' | 'admin' | 'collaborator',
    });
    const refreshToken = await jwtInstance.signRefreshToken({
      username: newUser.username,
      email: newUser.email,
      role: newUser.role as 'user' | 'admin' | 'collaborator',
      userId: newUser.id,
    });
    // 返回用户信息（不包含密码）
    const userWithoutPassword = omitSensitiveFields(newUser, ['password']);
    const res = createSuccessResponse({
      ...userWithoutPassword,
      token: accessToken,
      refreshToken
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Register error', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error, corsHeaders, request);
  }
}

export { verifyEmail };
