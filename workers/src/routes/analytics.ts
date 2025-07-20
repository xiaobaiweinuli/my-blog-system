import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse, parseJSON, generateId } from '../utils';
import { hasPermission } from '../utils/jwt';
import { getLogger } from '../utils/logger';

/**
 * 记录文章浏览
 */
export async function recordArticleView(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const { articleId, visitorId } = await parseJSON(request);
    const safeVisitorId = visitorId ?? '';

    if (!articleId) {
      throw new ApiError('Article ID is required', 400);
    }

    // 获取请求信息
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    
    // 从 Cloudflare 获取地理位置信息
    const country = (request as any).cf?.country || 'unknown';
    const city = (request as any).cf?.city || 'unknown';

    // 检查文章是否存在
    const article = await env.DB.prepare('SELECT id FROM articles WHERE id = ? AND status = ?')
      .bind(articleId, 'published')
      .first();

    if (!article) {
      throw new ApiError('Article not found', 404);
    }

    // 防止重复统计（同一访客或同一IP 1小时内的重复访问）
    if (safeVisitorId) {
      const recentView = await env.DB.prepare(`
        SELECT id FROM article_views 
        WHERE article_id = ? AND visitor_id = ? 
        AND viewed_at > datetime('now', '-1 hour')
      `).bind(articleId, safeVisitorId).first();

      if (recentView) {
        const res = createSuccessResponse({ message: 'View already recorded recently' });
        const headers = new Headers(res.headers);
        const cors = corsHeaders(request);
        cors.forEach((v, k) => headers.set(k, v));
        return new Response(res.body, { status: res.status, headers });
      }
    } else if (clientIP && clientIP !== 'unknown') {
      // 新增：用IP做去重
      const recentViewByIP = await env.DB.prepare(`
        SELECT id FROM article_views 
        WHERE article_id = ? AND ip_address = ? 
        AND viewed_at > datetime('now', '-1 hour')
      `).bind(articleId, clientIP).first();

      if (recentViewByIP) {
        const res = createSuccessResponse({ message: 'View already recorded recently by IP' });
        const headers = new Headers(res.headers);
        const cors = corsHeaders(request);
        cors.forEach((v, k) => headers.set(k, v));
        return new Response(res.body, { status: res.status, headers });
      }
    }

    // 记录浏览
    const viewId = generateId();
    await env.DB.prepare(`
      INSERT INTO article_views (id, article_id, visitor_id, ip_address, user_agent, referer, country, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(viewId, articleId, safeVisitorId, clientIP, userAgent, referer, country, city).run();

    // 更新文章的浏览计数
    await env.DB.prepare(`
      UPDATE articles 
      SET view_count = (
        SELECT COUNT(*) FROM article_views WHERE article_id = ?
      )
      WHERE id = ?
    `).bind(articleId, articleId).run();

    {
      const res = createSuccessResponse({ message: 'View recorded successfully' });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v, k) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
  } catch (error) {
    await logger.error('Record article view error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error.message : 'Failed to record view', 500, undefined, corsHeaders(request));
  }
}

/**
 * 获取文章统计数据
 */
export async function getArticleStats(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    // 移除权限校验
    // if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
    //   throw new ApiError('Insufficient permissions', 403);
    // }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y
    const articleId = url.searchParams.get('articleId');

    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case '90d':
        dateFilter = "datetime('now', '-90 days')";
        break;
      case '1y':
        dateFilter = "datetime('now', '-1 year')";
        break;
      default:
        dateFilter = "datetime('now', '-7 days')";
    }

    if (articleId) {
      // 获取特定文章的统计
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(DISTINCT country) as countries,
          DATE(viewed_at) as date,
          COUNT(*) as daily_views
        FROM article_views 
        WHERE article_id = ? AND viewed_at >= ${dateFilter}
        GROUP BY DATE(viewed_at)
        ORDER BY date DESC
      `).bind(articleId).all();

      const totalStats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(DISTINCT country) as countries
        FROM article_views 
        WHERE article_id = ? AND viewed_at >= ${dateFilter}
      `).bind(articleId).first();

      {
        const res = createSuccessResponse({
          article_id: articleId,
          period,
          total_stats: totalStats,
          daily_stats: stats.results,
        });
        const headers = new Headers(res.headers);
        const cors = corsHeaders(request);
        cors.forEach((v, k) => headers.set(k, v));
        return new Response(res.body, { status: res.status, headers });
      }
    } else {
      // 获取整体统计
      const totalStats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(DISTINCT article_id) as articles_viewed,
          COUNT(DISTINCT country) as countries
        FROM article_views 
        WHERE viewed_at >= ${dateFilter}
      `).first();

      const dailyStats = await env.DB.prepare(`
        SELECT 
          DATE(viewed_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(DISTINCT article_id) as articles_viewed
        FROM article_views 
        WHERE viewed_at >= ${dateFilter}
        GROUP BY DATE(viewed_at)
        ORDER BY date DESC
      `).all();

      const topArticles = await env.DB.prepare(`
        SELECT 
          a.id,
          a.title,
          a.slug,
          COUNT(av.id) as views,
          COUNT(DISTINCT av.visitor_id) as unique_visitors
        FROM articles a
        LEFT JOIN article_views av ON a.id = av.article_id 
          AND av.viewed_at >= ${dateFilter}
        WHERE a.status = 'published'
        GROUP BY a.id, a.title, a.slug
        ORDER BY views DESC
        LIMIT 10
      `).all();

      const topCountries = await env.DB.prepare(`
        SELECT 
          country,
          COUNT(*) as views,
          COUNT(DISTINCT visitor_id) as unique_visitors
        FROM article_views 
        WHERE viewed_at >= ${dateFilter} AND country != 'unknown'
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `).all();

      {
        const res = createSuccessResponse({
          period,
          total_stats: totalStats,
          daily_stats: dailyStats.results,
          top_articles: topArticles.results,
          top_countries: topCountries.results,
        });
        const headers = new Headers(res.headers);
        const cors = corsHeaders(request);
        cors.forEach((v, k) => headers.set(k, v));
        return new Response(res.body, { status: res.status, headers });
      }
    }
  } catch (error) {
    const logger = getLogger(env);
    await logger.error('Get article stats error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error.message : 'Failed to get stats', 500, undefined, corsHeaders(request));
  }
}

