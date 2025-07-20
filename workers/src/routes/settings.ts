import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse, parseJSON } from '../utils';
import { hasPermission } from '../utils/jwt';
import { getBeijingTimeISOString } from '../utils/time';
import { getLogger } from '../utils/logger';

// 获取所有设置
export async function getAllSettings(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('未认证', 401);
    }
    // 自动返回所有字段
    const result = await env.DB.prepare('SELECT * FROM settings').all();
    const res = createSuccessResponse(result.results);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get all settings error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : '获取设置失败', 500, undefined, corsHeaders(request));
  }
}

// 获取单个设置
export async function getSetting(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  key: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('未认证', 401);
    }
    // 自动返回所有字段
    const row = await env.DB.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first();
    if (!row) {
      throw new ApiError('设置不存在', 404);
    }
    const res = createSuccessResponse(row);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get setting error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : '获取设置失败', 500, undefined, corsHeaders(request));
  }
}

// 新增/修改设置（仅管理员）
export async function putSetting(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  key: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user || context.user.role !== 'admin') {
      throw new ApiError('权限不足', 403);
    }
    const body = await parseJSON(request);
    if (typeof body.value !== 'string') {
      throw new ApiError('value 必须为字符串', 400);
    }
    // 动态收集所有字段，自动适配表结构
    const data: any = { ...body, key, updated_by: context.user.username, updated_at: getBeijingTimeISOString() };
    // 构建动态 SQL
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO settings (${fields.join(', ')}) VALUES (${placeholders})`;
    await env.DB.prepare(sql).bind(...fields.map(f => data[f])).run();
    const row = await env.DB.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first();
    const res = createSuccessResponse(row);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Put setting error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : '保存设置失败', 500, undefined, corsHeaders(request));
  }
}

// 删除设置（仅管理员）
export async function deleteSetting(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  key: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user || context.user.role !== 'admin') {
      throw new ApiError('权限不足', 403);
    }
    const row = await env.DB.prepare('SELECT key FROM settings WHERE key = ?').bind(key).first();
    if (!row) {
      throw new ApiError('设置不存在', 404);
    }
    await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
    const res = createSuccessResponse({ message: '删除成功', key });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Delete setting error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : '删除设置失败', 500, undefined, corsHeaders(request));
  }
}

// 获取公开设置（无需登录）
export async function getPublicSettings(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // 只返回白名单字段
    const whitelist = ['icp', 'site_description', 'site_name'];
    const placeholders = whitelist.map(() => '?').join(',');
    const result = await env.DB.prepare(`SELECT * FROM settings WHERE key IN (${placeholders})`).bind(...whitelist).all();
    const res = createSuccessResponse(result.results);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get public settings error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('获取公开设置失败', 500, undefined, corsHeaders(request));
  }
} 