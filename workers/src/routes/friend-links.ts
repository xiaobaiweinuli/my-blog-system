import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse, parseJSON, generateId } from '../utils';
import { hasPermission } from '../utils/jwt';
import { getBeijingTimeISOString } from '../utils/time';
import { getLogger } from '../utils/logger';

/**
 * 获取友情链接列表
 */
export async function getFriendLinks(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const includeAll = url.searchParams.get('includeAll') === 'true';

    let whereClause = '';
    const bindings: any[] = [];

    // 权限检查：非管理员只能查看已通过的链接
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      whereClause = 'WHERE status = ?';
      bindings.push('approved');
    } else if (!includeAll) {
      // 管理员可以查看所有状态，但可以按状态筛选
      const conditions = [];
      if (status) {
        conditions.push('status = ?');
        bindings.push(status);
      }
      if (category) {
        conditions.push('category = ?');
        bindings.push(category);
      }
      if (featured !== null) {
        conditions.push('is_featured = ?');
        bindings.push(featured === 'true');
      }
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    const query = `
      SELECT * FROM friend_links 
      ${whereClause}
      ORDER BY is_featured DESC, order_index ASC, name ASC
    `;

    const result = await env.DB.prepare(query).bind(...bindings).all();
    
    const links = result.results.map((row: any) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      description: row.description,
      avatar: row.avatar,
      category: row.category,
      status: row.status,
      order_index: Number(row.order_index),
      is_featured: Boolean(row.is_featured),
      contact_email: row.contact_email,
      created_at: row.created_at,
      updated_at: row.updated_at,
      approved_at: row.approved_at,
      created_by: row.created_by,
      approved_by: row.approved_by,
    }));

    const res = createSuccessResponse(links);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get friend links error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get friend links', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 创建友情链接
 */