/**
 * 获取仪表板统计数据
 */
export async function getDashboardStats(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // 文章统计
    const articleStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as recent
      FROM articles
    `).first();

    // 用户统计（改为用 KV 统计）
    const userList = await env.CACHE.list(); // 如有前缀可加 { prefix: "user:" }
    const userKeys = userList.keys.map((k: { name: string }) => k.name);
    const userObjs = await Promise.all(
      userKeys.map((key: string) => env.CACHE.get(key, "json"))
    );
    const total = userObjs.length;
    const admins = userObjs.filter(u => u && u.role === 'admin').length;
    const collaborators = userObjs.filter(u => u && u.role === 'collaborator').length;
    const now = Date.now();
    const recent = userObjs.filter(u => u && u.created_at && (now - new Date(u.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000).length;
    const userStats = { total, admins, collaborators, recent };

    // 浏览量统计
    const viewStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT article_id) as viewed_articles,
        SUM(CASE WHEN viewed_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as recent_views
      FROM article_views
    `).first();

    // 文件统计
    const fileStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(size) as total_size,
        SUM(CASE WHEN type LIKE 'image/%' THEN 1 ELSE 0 END) as images,
        SUM(CASE WHEN uploaded_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as recent
      FROM files
    `).first();

    // 最近7天的浏览趋势
    const viewTrend = await env.DB.prepare(`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM article_views 
      WHERE viewed_at >= datetime('now', '-7 days')
      GROUP BY DATE(viewed_at)
      ORDER BY date ASC
    `).all();

    // 热门文章（最近30天）
    const popularArticles = await env.DB.prepare(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        COUNT(av.id) as views
      FROM articles a
      LEFT JOIN article_views av ON a.id = av.article_id 
        AND av.viewed_at >= datetime('now', '-30 days')
      WHERE a.status = 'published'
      GROUP BY a.id, a.title, a.slug
      ORDER BY views DESC
      LIMIT 5
    `).all();

    {
      const res = createSuccessResponse({
        articles: articleStats,
        users: userStats,
        views: viewStats,
        files: fileStats,
        view_trend: viewTrend.results,
        popular_articles: popularArticles.results,
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v, k) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
  } catch (error) {
    const logger = getLogger(env);
    await logger.error('Get dashboard stats error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error.message : 'Failed to get dashboard stats', 500, undefined, corsHeaders(request));
  }
}

/**
 * 获取热门标签统计
 */
export async function getPopularTags(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const period = url.searchParams.get('period') || '30d';

    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "AND a.published_at >= datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "AND a.published_at >= datetime('now', '-30 days')";
        break;
      case '90d':
        dateFilter = "AND a.published_at >= datetime('now', '-90 days')";
        break;
      case '1y':
        dateFilter = "AND a.published_at >= datetime('now', '-1 year')";
        break;
    }

    // 这个查询比较复杂，因为标签存储在JSON数组中
    // 我们需要展开JSON数组并统计每个标签的使用次数
    const popularTags = await env.DB.prepare(`
      SELECT 
        t.name,
        t.slug,
        t.color,
        COUNT(a.id) as article_count,
        COALESCE(SUM(a.view_count), 0) as total_views
      FROM tags t
      LEFT JOIN articles a ON JSON_EXTRACT(a.tags, '$') LIKE '%"' || t.slug || '"%'
        AND a.status = 'published' ${dateFilter}
      GROUP BY t.id, t.name, t.slug, t.color
      ORDER BY article_count DESC, total_views DESC
      LIMIT ?
    `).bind(limit).all();

    {
      const res = createSuccessResponse({
        period,
        tags: popularTags.results,
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v, k) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
  } catch (error) {
    const logger = getLogger(env);
    await logger.error('Get popular tags error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error.message : 'Failed to get popular tags', 500, undefined, corsHeaders(request));
  }
}

/**
 * Giscus 评论统计（优先用 GraphQL 支持所有表情，失败时降级 REST）
 * GET /api/giscus/stats?repo=owner/repo&category=DiscussionCategory&discussion_number=xxx
 * 返回：评论数、参与用户数、reaction数、所有表情统计
 */
export async function getGiscusStats(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const repo = url.searchParams.get('repo') || env.GISCUS_REPO;
    const discussion_number = url.searchParams.get('discussion_number') || env.GISCUS_DISCUSSION_NUMBER;
    const mapping = url.searchParams.get('mapping');
    const term = url.searchParams.get('term');
    if (!repo) {
      return new Response(JSON.stringify({ error: 'repo 必填' }), { status: 400, headers: corsHeaders(request) });
    }
    const [owner, repoName] = repo.split('/');
    const token = env.GITHUB_TOKEN; // 可以为 undefined
    // 不再强制校验 token

    let discussionNumber = discussion_number;

    // 支持 mapping=title+term 自动查找 discussion_number
    if (!discussionNumber && mapping === 'title' && term) {
      const query = `
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            discussions(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                number
                title
              }
            }
          }
        }
      `;
      const variables = { owner, name: repoName };
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          'User-Agent': 'MyBlogSystem/1.0.0'
        },
        body: JSON.stringify({ query, variables })
      });
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'GraphQL返回非JSON', detail: rawText }), { status: 500, headers: corsHeaders(request) });
      }
      if (data.errors && data.errors.length > 0) {
        return new Response(JSON.stringify(data), { status: 500, headers: corsHeaders(request) });
      }
      const discussions = Array.isArray(data?.data?.repository?.discussions?.nodes) ? data.data.repository.discussions.nodes : [];
      const found = discussions.find((d: any) => d.title === term);
      if (found) {
        discussionNumber = found.number;
      } else {
        return new Response(JSON.stringify({ error: '未找到对应标题的 discussion' }), { status: 404, headers: corsHeaders(request) });
      }
    }

    if (!discussionNumber) {
      return new Response(JSON.stringify({ error: 'discussion_number 或 mapping+term 必填' }), { status: 400, headers: corsHeaders(request) });
    }

    // D1 缓存逻辑
    const cacheKey = `giscus_stats:${url.searchParams.get('repo')}:${url.searchParams.get('discussion_number') || ''}:${url.searchParams.get('mapping') || ''}:${url.searchParams.get('term') || ''}`;
    const now = Math.floor(Date.now() / 1000);
    const cacheTtl = 60; // 缓存60秒
    // 1. 查询D1缓存
    const cacheRow = await env.DB.prepare('SELECT data, expires_at FROM giscus_stats_cache WHERE cache_key = ?').bind(cacheKey).first();
    if (cacheRow && cacheRow.data && cacheRow.expires_at > now) {
      // 命中缓存
      const resp = new Response(cacheRow.data, {
        status: 200,
        headers: corsHeaders(request)
      });
      resp.headers.set('X-Cache', 'D1-HIT');
      return resp;
    }

    // 1. 只用 GraphQL 查询所有表情和用户统计，不再降级 REST API
    try {
      const query = `
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            discussion(number: $number) {
              title
              author {
                login
                avatarUrl
                url
              }
              reactionGroups {
                content
                users(first: 100) {
                  nodes {
                    login
                    avatarUrl
                    url
                  }
                  totalCount
                }
              }
              comments(first: 100) {
                nodes {
                  id
                  body
                  author {
                    login
                    avatarUrl
                    url
                  }
                  createdAt
                  reactionGroups {
                    content
                    users(first: 100) {
                      nodes {
                        login
                        avatarUrl
                        url
                      }
                      totalCount
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const variables = { owner, name: repoName, number: Number(discussionNumber) };
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          'User-Agent': 'MyBlogSystem/1.0.0'
        },
        body: JSON.stringify({ query, variables })
      });
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new ApiError('GraphQL返回非JSON', 500);
      }
      if (data.errors && data.errors.length > 0) {
        throw new ApiError(JSON.stringify(data.errors), 500);
      }
      const discussionReactions = data?.data?.repository?.discussion?.reactionGroups || [];
      const comments = data?.data?.repository?.discussion?.comments?.nodes || [];
      const reaction_summary: Record<string, number> = {};
      // 构建用户统计表
      const userMap = new Map(); // login -> {login, avatarUrl, url, comment_count, comments, reactions}
      // 1. 统计评论
      for (const comment of comments) {
        if (comment.author && comment.author.login) {
          const login = comment.author.login;
          if (!userMap.has(login)) {
            userMap.set(login, {
              login,
              avatarUrl: comment.author.avatarUrl,
              url: comment.author.url,
              comment_count: 0,
              comments: [],
              reactions: {}
            });
          }
          const user = userMap.get(login);
          user.comment_count += 1;
          user.comments.push(comment.body);
        }
      }
      // 2. 统计主楼和评论的 reaction
      function addReactionUser(u: any, content: string) {
        if (!u || !u.login) return;
        if (!userMap.has(u.login)) {
          userMap.set(u.login, {
            login: u.login,
            avatarUrl: u.avatarUrl,
            url: u.url,
            comment_count: 0,
            comments: [],
            reactions: {}
          });
        }
        const user = userMap.get(u.login);
        user.reactions[content] = (user.reactions[content] || 0) + 1;
      }
      // 主楼 reaction 用户
      for (const group of discussionReactions) {
        reaction_summary[group.content] = (reaction_summary[group.content] || 0) + group.users.totalCount;
        for (const u of group.users.nodes) {
          addReactionUser(u, group.content);
        }
      }
      // 主楼作者也算参与用户
      const discussionAuthor = data?.data?.repository?.discussion?.author;
      if (discussionAuthor && discussionAuthor.login) {
        if (!userMap.has(discussionAuthor.login)) {
          userMap.set(discussionAuthor.login, {
            login: discussionAuthor.login,
            avatarUrl: discussionAuthor.avatarUrl,
            url: discussionAuthor.url,
            comment_count: 0,
            comments: [],
            reactions: {}
          });
        }
      }
      // 评论 reaction 用户和评论作者
      for (const comment of comments) {
        for (const group of comment.reactionGroups) {
          reaction_summary[group.content] = (reaction_summary[group.content] || 0) + group.users.totalCount;
          for (const u of group.users.nodes) {
            addReactionUser(u, group.content);
          }
        }
      }
      // 统计总回复数和总点赞数
      const reply_count = comments.length;
      const like_count = (reaction_summary['THUMBS_UP'] || 0);
      // 统计 user_count（不包含主楼作者）
      let user_count = userMap.size;
      if (discussionAuthor && discussionAuthor.login && userMap.has(discussionAuthor.login)) {
        user_count -= 1;
      }
      const result = {
        title: data?.data?.repository?.discussion?.title,
        comment_count: comments.length,
        reply_count,
        like_count,
        reaction_summary,
        discussion_reactions: Object.fromEntries(
          discussionReactions.map((g: any) => [g.content, g.users.totalCount])
        ),
        user_count,
        users: Array.from(userMap.values()),
        comments: comments.map((c: any) => ({
          id: c.id,
          body: c.body,
          author: c.author,
          created_at: c.createdAt,
          reactions: Object.fromEntries(
            c.reactionGroups.map((g: any) => [g.content, g.users.totalCount])
          )
        }))
      };
      // 写入D1缓存
      const jsonStr = JSON.stringify(result);
      await env.DB.prepare(
        'INSERT OR REPLACE INTO giscus_stats_cache (cache_key, data, expires_at) VALUES (?, ?, ?)'
      ).bind(cacheKey, jsonStr, now + cacheTtl).run();
      const response = new Response(jsonStr, {
        status: 200,
        headers: corsHeaders(request)
      });
      response.headers.set('X-Cache', 'D1-MISS');
      return response;
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as any)?.message || String(error) }), { status: 500, headers: corsHeaders(request) });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any)?.message || String(error) }), { status: 500, headers: corsHeaders(request) });
  }
}

/**
 * 获取 Giscus 仓库下所有 discussion 的标题和编号
 * GET /api/giscus/all-titles?repo=owner/repo
 * 返回：[{number, title}]
 */
export async function getGiscusAllTitles(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const repo = url.searchParams.get('repo') || env.GISCUS_REPO;
    if (!repo) {
      return new Response(JSON.stringify({ error: 'repo 必填' }), { status: 400, headers: corsHeaders(request) });
    }
    const [owner, repoName] = repo.split('/');
    const token = env.GITHUB_TOKEN; // 可以为 undefined
    // 不再强制校验 token
    // 支持分页参数
    const first = parseInt(url.searchParams.get('first') || '100'); // 默认最多100
    let after = url.searchParams.get('after') || null;
    let hasNextPage = true;
    let allDiscussions: any[] = [];
    while (hasNextPage && allDiscussions.length < first) {
      const query = `
        query($owner: String!, $name: String!, $first: Int!, $after: String) {
          repository(owner: $owner, name: $name) {
            discussions(first: $first, after: $after, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                number
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;
      const variables: any = { owner, name: repoName, first: Math.min(100, first - allDiscussions.length) };
      if (after) variables.after = after;
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          'User-Agent': 'MyBlogSystem/1.0.0'
        },
        body: JSON.stringify({ query, variables })
      });
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'GraphQL返回非JSON', detail: rawText }), { status: 500, headers: corsHeaders(request) });
      }
      if (data.errors && data.errors.length > 0) {
        return new Response(JSON.stringify(data), { status: 500, headers: corsHeaders(request) });
      }
      const discussions = data?.data?.repository?.discussions?.nodes || [];
      allDiscussions = allDiscussions.concat(discussions);
      const pageInfo = data?.data?.repository?.discussions?.pageInfo;
      hasNextPage = pageInfo?.hasNextPage;
      after = pageInfo?.endCursor;
      // 如果没有分页参数，或者已经够了first条，就不再请求
      if (!hasNextPage || allDiscussions.length >= first) break;
    }
    const resData = {
      repo,
      discussions: allDiscussions.map((d: any) => ({ number: d.number, title: d.title }))
    };
    const resObj = new Response(JSON.stringify(resData), { status: 200, headers: corsHeaders(request) });
    return resObj;
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any)?.message || String(error) }), { status: 500, headers: corsHeaders(request) });
  }
}

