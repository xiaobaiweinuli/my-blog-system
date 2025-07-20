import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse, parseJSON, generateId, hashString } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { getBeijingTimeISOString } from '../utils/time';
import { containsSensitiveWords, strongSanitizeHtml, validateEmailOptions, requireFields, isValidEmail } from '../utils/safe';
import { checkUserUniqueness, buildUserObject, createAndStoreEmailToken, omitSensitiveFields, listAllUsersFromKV } from '../utils/user';
import { JWT } from '../utils/jwt';
import { withCorsHeaders, handleApiError, parsePaginationParams } from '../utils/http';
import { requireAdmin } from '../utils/auth';
import { buildVerificationEmailOptions } from '../utils/email';
import { EMAIL_TOKEN_TTL, PENDING_CLEANUP_TTL } from '../config/constants';
import { getLogger } from '../utils/logger';

/**
 * 获取用户列表 (仅管理员)
 */
export async function getUsers(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    requireAdmin(context);
    // 分页参数处理
    const { page, limit } = parsePaginationParams(request);
    // 使用工具函数批量获取用户
    const result = await listAllUsersFromKV(env, { page, limit });
    const res = createSuccessResponse({
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

/**
 * 根据用户名获取用户 (仅管理员)
 */
export async function getUserById(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  username: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    requireAdmin(context);
    if (!username) {
      throw new ApiError('用户名不能为空', 400);
    }
    const decodedUsername = decodeURIComponent(username);
    const kvKey = `user:${decodedUsername}`;
    await logger.info('[getUserById] 查询用户', { username, decodedUsername, kvKey });
    // 从KV获取用户信息
    const userData = await env.CACHE.get(kvKey, 'json');
    await logger.info('[getUserById] KV返回', { userData });
    if (!userData) {
      await logger.warn('[getUserById] 用户不存在', { username, kvKey });
      throw new ApiError('用户不存在', 404);
    }
    // 移除密码字段
    const userWithoutPassword = omitSensitiveFields(userData, ['password']);
    await logger.info('[getUserById] 返回用户', { userWithoutPassword });
    const res = createSuccessResponse(userWithoutPassword);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

/**
 * 创建用户 (仅管理员)
 */
export async function createUser(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    requireAdmin(context);

    const { username, email, name, password, role, avatar_url, bio, location, website, subject, html, from: fromParam, verifyUrl, successRedirectUrl, failRedirectUrl, showSupportContact, expireMinutes, supportEmail, brandName, greeting, instruction, footer, buttonText } = await parseJSON(request);
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
    const newUser = buildUserObject({ username, email, name, password: hashedPassword, role: role || 'user', avatar_url, bio, location, website });
    // 生成邮箱验证token并写入
    const token = await createAndStoreEmailToken(env, username, EMAIL_TOKEN_TTL);
    // 邮件参数组装
    const emailOptions = buildVerificationEmailOptions({ subject, html: safeHtml, from: fromParam, verifyUrl, successRedirectUrl, failRedirectUrl, showSupportContact, expireMinutes, supportEmail, brandName, greeting, instruction, footer, buttonText });
    await sendVerificationEmail(email, token, env, emailOptions);
    await env.CACHE.put(`user:${username}`, JSON.stringify(newUser));
    // 新增：注册后写入 pending_cleanup:username，TTL 15分钟
    await env.CACHE.put(`pending_cleanup:${username}`, '1', { expirationTtl: PENDING_CLEANUP_TTL });
    // 返回用户信息（不包含密码）
    const userWithoutPassword = omitSensitiveFields(newUser, ['password']);
    const res = createSuccessResponse(userWithoutPassword);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

/**
 * 更新用户角色 (仅管理员)
 */
export async function updateUserRole(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  username: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    requireAdmin(context);

    if (!username) {
      throw new ApiError('用户名不能为空', 400);
    }
    const decodedUsername = decodeURIComponent(username);
    const { role } = await parseJSON(request);

    if (!role || !['admin', 'collaborator', 'user'].includes(role)) {
      throw new ApiError('无效的角色', 400);
    }

    // 从KV获取用户信息
    const userData = await env.CACHE.get(`user:${decodedUsername}`, 'json');
    
    if (!userData) {
      throw new ApiError('用户不存在', 404);
    }

    // 超级管理员保护：只有超级管理员自己才能改超级管理员
    if (isSuperAdmin(userData, env) && !(context.user && isSuperAdmin(context.user, env))) {
      throw new ApiError('无权操作超级管理员账号', 403);
    }
    // 管理员互斥保护：普通管理员不能操作其他管理员（只能操作自己和普通用户）
    if (
      !(context.user && isSuperAdmin(context.user, env)) &&
      context.user && context.user.role === 'admin' &&
      userData.role === 'admin' &&
      context.user.username !== userData.username
    ) {
      throw new ApiError('管理员不能操作其他管理员', 403);
    }

    // 更新用户角色
    const updatedUser = {
      ...userData,
      role,
      updated_at: getBeijingTimeISOString(),
    };

    await env.CACHE.put(`user:${decodedUsername}`, JSON.stringify(updatedUser));

    // 返回用户信息（不包含密码）
    const userWithoutPassword = omitSensitiveFields(updatedUser, ['password']);
    const res = createSuccessResponse(userWithoutPassword);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

/**
 * 切换用户状态 (仅管理员)
 */
export async function toggleUserStatus(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  username: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    requireAdmin(context);

    if (!username) {
      throw new ApiError('用户名不能为空', 400);
    }
    const decodedUsername = decodeURIComponent(username);
    let { is_active } = await parseJSON(request);
    // 兼容字符串 'true'/'false'
    if (typeof is_active === 'string') {
      if (is_active === 'true') is_active = true;
      else if (is_active === 'false') is_active = false;
    }
    if (typeof is_active !== 'boolean') {
      throw new ApiError('状态值无效', 400);
    }

    // 从KV获取用户信息
    const userData = await env.CACHE.get(`user:${decodedUsername}`, 'json');
    
    if (!userData) {
      throw new ApiError('用户不存在', 404);
    }

    // 超级管理员保护：只有超级管理员自己才能禁用超级管理员
    if (isSuperAdmin(userData, env) && !(context.user && isSuperAdmin(context.user, env))) {
      throw new ApiError('无权操作超级管理员账号', 403);
    }
    // 管理员互斥保护：普通管理员不能操作其他管理员（只能操作自己和普通用户）
    if (
      !(context.user && isSuperAdmin(context.user, env)) &&
      context.user && context.user.role === 'admin' &&
      userData.role === 'admin' &&
      context.user.username !== userData.username
    ) {
      throw new ApiError('管理员不能操作其他管理员', 403);
    }

    // 更新用户状态
    const updatedUser = {
      ...userData,
      is_active,
      updated_at: getBeijingTimeISOString(),
    };

    await env.CACHE.put(`user:${decodedUsername}`, JSON.stringify(updatedUser));

    // 返回用户信息（不包含密码）
    const userWithoutPassword = omitSensitiveFields(updatedUser, ['password']);
    const res = createSuccessResponse(userWithoutPassword);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

/**
 * 删除用户 (仅管理员)
 */
export async function deleteUser(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  username: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    requireAdmin(context);

    if (!username) {
      throw new ApiError('用户名不能为空', 400);
    }
    const decodedUsername = decodeURIComponent(username);
    // 从KV获取用户信息
    const userData = await env.CACHE.get(`user:${decodedUsername}`, 'json');
    
    if (!userData) {
      throw new ApiError('用户不存在', 404);
    }

    // 超级管理员保护：只有超级管理员自己才能删除超级管理员
    if (isSuperAdmin(userData, env) && !(context.user && isSuperAdmin(context.user, env))) {
      throw new ApiError('无权操作超级管理员账号', 403);
    }
    // 管理员互斥保护：普通管理员不能操作其他管理员（只能操作自己和普通用户）
    if (
      !(context.user && isSuperAdmin(context.user, env)) &&
      context.user && context.user.role === 'admin' &&
      userData.role === 'admin' &&
      context.user.username !== userData.username
    ) {
      throw new ApiError('管理员不能操作其他管理员', 403);
    }

    // 不允许普通管理员删除管理员，超级管理员可以删除任何人
    if (userData.role === 'admin' && !(context.user && isSuperAdmin(context.user, env))) {
      throw new ApiError('不能删除管理员用户', 403);
    }

    // 删除用户
    await env.CACHE.delete(`user:${decodedUsername}`);

    const res = createSuccessResponse({ message: '用户删除成功' });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

/**
 * 获取用户统计信息 (仅管理员)
 */
export async function getUserStats(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    requireAdmin(context);
    // 使用工具函数获取所有用户
    const result = await listAllUsersFromKV(env);
    const users = result.items;
    // 统计信息
    const stats = {
      total: result.total,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        collaborator: users.filter(u => u.role === 'collaborator').length,
        user: users.filter(u => u.role === 'user').length,
      },
      recentLogins: users.filter(u => {
        if (!u.last_login_at) return false;
        const lastLogin = new Date(u.last_login_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLogin > weekAgo;
      }).length,
    };
    const res = createSuccessResponse(stats);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

export async function getPublicUserByUsername(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  username: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  const decodedUsername = decodeURIComponent(username);
  const kvKey = `user:${decodedUsername}`;
  const userData = await env.CACHE.get(kvKey, 'json');
  if (!userData || !userData.is_active) {
    const headers = corsHeaders(request);
    return createErrorResponse('用户不存在或未公开', 404, undefined, Object.fromEntries(headers.entries()));
  }
  // 只返回公开字段 + role
  const { username: uname, name, avatar_url, bio, website, role } = userData;
  const res = createSuccessResponse({ username: uname, name, avatar_url, bio, website, role });
  const headers = new Headers(res.headers);
  const cors = corsHeaders(request);
  cors.forEach((v: string, k: string) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

// 获取所有公开用户（is_active=true）
export async function getAllPublicUsers(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    // 使用工具函数获取所有 is_active 用户
    const result = await listAllUsersFromKV(env, {
      filter: (u) => u.is_active,
      omitFields: ['password', 'email', 'is_email_verified', 'created_at', 'updated_at', 'last_login_at', 'is_active'],
    });
    const res = createSuccessResponse(result.items);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return handleApiError(error, corsHeaders, request);
  }
}

// 工具函数：判断是否超级管理员
function isSuperAdmin(user: any, env: Env): boolean {
  const adminEmails = (env.ADMIN_EMAILS || '').split(',').map((e: string) => e.trim());
  return user && adminEmails.includes(user.email);
}

// 发送验证邮件函数（Resend API 版本，适配 Cloudflare Workers）
export async function sendVerificationEmail(
  email: string,
  token: string,
  env: Env,
  options?: {
    subject?: string;
    html?: string;
    from?: string;
    verifyUrl?: string;
    successRedirectUrl?: string;
    failRedirectUrl?: string;
    showSupportContact?: boolean;
    expireMinutes?: number;
    supportEmail?: string;
    brandName?: string;
    greeting?: string;
    instruction?: string;
    footer?: string;
    buttonText?: string;
  }
) {
  const logger = getLogger(env);
  const apiKey = env.RESEND_API_KEY;
  const from = options?.from || env.RESEND_FROM || 'noreply@yourdomain.com';
  const siteUrl = env.SITE_URL || 'https://yourdomain.com';
  const verifyUrl = options?.verifyUrl || `${siteUrl}/api/auth/verify-email?token=${token}`;
  const subject = (typeof options?.subject === 'string' && options.subject.trim())
    ? options.subject.trim()
    : '邮箱验证 - 星霜笔记';
  // 认证链接拼接跳转参数（修正版）
  let verifyLink;
  try {
    const url = new URL(verifyUrl);
    // 如果 verifyUrl 已有 token 参数，先移除
    url.searchParams.delete('token');
    url.searchParams.set('token', token);
    if (options?.successRedirectUrl) url.searchParams.set('successRedirectUrl', options.successRedirectUrl);
    if (options?.failRedirectUrl) url.searchParams.set('failRedirectUrl', options.failRedirectUrl);
    verifyLink = url.toString();
  } catch (e) {
    // verifyUrl 不是标准URL，直接拼接
    verifyLink = verifyUrl;
    if (!verifyLink.includes('?')) {
      verifyLink += `?token=${encodeURIComponent(token)}`;
    } else {
      verifyLink += `&token=${encodeURIComponent(token)}`;
    }
    if (options?.successRedirectUrl) verifyLink += `&successRedirectUrl=${encodeURIComponent(options.successRedirectUrl)}`;
    if (options?.failRedirectUrl) verifyLink += `&failRedirectUrl=${encodeURIComponent(options.failRedirectUrl)}`;
  }
  // 客服信息
  const supportHtml = options?.showSupportContact && options?.supportEmail
    ? `<p>如有疑问请联系 <a href="mailto:${options.supportEmail}">${options.supportEmail}</a></p>`
    : (options?.showSupportContact ? '<p>如有疑问请联系 <a href="mailto:support@yourdomain.com">客服邮箱</a></p>' : '');
  // 有效期提示
  const expireTip = options?.expireMinutes ? `<p>请在${options.expireMinutes}分钟内完成认证。</p>` : '';
  const html = options?.html || `
    <div>
      <p>${options?.greeting || '您好，感谢注册' + (options?.brandName || '星霜笔记') + '！'}</p>
      ${expireTip}
      <p>${options?.instruction || '请点击下方链接完成邮箱验证：'}</p>
      <p><a href="${verifyLink}">${options?.buttonText || verifyLink}</a></p>
      ${supportHtml}
      <p>${options?.footer || '如果不是您本人操作，请忽略此邮件。'}</p>
    </div>
  `;
  // 调试日志
  await logger.info('[sendVerificationEmail] options', { options });
  await logger.info('[sendVerificationEmail] subject', { subject });
  await logger.info('[sendVerificationEmail] from', { from });
  await logger.info('[sendVerificationEmail] verifyUrl', { verifyUrl });
  await logger.info('[sendVerificationEmail] verifyLink', { verifyLink });
  await logger.info('[sendVerificationEmail] html', { html });
  const body = {
    from,
    to: email,
    subject,
    html
  };

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    await logger.error('Resend 邮件发送失败', new Error(errText));
    throw new ApiError('发送验证邮件失败', 500);
  }
}

// 新增邮箱验证接口
export async function verifyEmail(
  request: Request,
  env: Env,
  ctx: any,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '缺少token' }), { status: 400, headers });
    }
    const username = await env.CACHE.get(`email_verify:${token}`);
    if (!username) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '无效或已过期的token' }), { status: 400, headers });
    }
    const userKey = `user:${username}`;
    const userData = await env.CACHE.get(userKey, 'json');
    if (!userData) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '用户不存在' }), { status: 404, headers });
    }
    userData.is_email_verified = true;
    await env.CACHE.put(userKey, JSON.stringify(userData));
    await env.CACHE.delete(`email_verify:${token}`);
    const headers = corsHeaders(request);
    return new Response(JSON.stringify({ success: true, message: '邮箱验证成功' }), { status: 200, headers });
  } catch (error) {
    const headers = corsHeaders(request);
    return new Response(JSON.stringify({ success: false, error: '邮箱验证失败' }), { status: 500, headers });
  }
}