export async function createFriendLink(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const {
      name,
      url,
      description,
      avatar,
      category = 'friend',
      contact_email,
      order_index = 0,
      is_featured = false,
      status: reqStatus, // 允许前端传 status，但后端严格校验
    } = await parseJSON(request);

    if (!name || !url) {
      throw new ApiError('Name and URL are required', 400);
    }

    // URL 格式验证
    try {
      new URL(url);
    } catch {
      throw new ApiError('Invalid URL format', 400);
    }

    const linkId = generateId();
    const now = getBeijingTimeISOString();
    
    // 只允许协作者及以上设置 is_featured
    const canSetFeatured = context.user && hasPermission(context.user.role, 'collaborator');
    const finalIsFeatured = canSetFeatured ? is_featured : false;

    // 只有管理员才能设置 status 为 approved，否则一律 pending
    const isAdmin = context.user && hasPermission(context.user.role, 'admin');
    const finalStatus = isAdmin && reqStatus === 'approved' ? 'approved' : 'pending';
    const approved_at = finalStatus === 'approved' ? now : null;
    const approved_by = finalStatus === 'approved' && context.user ? context.user.username : null;

    await env.DB.prepare(`
      INSERT INTO friend_links (
        id, name, url, description, avatar, category, status, order_index, 
        is_featured, contact_email, created_at, updated_at, approved_at, 
        created_by, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      linkId,
      name,
      url,
      description || null,
      avatar || null,
      category,
      finalStatus,
      order_index,
      finalIsFeatured,
      contact_email || null,
      now,
      now,
      approved_at,
      context.user?.username || null,
      approved_by
    ).run();

    const link = await env.DB.prepare('SELECT * FROM friend_links WHERE id = ?').bind(linkId).first();

    const res = createSuccessResponse({
      id: link.id,
      name: link.name,
      url: link.url,
      description: link.description,
      avatar: link.avatar,
      category: link.category,
      status: link.status,
      order_index: Number(link.order_index),
      is_featured: Boolean(link.is_featured),
      contact_email: link.contact_email,
      created_at: link.created_at,
      updated_at: link.updated_at,
      approved_at: link.approved_at,
      created_by: link.created_by,
      approved_by: link.approved_by,
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Create friend link error', error instanceof Error ? error : new Error(String(error)));
    const res = createErrorResponse(error instanceof ApiError ? error : 'Failed to create friend link', 500);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  }
}

/**
 * 更新友情链接
 */
export async function updateFriendLink(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  linkId: string,
  corsHeaders?: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const updateData = await parseJSON(request);
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new ApiError('Request body is empty', 400);
    }

    // 检查链接是否存在
    const existing = await env.DB.prepare('SELECT * FROM friend_links WHERE id = ?').bind(linkId).first();
    if (!existing) {
      throw new ApiError('Friend link not found', 404);
    }

    // URL 格式验证
    if (updateData.url) {
      try {
        new URL(updateData.url);
      } catch {
        throw new ApiError('Invalid URL format', 400);
      }
    }

    const updates: any = {
      updated_at: getBeijingTimeISOString(),
    };

    // 更新字段
    const allowedFields = [
      'name', 'url', 'description', 'avatar', 'category', 
      'order_index', 'is_featured', 'contact_email'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // 状态更新需要管理员权限
    if (updateData.status && hasPermission(context.user.role, 'admin')) {
      updates.status = updateData.status;
      if (updateData.status === 'approved' && existing.status !== 'approved') {
        updates.approved_at = getBeijingTimeISOString();
        updates.approved_by = context.user.username;
      }
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await env.DB.prepare(`UPDATE friend_links SET ${setClause} WHERE id = ?`)
      .bind(...values, linkId)
      .run();

    const link = await env.DB.prepare('SELECT * FROM friend_links WHERE id = ?').bind(linkId).first();

    const res = createSuccessResponse({
      id: link.id,
      name: link.name,
      url: link.url,
      description: link.description,
      avatar: link.avatar,
      category: link.category,
      status: link.status,
      order_index: Number(link.order_index),
      is_featured: Boolean(link.is_featured),
      contact_email: link.contact_email,
      created_at: link.created_at,
      updated_at: link.updated_at,
      approved_at: link.approved_at,
      created_by: link.created_by,
      approved_by: link.approved_by,
    });
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  } catch (error) {
    await logger.error('Update friend link error', error instanceof Error ? error : new Error(String(error)));
    const res = createErrorResponse(error instanceof ApiError ? error : 'Failed to update friend link', 500);
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  }
}

/**
 * 删除友情链接
 */
export async function deleteFriendLink(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  linkId: string,
  corsHeaders?: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // 检查链接是否存在
    const link = await env.DB.prepare('SELECT * FROM friend_links WHERE id = ?').bind(linkId).first();
    if (!link) {
      throw new ApiError('Friend link not found', 404);
    }

    // 删除链接
    await env.DB.prepare('DELETE FROM friend_links WHERE id = ?').bind(linkId).run();

    const res = createSuccessResponse({ message: 'Friend link deleted successfully' });
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  } catch (error) {
    await logger.error('Delete friend link error', error instanceof Error ? error : new Error(String(error)));
    const res = createErrorResponse(error instanceof ApiError ? error : 'Failed to delete friend link', 500);
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  }
}

/**
 * 批量更新友情链接状态
 */
export async function updateFriendLinksStatus(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders?: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const { linkIds, status } = await parseJSON(request);

    // 日志：打印 linkIds 和 status
    console.log('批量更新友链状态，linkIds:', linkIds, 'status:', status);

    if (!Array.isArray(linkIds) || !status) {
      throw new ApiError('Link IDs array and status are required', 400);
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new ApiError('Invalid status', 400);
    }

    // 校验所有 linkIds 是否存在
    const notFoundIds = [];
    for (const linkId of linkIds) {
      const link = await env.DB.prepare('SELECT id FROM friend_links WHERE id = ?').bind(linkId).first();
      // 日志：打印每个 linkId 查找结果
      console.log('查找 linkId:', linkId, '查找结果:', link);
      if (!link) notFoundIds.push(linkId);
    }
    if (notFoundIds.length > 0) {
      throw new ApiError('Friend link not found: ' + notFoundIds.join(','), 404);
    }

    const now = getBeijingTimeISOString();
    const approved_at = status === 'approved' ? now : null;
    const approved_by = status === 'approved' ? context.user.username : null;

    // 批量更新状态
    for (const linkId of linkIds) {
      await env.DB.prepare(`
        UPDATE friend_links 
        SET status = ?, updated_at = ?, approved_at = ?, approved_by = ?
        WHERE id = ?
      `).bind(status, now, approved_at, approved_by, linkId).run();
    }

    const res = createSuccessResponse({ 
      message: `Successfully updated ${linkIds.length} friend links`,
      updated_count: linkIds.length 
    });
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  } catch (error) {
    await logger.error('Update friend links status error', error instanceof Error ? error : new Error(String(error)));
    const res = createErrorResponse(error instanceof ApiError ? error : 'Failed to update friend links status', 500);
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  }
}

/**
 * 审批单个友情链接
 */
export async function approveFriendLink(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  linkId: string,
  corsHeaders?: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('需要登录', 401);
    }
    if (!hasPermission(context.user.role, 'admin')) {
      throw new ApiError('没有权限', 403);
    }

    // 检查链接是否存在且为 pending
    const link = await env.DB.prepare('SELECT * FROM friend_links WHERE id = ?').bind(linkId).first();
    if (!link) {
      throw new ApiError('友链不存在', 404);
    }
    if (link.status === 'approved') {
      throw new ApiError('该友链已审批通过', 400);
    }

    const now = getBeijingTimeISOString();
    await env.DB.prepare(`
      UPDATE friend_links
      SET status = 'approved', approved_at = ?, approved_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(now, context.user.username, now, linkId).run();

    const res = createSuccessResponse({ message: '审批通过' });
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  } catch (error) {
    await logger.error('Approve friend link error', error instanceof Error ? error : new Error(String(error)));
    const res = createErrorResponse(error instanceof ApiError ? error : '审批失败', 500);
    if (corsHeaders) {
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  }
}