/**
 * 删除 Giscus 评论
 * DELETE /api/giscus/delete-comment?repo=owner/repo&comment_id=xxx
 * 需要 GITHUB_TOKEN 有 repo 维护者权限
 */
export async function deleteGiscusComment(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || context.user.role !== 'admin') {
      throw new ApiError('权限不足', 403);
    }
    const url = new URL(request.url);
    const repo = url.searchParams.get('repo') || env.GISCUS_REPO;
    const comment_id = url.searchParams.get('comment_id');
    if (!repo || !comment_id) {
      throw new ApiError('repo 和 comment_id 必填', 400);
    }
    const [owner, repoName] = repo.split('/');
    const token = env.GITHUB_TOKEN;
    if (!token) throw new ApiError('未配置 GITHUB_TOKEN', 500);
    // 删除评论
    const delRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/discussions/comments/${comment_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
    });
    if (delRes.status === 204) {
      const res = createSuccessResponse({ message: '删除成功', comment_id });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v, k) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    } else {
      const errText = await delRes.text();
      throw new ApiError('删除失败: ' + errText, delRes.status);
    }
  } catch (error) {
    const logger = getLogger(env);
    await logger.error('Delete Giscus comment error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error.message : '删除评论失败', 500, undefined, corsHeaders(request));
  }
}
