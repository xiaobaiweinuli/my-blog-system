import { Env, Context, ApiError } from '../types';
import { DatabaseService } from '../services/database';
import { createSuccessResponse, createErrorResponse, parseJSON } from '../utils';
import { getLogger } from '../utils/logger';

/**
 * 搜索文章
 */
export async function searchArticles(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category') || '';
    const tag = url.searchParams.get('tag') || '';

    // 如果没有搜索查询，返回空结果
    if (!query.trim()) {
      const res = createSuccessResponse({
        articles: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
        query: '',
        suggestions: [],
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }

    // 修正：传递 env.CACHE
    const dbService = new DatabaseService(env.DB, env.CACHE);
    const offset = (page - 1) * limit;

    // 构建搜索查询
    let whereClause = 'WHERE status = ? AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)';
    const bindings: any[] = ['published', `%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      whereClause += ' AND category = ?';
      bindings.push(category);
    }

    if (tag) {
      whereClause += ' AND tags LIKE ?';
      bindings.push(`%"${tag}"%`);
    }

    // 获取搜索结果总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM articles ${whereClause}
    `).bind(...bindings).first();
    const total = countResult?.count as number || 0;

    // 获取搜索结果
    const results = await env.DB.prepare(`
      SELECT 
        id, title, slug,content, excerpt, summary, cover_image, category, tags,
        author_username, published_at, created_at, updated_at, view_count, like_count
      FROM articles 
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN title LIKE ? THEN 1
          WHEN excerpt LIKE ? THEN 2
          ELSE 3
        END,
        published_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, `%${query}%`, `%${query}%`, limit, offset).all();

    const articles = results.results.map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      view_count: Number(row.view_count),
      like_count: Number(row.like_count),
    }));

    // 生成搜索建议
    const suggestions = await generateSearchSuggestions(query, env.DB);

    const totalPages = Math.ceil(total / limit);

    const res = createSuccessResponse({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      query,
      suggestions,
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Search error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Search failed', 500);
  }
}

/**
 * 高级搜索
 */
export async function advancedSearch(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const body = await parseJSON(request);
    const {
      title = '',
      content = '',
      category = '',
      tags = [],
      author_username = '',
      status = '',
      created_at = {},
      page = 1,
      limit = 10,
      query = undefined
    } = body;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const bindings: any[] = [];
    if (title && title.trim()) {
      whereClause += ' AND title LIKE ?';
      bindings.push(`%${title.trim()}%`);
    }
    if (content && content.trim()) {
      whereClause += ' AND content LIKE ?';
      bindings.push(`%${content.trim()}%`);
    }
    if (category) {
      whereClause += ' AND category = ?';
      bindings.push(category);
    }
    // 兼容字符串和数组两种 tags
    let tagsArr: string[] = [];
    if (Array.isArray(tags)) {
      tagsArr = tags;
    } else if (typeof tags === 'string') {
      tagsArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (tagsArr && tagsArr.length > 0) {
      // 改为“且”关系：每个标签都必须被包含
      whereClause += tagsArr.map(() => ' AND tags LIKE ?').join('');
      bindings.push(...tagsArr.map((tag: string) => `%"${tag}"%`));
    }
    if (author_username) {
      whereClause += ' AND author_username = ?';
      bindings.push(author_username);
    }
    if (status) {
      whereClause += ' AND status = ?';
      bindings.push(status);
    }
    if (created_at.gte) {
      whereClause += ' AND created_at >= ?';
      bindings.push(created_at.gte);
    }
    if (created_at.lte) {
      whereClause += ' AND created_at <= ?';
      bindings.push(created_at.lte);
    }
    // 日志输出SQL和参数
    await logger.info('[advancedSearch] whereClause', { whereClause });
    await logger.info('[advancedSearch] bindings', { bindings });
    const sql = `SELECT COUNT(*) as count FROM articles ${whereClause}`;
    await logger.info('[advancedSearch] count SQL', { sql });
    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM articles ${whereClause}
    `).bind(...bindings).first();
    const total = countResult?.count as number || 0;
    // 获取结果
    const resultSql = `SELECT 
      id, title, slug, excerpt, summary, cover_image, category, tags,
      author_username, published_at, created_at, updated_at, view_count, like_count, status, content
    FROM articles 
    ${whereClause}
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?`;
    await logger.info('[advancedSearch] result SQL', { resultSql });
    const results = await env.DB.prepare(resultSql)
      .bind(...bindings, limit, offset).all();
    await logger.info('[advancedSearch] db results', { results });
    const articles = results.results.map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      view_count: Number(row.view_count),
      like_count: Number(row.like_count),
    }));
    const totalPages = Math.ceil(total / limit);
    const res = createSuccessResponse({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      query: { title, content, category, tags, author_username, status, created_at },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Advanced search error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Advanced search failed', 500);
  }
}

/**
 * 生成搜索建议
 */
async function generateSearchSuggestions(query: string, db: any): Promise<string[]> {
  try {
    // 获取相关标签
    const tagResults = await db.prepare(`
      SELECT DISTINCT tags FROM articles 
      WHERE status = 'published' AND tags LIKE ?
      LIMIT 5
    `).bind(`%${query}%`).all();

    const suggestions: string[] = [];
    
    for (const result of tagResults.results) {
      const tags = JSON.parse(result.tags as string || '[]');
      for (const tag of tags) {
        if (tag.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(tag)) {
          suggestions.push(tag);
          if (suggestions.length >= 5) break;
        }
      }
      if (suggestions.length >= 5) break;
    }

    // 获取相关分类
    if (suggestions.length < 5) {
      const categoryResults = await db.prepare(`
        SELECT DISTINCT category FROM articles 
        WHERE status = 'published' AND category LIKE ?
        LIMIT ?
      `).bind(`%${query}%`, 5 - suggestions.length).all();

      for (const result of categoryResults.results) {
        if (!suggestions.includes(result.category as string)) {
          suggestions.push(result.category as string);
        }
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Generate suggestions error:', error);
    return [];
  }
}