// 新增重发验证邮件接口
export async function resendVerificationEmail(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    const { email, subject, html, from: fromParam, verifyUrl, successRedirectUrl, failRedirectUrl, showSupportContact, expireMinutes, supportEmail, brandName, greeting, instruction, footer, buttonText } = await parseJSON(request);
    // 邮件自定义参数校验
    validateEmailOptions({ subject, html, from: fromParam, verifyUrl });
    // 强XSS过滤
    const safeHtml = html ? strongSanitizeHtml(html) : undefined;
    if (fromParam && (typeof fromParam !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromParam))) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '发件人邮箱格式无效' }), { status: 400, headers });
    }
    if (verifyUrl && (typeof verifyUrl !== 'string' || !/^https?:\/\//.test(verifyUrl) || verifyUrl.length > 300)) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '验证链接无效，必须为 http(s):// 开头且不超过300字符' }), { status: 400, headers });
    }
    if (!email) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '缺少邮箱' }), { status: 400, headers });
    }
    // 查找用户
    let cursor: string | undefined;
    let username = '';
    let userData = null;
    do {
      const list = await env.CACHE.list({ cursor });
      cursor = list.cursor;
      for (const key of list.keys) {
        if (key.name.startsWith('user:')) {
          const u = await env.CACHE.get(key.name, 'json');
          if (u && u.email === email) {
            username = u.username;
            userData = u;
            break;
          }
        }
      }
    } while (cursor && !username);
    if (!username || !userData) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '用户不存在' }), { status: 404, headers });
    }
    if (userData.is_email_verified) {
      const headers = corsHeaders(request);
      return new Response(JSON.stringify({ success: false, error: '邮箱已验证，无需重复发送' }), { status: 400, headers });
    }
    // 生成新token并发邮件
    const token = uuidv4();
    await env.CACHE.put(`email_verify:${token}`, username, { expirationTtl: 3600 });
    await sendVerificationEmail(email, token, env, {
      subject,
      html: safeHtml,
      from: fromParam,
      verifyUrl,
      successRedirectUrl,
      failRedirectUrl,
      showSupportContact,
      expireMinutes,
      supportEmail,
      brandName,
      greeting,
      instruction,
      footer,
      buttonText
    });
    const headers = corsHeaders(request);
    return new Response(JSON.stringify({ success: true, message: '验证邮件已发送' }), { status: 200, headers });
  } catch (error) {
    const headers = corsHeaders(request);
    return new Response(JSON.stringify({ success: false, error: '重发验证邮件失败' }), { status: 500, headers });
  }
}

