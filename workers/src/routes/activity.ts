import { Env, Context } from '../types';
import { createSuccessResponse, createErrorResponse } from '../utils';
import { getLogger } from '../utils/logger';

export async function getRecentActivity(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // 最近文件上传
    const files = await env.DB.prepare(`
      SELECT id, name,original_name,uploaded_by_username, uploaded_at
      FROM files
      ORDER BY uploaded_at DESC
      LIMIT ?
    `).bind(limit).all();

    // 最近文章创建
    const articlesCreated = await env.DB.prepare(`
      SELECT id, title, author_username, created_at
      FROM articles
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    // 最近文章发布
    const articlesPublished = await env.DB.prepare(`
      SELECT id, title, author_username, published_at
      FROM articles
      WHERE status = 'published' AND published_at IS NOT NULL
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(limit).all();

    // 整理成统一格式
    const activities: any[] = [];

    files.results.forEach((f: any) => {
      activities.push({
        type: 'file_upload',
        user: f.uploaded_by_username,
        filename: f.name,
        original_name: f.original_name,
        time: f.uploaded_at,
        id: f.id,
      });
    });

    articlesCreated.results.forEach((a: any) => {
      activities.push({
        type: 'article_create',
        user: a.author_username,
        title: a.title,
        time: a.created_at,
        id: a.id,
      });
    });

    articlesPublished.results.forEach((a: any) => {
      activities.push({
        type: 'article_publish',
        user: a.author_username,
        title: a.title,
        time: a.published_at,
        id: a.id,
      });
    });

    // 合并后按时间倒序，取前 limit 条
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const result = activities.slice(0, limit);

    // CORS
    const res = createSuccessResponse(result);
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get recent activity error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('Failed to get recent activity', 500);
  }
} 