import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse, parseJSON, generateId } from '../utils';
import { hasPermission } from '../utils/jwt';
import { getBeijingTimeISOString } from '../utils/time';
import { getLogger } from '../utils/logger';

/**
 * 获取页面列表
 */
export async function getPages(
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
    const includePrivate = url.searchParams.get('includePrivate') === 'true';

    let whereClause = '';
    const bindings: any[] = [];

    // 权限检查：非管理员只能查看已发布的页面
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      whereClause = 'WHERE status = ?';
      bindings.push('published');
    } else if (status) {
      whereClause = 'WHERE status = ?';
      bindings.push(status);
    } else if (!includePrivate) {
      whereClause = 'WHERE status != ?';
      bindings.push('private');
    }

    const query = `
      SELECT * FROM pages 
      ${whereClause}
      ORDER BY order_index ASC, title ASC
    `;

    const result = await env.DB.prepare(query).bind(...bindings).all();
    
    const pages = result.results.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      status: row.status,
      template: row.template,
      order_index: Number(row.order_index),
      is_in_menu: Boolean(row.is_in_menu),
      menu_title: row.menu_title,
      parent_id: row.parent_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      published_at: row.published_at,
      created_by: row.created_by,
    }));

    const res = createSuccessResponse(pages);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get pages error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get pages', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 根据 slug 获取页面
 */
export async function getPageBySlug(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  slug: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const page = await env.DB.prepare('SELECT * FROM pages WHERE slug = ?').bind(slug).first();
    
    if (!page) {
      throw new ApiError('Page not found', 404);
    }

    // 权限检查：私有页面只有管理员可以查看
    if (page.status === 'private' && (!context.user || !hasPermission(context.user.role, 'collaborator'))) {
      throw new ApiError('Page not found', 404);
    }

    // 草稿页面只有作者和管理员可以查看
    if (page.status === 'draft' && (!context.user || 
        (page.created_by !== context.user.username && !hasPermission(context.user.role, 'admin')))) {
      throw new ApiError('Page not found', 404);
    }

    const res = createSuccessResponse({
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        excerpt: page.excerpt,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        status: page.status,
        template: page.template,
        order_index: Number(page.order_index),
        is_in_menu: Boolean(page.is_in_menu),
        menu_title: page.menu_title,
        parent_id: page.parent_id,
        created_at: page.created_at,
        updated_at: page.updated_at,
        published_at: page.published_at,
        created_by: page.created_by,
      });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get page error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get page', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 创建页面
 */
export async function createPage(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // createPage 权限判断
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const {
      title,
      slug,
      content,
      excerpt,
      meta_title,
      meta_description,
      status = 'draft',
      template = 'default',
      order_index = 0,
      is_in_menu = false,
      menu_title,
      parent_id,
    } = await parseJSON(request);

    if (!title || !slug || !content) {
      throw new ApiError('Title, slug, and content are required', 400);
    }

    // 检查 slug 是否已存在
    const existing = await env.DB.prepare('SELECT id FROM pages WHERE slug = ?').bind(slug).first();
    if (existing) {
      throw new ApiError('Page slug already exists', 400);
    }

    const pageId = generateId();
    const now = getBeijingTimeISOString();

    await env.DB.prepare(`
      INSERT INTO pages (
        id, title, slug, content, excerpt, meta_title, meta_description,
        status, template, order_index, is_in_menu, menu_title, parent_id,
        created_at, updated_at, published_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      pageId,
      title,
      slug,
      content,
      excerpt || null,
      meta_title || null,
      meta_description || null,
      status,
      template,
      order_index,
      is_in_menu,
      menu_title || null,
      parent_id || null,
      now,
      now,
      status === 'published' ? now : null,
      context.user.username
    ).run();

    const page = await env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(pageId).first();

    const res = createSuccessResponse({
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        excerpt: page.excerpt,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        status: page.status,
        template: page.template,
        order_index: Number(page.order_index),
        is_in_menu: Boolean(page.is_in_menu),
        menu_title: page.menu_title,
        parent_id: page.parent_id,
        created_at: page.created_at,
        updated_at: page.updated_at,
        published_at: page.published_at,
        created_by: page.created_by,
      });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Create page error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to create page', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 更新页面
 */
export async function updatePage(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  pageId: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // updatePage 权限判断
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const updateData = await parseJSON(request);

    // 检查页面是否存在
    const existing = await env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(pageId).first();
    if (!existing) {
      throw new ApiError('Page not found', 404);
    }

    // 权限检查：只有作者或管理员可以编辑
    if (existing.created_by !== context.user.username && !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // 如果 slug 改变了，检查新 slug 是否已存在
    if (updateData.slug && updateData.slug !== existing.slug) {
      const slugExists = await env.DB.prepare('SELECT id FROM pages WHERE slug = ? AND id != ?').bind(updateData.slug, pageId).first();
      if (slugExists) {
        throw new ApiError('Page slug already exists', 400);
      }
    }

    const updates: any = {
      updated_at: getBeijingTimeISOString(),
    };

    // 更新字段
    const allowedFields = [
      'title', 'slug', 'content', 'excerpt', 'meta_title', 'meta_description',
      'status', 'template', 'order_index', 'is_in_menu', 'menu_title', 'parent_id'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // 如果状态变为已发布，设置发布时间
    if (updateData.status === 'published' && existing.status !== 'published') {
      updates.published_at = getBeijingTimeISOString();
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await env.DB.prepare(`UPDATE pages SET ${setClause} WHERE id = ?`)
      .bind(...values, pageId)
      .run();

    const page = await env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(pageId).first();

    const res = createSuccessResponse({
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        excerpt: page.excerpt,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        status: page.status,
        template: page.template,
        order_index: Number(page.order_index),
        is_in_menu: Boolean(page.is_in_menu),
        menu_title: page.menu_title,
        parent_id: page.parent_id,
        created_at: page.created_at,
        updated_at: page.updated_at,
        published_at: page.published_at,
        created_by: page.created_by,
      });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Update page error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to update page', error instanceof ApiError ? error.statusCode : 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 删除页面
 */
export async function deletePage(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  pageId: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // 检查页面是否存在
    const page = await env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(pageId).first();
    if (!page) {
      throw new ApiError('Page not found', 404);
    }

    // 检查是否有子页面
    const childPages = await env.DB.prepare('SELECT COUNT(*) as count FROM pages WHERE parent_id = ?').bind(pageId).first();
    if (childPages && Number(childPages.count) > 0) {
      throw new ApiError('Cannot delete page with child pages', 400);
    }

    // 删除页面
    await env.DB.prepare('DELETE FROM pages WHERE id = ?').bind(pageId).run();

    const res = createSuccessResponse({ message: 'Page deleted successfully' });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Delete page error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to delete page', error instanceof ApiError ? error.statusCode : 500, undefined, Object.fromEntries(headers.entries()));
  }
}
