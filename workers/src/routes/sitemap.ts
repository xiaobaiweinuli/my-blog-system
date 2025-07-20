import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse } from '../utils';
import { getLogger } from '../utils/logger';

/**
 * 生成站点地图索引
 */
export async function generateSitemapIndex(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generateSitemapIndex called', { envSiteUrl: env.SITE_URL });
    console.log('env.SITE_URL =', env.SITE_URL);
    const siteUrl = env.SITE_URL || (request.headers && request.headers.get && request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://example.com');
    const now = new Date().toISOString();

    let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-articles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-categories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-tags.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new Response(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    await logger.error('Generate sitemap index error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate sitemap index', 500);
  }
}

/**
 * 生成页面站点地图
 */
export async function generatePagesSitemap(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generatePagesSitemap called');
    const siteUrl = env.SITE_URL || (request.headers && request.headers.get && request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://example.com');

    // 获取已发布的页面
    const pages = await env.DB.prepare(`
      SELECT slug, updated_at, is_in_menu
      FROM pages 
      WHERE status = 'published'
      ORDER BY order_index ASC, title ASC
    `).all();

    // 静态页面
    const staticPages = [
      { loc: siteUrl, priority: '1.0', changefreq: 'daily' },
      { loc: `${siteUrl}/articles`, priority: '0.9', changefreq: 'daily' },
      { loc: `${siteUrl}/archive`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${siteUrl}/friends`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${siteUrl}/rss`, priority: '0.6', changefreq: 'monthly' },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 添加静态页面
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`;
    });

    // 添加动态页面
    pages.results.forEach((page: any) => {
      const priority = page.is_in_menu ? '0.8' : '0.6';
      sitemap += `
  <url>
    <loc>${siteUrl}/pages/${page.slug}</loc>
    <lastmod>${page.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // 自动写入 sitemap_files 表
    const size = new TextEncoder().encode(sitemap).length;
    const lastmod = new Date().toISOString();
    // 建表（如未建）
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sitemap_files (name TEXT PRIMARY KEY, content TEXT, size INTEGER, lastmod TEXT)`).run();
    // 写入/更新
    await env.DB.prepare(`
      INSERT INTO sitemap_files (name, content, size, lastmod)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET content=excluded.content, size=excluded.size, lastmod=excluded.lastmod
    `).bind('sitemap-pages.xml', sitemap, size, lastmod).run();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    await logger.error('Generate pages sitemap error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate pages sitemap', 500);
  }
}

/**
 * 生成文章站点地图
 */
export async function generateArticlesSitemap(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generateArticlesSitemap called');
    const siteUrl = env.SITE_URL || (request.headers && request.headers.get && request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://example.com');

    // 获取已发布的文章
    const articles = await env.DB.prepare(`
      SELECT slug, published_at, updated_at, view_count
      FROM articles 
      WHERE status = 'published'
      ORDER BY published_at DESC
    `).all();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    articles.results.forEach((article: any) => {
      // 根据浏览量和发布时间计算优先级
      const viewCount = Number(article.view_count || 0);
      const publishedDate = new Date(article.published_at);
      const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      let priority = '0.7';
      if (viewCount > 1000 || daysSincePublished < 7) {
        priority = '0.9';
      } else if (viewCount > 500 || daysSincePublished < 30) {
        priority = '0.8';
      }

      let changefreq = 'monthly';
      if (daysSincePublished < 7) {
        changefreq = 'weekly';
      } else if (daysSincePublished < 30) {
        changefreq = 'monthly';
      }

      sitemap += `
  <url>
    <loc>${siteUrl}/articles/${article.slug}</loc>
    <lastmod>${article.updated_at}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // 自动写入 sitemap_files 表
    const size = new TextEncoder().encode(sitemap).length;
    const lastmod = new Date().toISOString();
    // 建表（如未建）
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sitemap_files (name TEXT PRIMARY KEY, content TEXT, size INTEGER, lastmod TEXT)`).run();
    // 写入/更新
    await env.DB.prepare(`
      INSERT INTO sitemap_files (name, content, size, lastmod)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET content=excluded.content, size=excluded.size, lastmod=excluded.lastmod
    `).bind('sitemap-articles.xml', sitemap, size, lastmod).run();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    await logger.error('Generate articles sitemap error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate articles sitemap', 500);
  }
}

/**
 * 生成分类站点地图
 */
export async function generateCategoriesSitemap(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generateCategoriesSitemap called');
    const siteUrl = env.SITE_URL || (request.headers && request.headers.get && request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://example.com');

    // 获取有文章的分类
    const categories = await env.DB.prepare(`
      SELECT c.slug, c.updated_at, COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON a.category = c.slug AND a.status = 'published'
      GROUP BY c.id, c.slug, c.updated_at
      HAVING article_count > 0
      ORDER BY article_count DESC
    `).all();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    categories.results.forEach((category: any) => {
      const articleCount = Number(category.article_count);
      let priority = '0.6';
      if (articleCount > 10) {
        priority = '0.8';
      } else if (articleCount > 5) {
        priority = '0.7';
      }

      sitemap += `
  <url>
    <loc>${siteUrl}/articles?category=${encodeURIComponent(category.slug)}</loc>
    <lastmod>${category.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // 自动写入 sitemap_files 表
    const size = new TextEncoder().encode(sitemap).length;
    const lastmod = new Date().toISOString();
    // 建表（如未建）
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sitemap_files (name TEXT PRIMARY KEY, content TEXT, size INTEGER, lastmod TEXT)`).run();
    // 写入/更新
    await env.DB.prepare(`
      INSERT INTO sitemap_files (name, content, size, lastmod)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET content=excluded.content, size=excluded.size, lastmod=excluded.lastmod
    `).bind('sitemap-categories.xml', sitemap, size, lastmod).run();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    await logger.error('Generate categories sitemap error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate categories sitemap', 500);
  }
}

/**
 * 生成标签站点地图
 */
export async function generateTagsSitemap(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generateTagsSitemap called');
    const siteUrl = env.SITE_URL || (request.headers && request.headers.get && request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://example.com');

    // 获取有文章的标签
    const tags = await env.DB.prepare(`
      SELECT t.slug, t.updated_at, COUNT(a.id) as article_count
      FROM tags t
      LEFT JOIN articles a ON JSON_EXTRACT(a.tags, '$') LIKE '%"' || t.slug || '"%' AND a.status = 'published'
      GROUP BY t.id, t.slug, t.updated_at
      HAVING article_count > 0
      ORDER BY article_count DESC
    `).all();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    tags.results.forEach((tag: any) => {
      const articleCount = Number(tag.article_count);
      let priority = '0.5';
      if (articleCount > 10) {
        priority = '0.7';
      } else if (articleCount > 5) {
        priority = '0.6';
      }

      sitemap += `
  <url>
    <loc>${siteUrl}/articles?tag=${encodeURIComponent(tag.slug)}</loc>
    <lastmod>${tag.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // 自动写入 sitemap_files 表
    const size = new TextEncoder().encode(sitemap).length;
    const lastmod = new Date().toISOString();
    // 建表（如未建）
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sitemap_files (name TEXT PRIMARY KEY, content TEXT, size INTEGER, lastmod TEXT)`).run();
    // 写入/更新
    await env.DB.prepare(`
      INSERT INTO sitemap_files (name, content, size, lastmod)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET content=excluded.content, size=excluded.size, lastmod=excluded.lastmod
    `).bind('sitemap-tags.xml', sitemap, size, lastmod).run();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    await logger.error('Generate tags sitemap error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate tags sitemap', 500);
  }
}

/**
 * 生成主站点地图（移除多语言支持）
 */
export async function generateMainSitemap(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generateMainSitemap called');
    const siteUrl = env.SITE_URL || (request.headers && request.headers.get && request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://example.com');

    // 获取已发布的文章和页面
    const articles = await env.DB.prepare(`
      SELECT slug, published_at, updated_at
      FROM articles 
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 1000
    `).all();

    const pages = await env.DB.prepare(`
      SELECT slug, updated_at
      FROM pages 
      WHERE status = 'published'
      ORDER BY order_index ASC
    `).all();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 主页
    sitemap += `
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`;

    // 文章列表页
    sitemap += `
  <url>
    <loc>${siteUrl}/articles</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`;

    // 文章页面
    articles.results.forEach((article: any) => {
      sitemap += `
  <url>
    <loc>${siteUrl}/articles/${article.slug}</loc>
    <lastmod>${article.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // 静态页面
    pages.results.forEach((page: any) => {
      sitemap += `
  <url>
    <loc>${siteUrl}/pages/${page.slug}</loc>
    <lastmod>${page.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // 自动写入 sitemap_files 表
    const size = new TextEncoder().encode(sitemap).length;
    const lastmod = new Date().toISOString();
    // 建表（如未建）
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sitemap_files (name TEXT PRIMARY KEY, content TEXT, size INTEGER, lastmod TEXT)`).run();
    // 写入/更新
    await env.DB.prepare(`
      INSERT INTO sitemap_files (name, content, size, lastmod)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET content=excluded.content, size=excluded.size, lastmod=excluded.lastmod
    `).bind('sitemap.xml', sitemap, size, lastmod).run();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    await logger.error('Generate main sitemap error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate main sitemap', 500);
  }
}

/**
 * 获取 sitemap 统计信息
 * GET /api/sitemap/stats
 */
export async function getSitemapStats(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('getSitemapStats called');
    // 统计文章
    const articleCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM articles WHERE status = ?').bind('published').first();
    const articleCount = articleCountRow?.count || 0;
    const articleLastmod = articleCountRow?.lastmod;

    // 统计页面
    const pageCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM pages WHERE status = ?').bind('published').first();
    const pageCount = pageCountRow?.count || 0;
    const pageLastmod = pageCountRow?.lastmod;

    // 统计分类
    const categoryCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM categories').first();
    const categoryCount = categoryCountRow?.count || 0;
    const categoryLastmod = categoryCountRow?.lastmod;

    // 统计标签
    const tagCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM tags').first();
    const tagCount = tagCountRow?.count || 0;
    const tagLastmod = tagCountRow?.lastmod;

    // 静态页面数量（如主页、文章列表、归档、友链、RSS等）
    const staticPages = [
      { name: 'home', url: '/' },
      { name: 'articles', url: '/articles' },
      { name: 'archive', url: '/archive' },
      { name: 'friends', url: '/friends' },
      { name: 'rss', url: '/rss' }
    ];
    const staticCount = staticPages.length;

    // 读取 sitemap_files 表的 size/lastmod
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sitemap_files (name TEXT PRIMARY KEY, content TEXT, size INTEGER, lastmod TEXT)`).run();
    const fileNames = [
      'sitemap.xml',
      'sitemap-articles.xml',
      'sitemap-pages.xml',
      'sitemap-categories.xml',
      'sitemap-tags.xml'
    ];
    const fileMetas: Record<string, any> = {};
    const placeholders = fileNames.map(() => '?').join(',');
    const rows = await env.DB.prepare(`SELECT name, size, lastmod FROM sitemap_files WHERE name IN (${placeholders})`).bind(...fileNames).all();
    rows.results.forEach((row: any) => {
      fileMetas[row.name] = row;
    });

    // 汇总
    const files = [
      { name: 'sitemap.xml', url_count: staticCount + articleCount + pageCount + categoryCount + tagCount },
      { name: 'sitemap-articles.xml', url_count: articleCount },
      { name: 'sitemap-pages.xml', url_count: pageCount + staticCount },
      { name: 'sitemap-categories.xml', url_count: categoryCount },
      { name: 'sitemap-tags.xml', url_count: tagCount }
    ];

    // 为每个文件增加真实 size、status、warnings、errors 字段
    const filesWithMeta = files.map(f => {
      const urlCount = Number(f.url_count) || 0;
      const meta = fileMetas[f.name];
      const size = meta?.size || 0;
      const lastmod = meta?.lastmod || null;
      const warnings = [];
      const errors = [];
      let status = 'ok';
      if (!urlCount || urlCount === 0) {
        status = 'error';
        errors.push('URL数量为0');
      } else {
        if (!meta) {
          status = 'warning';
          warnings.push('文件尚未生成');
        }
        if (urlCount > 49000) {
          status = 'warning';
          warnings.push('URL数量接近或超过5万，建议分块');
        }
        if (size > 45 * 1024 * 1024) {
          status = 'warning';
          warnings.push('文件大小接近或超过50MB，搜索引擎可能拒绝');
        }
        // 更新时间过久
        if (lastmod) {
          const lastmodDate = new Date(lastmod);
          if (!isNaN(lastmodDate.getTime()) && (new Date().getTime() - lastmodDate.getTime() > 30 * 24 * 60 * 60 * 1000)) {
            status = 'warning';
            warnings.push('文件30天未更新');
          }
        }
      }
      return {
        ...f,
        url_count: urlCount,
        size,
        lastmod: lastmod,
        status,
        warnings,
        errors
      };
    });

    // 取所有 lastmod 的最大值
    const last_generated = filesWithMeta.map(f => f.lastmod).filter(Boolean).sort().reverse()[0] || new Date().toISOString();

    return createSuccessResponse({
        file_count: filesWithMeta.length,
        total_url_count: filesWithMeta[0].url_count,
        last_generated,
        files: filesWithMeta
    });
  } catch (error) {
    await logger.error('Failed to get sitemap stats', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get sitemap stats', 500);
  }
}

/**
 * 手动/自动生成 sitemap
 * POST /api/sitemap/generate
 */
export async function generateSitemapFiles(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('generateSitemapFiles called');
    // 批量生成所有 sitemap 文件
    await generateMainSitemap(request, env, ctx, context);
    await generateArticlesSitemap(request, env, ctx, context);
    await generatePagesSitemap(request, env, ctx, context);
    await generateCategoriesSitemap(request, env, ctx, context);
    await generateTagsSitemap(request, env, ctx, context);

    // 统计信息，复用 getSitemapStats 的 filesWithMeta 逻辑
    // 统计文章
    const articleCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM articles WHERE status = ?').bind('published').first();
    const articleCount = articleCountRow?.count || 0;
    // 统计页面
    const pageCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM pages WHERE status = ?').bind('published').first();
    const pageCount = pageCountRow?.count || 0;
    // 统计分类
    const categoryCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM categories').first();
    const categoryCount = categoryCountRow?.count || 0;
    // 统计标签
    const tagCountRow = await env.DB.prepare('SELECT COUNT(*) as count, MAX(updated_at) as lastmod FROM tags').first();
    const tagCount = tagCountRow?.count || 0;
    // 静态页面数量
    const staticPages = [
      { name: 'home', url: '/' },
      { name: 'articles', url: '/articles' },
      { name: 'archive', url: '/archive' },
      { name: 'friends', url: '/friends' },
      { name: 'rss', url: '/rss' }
    ];
    const staticCount = staticPages.length;
    // 读取 sitemap_files 表的 size/lastmod
    const fileNames = [
      'sitemap.xml',
      'sitemap-articles.xml',
      'sitemap-pages.xml',
      'sitemap-categories.xml',
      'sitemap-tags.xml'
    ];
    const fileMetas: Record<string, any> = {};
    const placeholders = fileNames.map(() => '?').join(',');
    const rows = await env.DB.prepare(`SELECT name, size, lastmod FROM sitemap_files WHERE name IN (${placeholders})`).bind(...fileNames).all();
    rows.results.forEach((row: any) => {
      fileMetas[row.name] = row;
    });
    // 汇总
    const files = [
      { name: 'sitemap.xml', url_count: staticCount + articleCount + pageCount + categoryCount + tagCount },
      { name: 'sitemap-articles.xml', url_count: articleCount },
      { name: 'sitemap-pages.xml', url_count: pageCount + staticCount },
      { name: 'sitemap-categories.xml', url_count: categoryCount },
      { name: 'sitemap-tags.xml', url_count: tagCount }
    ];
    // 为每个文件增加真实 size、status、warnings、errors 字段
    const filesWithMeta = files.map(f => {
      const urlCount = Number(f.url_count) || 0;
      const meta = fileMetas[f.name];
      const size = meta?.size || 0;
      const lastmod = meta?.lastmod || null;
      const warnings = [];
      const errors = [];
      let status = 'ok';
      if (!urlCount || urlCount === 0) {
        status = 'error';
        errors.push('URL数量为0');
      } else {
        if (!meta) {
          status = 'warning';
          warnings.push('文件尚未生成');
        }
        if (urlCount > 49000) {
          status = 'warning';
          warnings.push('URL数量接近或超过5万，建议分块');
        }
        if (size > 45 * 1024 * 1024) {
          status = 'warning';
          warnings.push('文件大小接近或超过50MB，搜索引擎可能拒绝');
        }
        // 更新时间过久
        if (lastmod) {
          const lastmodDate = new Date(lastmod);
          if (!isNaN(lastmodDate.getTime()) && (new Date().getTime() - lastmodDate.getTime() > 30 * 24 * 60 * 60 * 1000)) {
            status = 'warning';
            warnings.push('文件30天未更新');
          }
        }
      }
      return {
        ...f,
        url_count: urlCount,
        size,
        lastmod: lastmod,
        status,
        warnings,
        errors
      };
    });
    const last_generated = filesWithMeta.map(f => f.lastmod).filter(Boolean).sort().reverse()[0] || new Date().toISOString();
    return createSuccessResponse({
      message: 'Sitemap generated successfully',
      last_generated,
      files: filesWithMeta
    });
  } catch (error) {
    await logger.error('Failed to generate sitemap', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate sitemap', 500);
  }
}

/**
 * 查看所有 sitemap 文件及其元数据
 * GET /api/sitemap/files
 */
export async function getSitemapFiles(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('getSitemapFiles called');
    // 查询所有 sitemap_files 表中的文件及元数据
    const rows = await env.DB.prepare('SELECT name, size, lastmod, content FROM sitemap_files').all();
    const files = [];
    for (const row of rows.results) {
      // 统计 url_count（简单统计 <url> 标签数量）
      let url_count = 0;
      if (row.content) {
        url_count = (row.content.match(/<url>/g) || []).length;
      }
      // type 字段自动推断
      let type = 'other';
      if (row.name === 'sitemap.xml') type = 'main';
      else if (row.name === 'sitemap-articles.xml') type = 'article';
      else if (row.name === 'sitemap-pages.xml') type = 'page';
      else if (row.name === 'sitemap-categories.xml') type = 'category';
      else if (row.name === 'sitemap-tags.xml') type = 'tag';
      else if (row.name.includes('image')) type = 'image';
      else if (row.name.includes('video')) type = 'video';
      else if (row.name.includes('lang')) type = 'lang';
      // 状态与警告
      let status = 'ok';
      const warnings = [];
      const errors = [];
      if (!url_count || url_count === 0) {
        status = 'error';
        errors.push('URL数量为0');
      } else {
        if (url_count > 49000) {
          status = 'warning';
          warnings.push('URL数量接近或超过5万，建议分块');
        }
        if (row.size > 45 * 1024 * 1024) {
          status = 'warning';
          warnings.push('文件大小接近或超过50MB，搜索引擎可能拒绝');
        }
        if (row.lastmod) {
          const lastmodDate = new Date(row.lastmod);
          if (!isNaN(lastmodDate.getTime()) && (new Date().getTime() - lastmodDate.getTime() > 30 * 24 * 60 * 60 * 1000)) {
            status = 'warning';
            warnings.push('文件30天未更新');
          }
        }
      }
      files.push({
        name: row.name,
        type,
        url_count,
        size: row.size,
        lastmod: row.lastmod,
        status,
        warnings,
        errors
      });
    }
    return createSuccessResponse({
      data: files
    });
  } catch (error) {
    await logger.error('Failed to get sitemap files', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get sitemap files', 500);
  }
}

/**
 * 获取和更新 sitemap 生成配置
 * GET/POST /api/sitemap/config
 */
export async function getSitemapConfig(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('getSitemapConfig called');
    // 新增配置项
    const keys = [
      'sitemap_enable_sitemap',
      'sitemap_auto_generate',
      'sitemap_include_articles',
      'sitemap_include_pages',
      'sitemap_include_image',
      'sitemap_include_news',
      'sitemap_include_video',
      'sitemap_priority_default',
      'sitemap_changefreq_default',
      'sitemap_split_size',
      'sitemap_exclude_paths',
      'sitemap_custom_urls'
    ];
    const placeholders = keys.map(() => '?').join(',');
    const rows = await env.DB.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).bind(...keys).all();
    const config: any = {
      enable_sitemap: true,
      auto_generate: true,
      include_articles: true,
      include_pages: true,
      include_image: false,
      include_news: false,
      include_video: false,
      priority_default: 0.7,
      changefreq_default: 'monthly',
      split_size: 1000,
      exclude_paths: [],
      custom_urls: []
    };
    rows.results.forEach((row: any) => {
      if (row.key === 'sitemap_enable_sitemap') config.enable_sitemap = row.value === 'true';
      if (row.key === 'sitemap_auto_generate') config.auto_generate = row.value === 'true';
      if (row.key === 'sitemap_include_articles') config.include_articles = row.value === 'true';
      if (row.key === 'sitemap_include_pages') config.include_pages = row.value === 'true';
      if (row.key === 'sitemap_include_image') config.include_image = row.value === 'true';
      if (row.key === 'sitemap_include_news') config.include_news = row.value === 'true';
      if (row.key === 'sitemap_include_video') config.include_video = row.value === 'true';
      if (row.key === 'sitemap_priority_default') config.priority_default = Number(row.value);
      if (row.key === 'sitemap_changefreq_default') config.changefreq_default = row.value;
      if (row.key === 'sitemap_split_size') config.split_size = Number(row.value);
      if (row.key === 'sitemap_exclude_paths') {
        try { config.exclude_paths = JSON.parse(row.value); } catch { config.exclude_paths = []; }
      }
      if (row.key === 'sitemap_custom_urls') {
        try { config.custom_urls = JSON.parse(row.value); } catch { config.custom_urls = []; }
      }
    });
    return createSuccessResponse({
      data: config
    });
  } catch (error) {
    await logger.error('Failed to get sitemap config', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get sitemap config', 500);
  }
}

export async function updateSitemapConfig(
  request: Request,
  env: Env,
  ctx: any,
  context: Context
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('updateSitemapConfig called');
    const body: any = await request.json();
    // 支持的配置项
    const allowed = [
      'enable_sitemap',
      'auto_generate',
      'include_articles',
      'include_pages',
      'include_image',
      'include_news',
      'include_video',
      'priority_default',
      'changefreq_default',
      'split_size',
      'exclude_paths',
      'custom_urls'
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        let dbKey = 'sitemap_' + key;
        let value = body[key];
        if (typeof value === 'boolean') value = value ? 'true' : 'false';
        if (Array.isArray(value) || typeof value === 'object') value = JSON.stringify(value);
        await env.DB.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`).bind(dbKey, String(value)).run();
      }
    }
    return createSuccessResponse({
      message: 'Sitemap config updated'
    });
  } catch (error) {
    await logger.error('Failed to update sitemap config', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to update sitemap config', 500);
  }
}
