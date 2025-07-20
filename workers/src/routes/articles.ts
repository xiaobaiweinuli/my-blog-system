import { Env, Context, ApiError } from '../types';
import { DatabaseService } from '../services/database';
import { AIService } from '../services/ai';
import { createSuccessResponse, createErrorResponse, parseJSON, generateSlug } from '../utils';
import { hasPermission } from '../utils/jwt';
import { generateId } from '../utils';
import { getBeijingTimeISOString } from '../utils/time';
import { getLogger } from '../utils/logger';
import { requireRole } from '../middleware/auth';
/**
 * 获取文章列表
 */
export async function getArticles(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const url = new URL(request.url);
    const authorUsername = url.searchParams.get('author_username');
    const status = url.searchParams.get('status'); // 可选参数
    const tag = url.searchParams.get('tag'); // 兼容单标签
    const tagsParam = url.searchParams.get('tags') || tag; // 支持 tags=标签1,标签2,标签3 或 tag=标签
    const tagsMode = url.searchParams.get('tags_mode') || 'any'; // any(默认)或all

    let sql = 'SELECT * FROM articles WHERE 1=1';
    let params: any[] = [];

    if (authorUsername) {
      sql += ' AND author_username = ?';
      params.push(authorUsername);
    }

    // 权限判断
    if (!context.user || (!hasPermission(context.user.role, 'admin') && (!authorUsername || context.user.username !== authorUsername))) {
      // 游客或非作者本人，只能看已发布
      sql += ' AND status = ?';
      params.push('published');
    } else if (status) {
      // 作者本人或管理员可自定义 status 查询
      sql += ' AND status = ?';
      params.push(status);
    }

    // 多标签筛选
    let tagsArr: string[] = [];
    if (tagsParam) {
      tagsArr = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (tagsArr.length > 0) {
      if (tagsMode === 'all') {
        // AND：每个标签都要匹配
        for (const t of tagsArr) {
          sql += ' AND tags LIKE ?';
          params.push(`%"${t}"%`);
        }
      } else {
        // OR：任意一个标签匹配即可
        const orSql = tagsArr.map(() => 'tags LIKE ?').join(' OR ');
        sql += ` AND (${orSql})`;
        params.push(...tagsArr.map(t => `%"${t}"%`));
      }
    }

    const articles = await env.DB.prepare(sql).bind(...params).all();
    const res = createSuccessResponse(articles.results);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get articles error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get articles', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 根据 slug 获取文章
 */
export async function getArticleBySlug(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  slug: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const dbService = new DatabaseService(env.DB, env.CACHE);
    const article = await dbService.getArticleBySlug(slug);
    
    if (!article) {
      throw new ApiError('Article not found', 404);
    }

    // 权限检查：未发布的文章只有作者和管理员可以查看
    if (article.status !== 'published') {
      if (!context.user || 
          (article.author_username !== context.user.username && !hasPermission(context.user.role, 'admin'))) {
        throw new ApiError('Article not found', 404);
      }
    }

    // 增加浏览量（异步执行，不影响响应）
    if (article.status === 'published') {
      ctx.waitUntil(
        env.DB.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?')
          .bind(article.id)
          .run()
      );
    }

    const res = createSuccessResponse(article);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get article error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get article', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 创建文章
 */
export async function createArticle(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
    throw new ApiError('Insufficient permissions', 403);
  }
  try {
    await logger.info('[createArticle] headers', { headers: Object.fromEntries(request.headers.entries()) });
    await logger.info('[createArticle] context.user', { user: context.user });
    const authHeader = request.headers.get('Authorization');
    await logger.info('[createArticle] Authorization header', { authHeader });
    if (!context.user) {
      await logger.error('[createArticle] Authentication required!');
      const headers = corsHeaders(request);
      return createErrorResponse('Authentication required', 401, undefined, Object.fromEntries(headers.entries()));
    }

    if (!hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const articleData = await parseJSON(request);
    const { title, slug, content, excerpt, summary, auto_generate_summary = false, category, tags, status = 'draft', cover_image } = articleData;

    if (!title || !content || !slug) {
      throw new ApiError('Title、content、slug 均为必填', 400);
    }

    // 兼容字符串和数组两种 tags
    let tagsArr: string[] = [];
    if (Array.isArray(tags)) {
      tagsArr = tags;
    } else if (typeof tags === 'string') {
      tagsArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const dbService = new DatabaseService(env.DB, env.CACHE);
    // 检查 slug 是否唯一
    if (await dbService.getArticleBySlug(slug)) {
      throw new ApiError('slug 已存在', 400);
    }

    // 自动补全分类
    if (category) {
      const existCategory = await env.DB.prepare('SELECT id FROM categories WHERE slug = ? OR name = ?').bind(category, category).first();
      if (!existCategory) {
        const categoryId = generateId();
        const now = getBeijingTimeISOString();
        await env.DB.prepare(`
          INSERT INTO categories (id, name, slug, description, color, order_index, created_at, updated_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          categoryId,
          category,
          category, // slug
          '', // description
          '#3b82f6', // 默认颜色
          99, // 默认排序
          now,
          now,
          context.user?.username || null
        ).run();
      }
    }

    // 自动补全标签
    for (const tag of tagsArr) {
      const existTag = await env.DB.prepare('SELECT id FROM tags WHERE slug = ? OR name = ?').bind(tag, tag).first();
      if (!existTag) {
        const tagId = generateId();
        const now = getBeijingTimeISOString();
        await env.DB.prepare(`
          INSERT INTO tags (id, name, slug, description, color, order_index, created_at, updated_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          tagId,
          tag,
          tag, // slug
          '', // description
          '#10b981', // 默认颜色
          99, // 默认排序
          now,
          now,
          context.user?.username || null
        ).run();
      }
    }

    // 自动生成摘要（如果未提供）
    let finalExcerpt = excerpt;
    if (!finalExcerpt && content) {
      try {
        const aiService = new AIService(env.AI);
        finalExcerpt = await aiService.generateSummary({
          content,
          maxLength: 150,
        });
      } catch (error) {
        await logger.warn('Failed to generate excerpt:', { error });
        finalExcerpt = content.substring(0, 150) + '...';
      }
    }
    // 自动生成 summary（按需生成）
    let finalSummary = summary;
    if (!finalSummary && auto_generate_summary && content) {
      try {
        const aiService = new AIService(env.AI);
        finalSummary = await aiService.generateSummary({
          content,
          maxLength: 500,
        });
      } catch (error) {
        await logger.warn('Failed to generate summary:', { error });
        finalSummary = content.substring(0, 500) + '...';
      }
    }
    const article = await dbService.createArticle({
      title,
      slug,
      content,
      excerpt: finalExcerpt,
      summary: finalSummary,
      category: category || 'uncategorized',
      tags: tagsArr,
      status,
      cover_image,
      author_username: context.user.username, // 用 username
      published_at: status === 'published' ? getBeijingTimeISOString() : undefined,
      view_count: 0,
      like_count: 0,
    });

    const res = createSuccessResponse(article, undefined, 200);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Create article error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error.message : 'Failed to create article', 500, undefined, Object.fromEntries([...headers.entries()]));
  }
}

/**
 * 更新文章
 */
export async function updateArticle(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  articleId: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user) {
      const headers = corsHeaders(request);
      throw new ApiError('Authentication required', 401);
    }

    const dbService = new DatabaseService(env.DB, env.CACHE);
    
    // 获取现有文章
    const existingArticle = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first();
    if (!existingArticle) {
      throw new ApiError('Article not found', 404);
    }

    // 权限检查：只有作者或管理员可以编辑
    if (existingArticle.author_username !== context.user.username && !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const updateData = await parseJSON(request);
    const { title, content, excerpt, summary, auto_generate_summary = false, category, tags, status, cover_image } = updateData;

    // 构建更新数据
    const updates: any = {
      updated_at: getBeijingTimeISOString(),
    };

    if (title !== undefined) {
      updates.title = title;
      // 如果标题改变，可能需要更新 slug
      if (title !== existingArticle.title) {
        let newSlug = generateSlug(title);
        let counter = 1;
        let originalSlug = newSlug;
        while (await dbService.getArticleBySlug(newSlug) && newSlug !== existingArticle.slug) {
          newSlug = `${originalSlug}-${counter}`;
          counter++;
        }
        updates.slug = newSlug;
      }
    }

    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (summary !== undefined) {
      updates.summary = summary;
    } else if (auto_generate_summary && content !== undefined) {
      // 只有 auto_generate_summary 为 true 且 summary 没传时才自动生成
      try {
        const aiService = new AIService(env.AI);
        updates.summary = await aiService.generateSummary({
          content,
          maxLength: 500,
        });
      } catch (error) {
        updates.summary = content.substring(0, 500) + '...';
      }
    }
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = JSON.stringify(Array.isArray(tags) ? tags : []);
    if (cover_image !== undefined) updates.cover_image = cover_image;

    if (status !== undefined) {
      updates.status = status;
      // 如果从草稿变为发布，设置发布时间
      if (status === 'published' && existingArticle.status !== 'published') {
        updates.published_at = getBeijingTimeISOString();
      }
    }

    // 执行更新
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await env.DB.prepare(`UPDATE articles SET ${setClause} WHERE id = ?`)
      .bind(...values, articleId)
      .run();

    // 获取更新后的文章
    const updatedArticle = await dbService.getArticleBySlug(updates.slug || existingArticle.slug);

    const res = createSuccessResponse(updatedArticle);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error.message : 'Failed to update article', 500, undefined, Object.fromEntries([...headers.entries()]));
  }
}

/**
 * 删除文章
 */
export async function deleteArticle(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  articleId: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user) {
      const headers = corsHeaders(request);
      throw new ApiError('Authentication required', 401);
    }

    const dbService = new DatabaseService(env.DB, env.CACHE);
    
    // 获取文章
    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first();
    if (!article) {
      throw new ApiError('Article not found', 404);
    }

    // 权限检查：只有作者或管理员可以删除
    if (article.author_username !== context.user.username && !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // 删除文章
    await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(articleId).run();

    // 合并 CORS 头
    const res = createSuccessResponse({ message: 'Article deleted successfully' });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to delete article', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 检查 slug 是否已存在
 */
export async function checkSlug(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    if (!slug) {
      return createErrorResponse('slug is required', 400);
    }
    const dbService = new DatabaseService(env.DB, env.CACHE);
    const article = await dbService.getArticleBySlug(slug);
    const res = createSuccessResponse({ exists: !!article });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    return createErrorResponse('Failed to check slug', 500);
  }
}
