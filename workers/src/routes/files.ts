import { Env, Context, ApiError } from '../types';
import { StorageService } from '../services/storage';
import { DatabaseService } from '../services/database';
import { createSuccessResponse, createErrorResponse, safeJsonParse } from '../utils';
import { hasPermission } from '../utils/jwt';
import { getBeijingTimeISOString } from '../utils/time';
import { getLogger } from '../utils/logger';
import { requireRole } from '../middleware/auth';

/**
 * 上传文件
 */
export async function uploadFile(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // uploadFile 权限判断
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const formData = await request.formData();
    const files = formData.getAll('file').filter(f => typeof f === 'object' && typeof (f as any).arrayBuffer === 'function') as File[];
    if (!files.length) {
      throw new ApiError('File is required', 400);
    }
    const folder = formData.get('folder') as string || 'uploads';
    const isPublic = formData.get('isPublic') === 'true';

    // 获取系统设置
    const dbService = new DatabaseService(env.DB, env.CACHE);
    const maxSizeResult = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('max_file_size').first();
    const allowedTypesResult = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('allowed_file_types').first();
    const maxSize = parseInt(maxSizeResult?.value as string || '10485760'); // 10MB
    const allowedTypes = safeJsonParse(allowedTypesResult?.value as string || '[]', []);

    // 初始化存储服务
    const storageService = new StorageService(env.R2_BUCKET);
    const results = [];
    for (const fileObj of files) {
      // 上传文件到 R2
      const uploadResult = await storageService.uploadFile(fileObj, fileObj.name, {
        maxSize,
        allowedTypes,
        folder,
        isPublic,
      });
      // 保存文件记录到数据库
      const fileRecord = await dbService.createFile({
        name: uploadResult.name,
        original_name: fileObj.name,
        size: uploadResult.size,
        type: uploadResult.type,
        url: uploadResult.url,
        r2_key: uploadResult.key,
        uploaded_by_username: context.user.username,
        is_public: isPublic,
        folder,
        metadata: JSON.stringify({
          uploadedAt: getBeijingTimeISOString(),
          userAgent: request.headers.get('User-Agent'),
        }),
      });
      results.push(fileRecord);
    }
    const res = createSuccessResponse(results);
    const headers = corsHeaders(request);
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('File upload error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'File upload failed', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取文件列表
 */
export async function getFiles(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  if (!context.user || !hasPermission(context.user.role, 'admin')) {
    throw new ApiError('Insufficient permissions', 403);
  }
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const folder = url.searchParams.get('folder') || undefined;
    const offset = (page - 1) * limit;

    const dbService = new DatabaseService(env.DB, env.CACHE);
    
    // 管理员可以查看所有文件，其他用户只能查看自己的文件
    const options = {
      limit,
      offset,
      folder,
      ...(hasPermission(context.user.role, 'admin') ? {} : { uploaded_by_username: context.user.username }),
    };

    const result = await dbService.getFiles(options);
    
    const res = createSuccessResponse(result);
    const headers = corsHeaders(request);
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get files error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get files', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取文件内容
 */
export async function getFile(
  request: Request,
  env: Env,
  ctx: any,
  key: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    await logger.info('getFile key (raw)', { key });
    key = decodeURIComponent(key);
    await logger.info('getFile key (decoded)', { key });
    const dbService = new DatabaseService(env.DB, env.CACHE);
    // 先查 id 字段
    let fileRecord = await env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(key).first();
    // 如果查不到，再查 r2_key 字段
    if (!fileRecord) {
      fileRecord = await env.DB.prepare('SELECT * FROM files WHERE r2_key = ?').bind(key).first();
    }
    // 查不到时，打印所有 r2_key 便于排查
    if (!fileRecord) {
      const all = await env.DB.prepare('SELECT r2_key FROM files').all();
      await logger.info('所有 r2_key', { all: all.results });
      throw new ApiError('File not found', 404);
    }
    // 用 r2_key 查 R2
    const storageService = new StorageService(env.R2_BUCKET);
    const object = await storageService.getFile(fileRecord.r2_key);
    if (!object) {
      throw new ApiError('File not found', 404);
    }
    // 如果文件不是公开的，需要验证权限
    if (!fileRecord.is_public) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        throw new ApiError('Authentication required for private file', 401);
      }
      // 这里可以添加更详细的权限检查
    }
    const headers = new Headers();
    // 设置 Content-Type，text/* 自动加 charset=utf-8
    let contentType = object.httpMetadata?.contentType;
    if (!contentType) {
      // 兜底：用扩展名推断
      contentType = (typeof storageService.getMimeTypeFromExtension === 'function')
        ? storageService.getMimeTypeFromExtension(fileRecord.original_name || fileRecord.name || 'file')
        : 'application/octet-stream';
    }
    if (contentType.startsWith('text/')) {
      headers.set('Content-Type', contentType.includes('charset=') ? contentType : contentType + '; charset=utf-8');
    } else {
      headers.set('Content-Type', contentType);
    }
    headers.set('Content-Length', object.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 年缓存
    // 修复 Content-Disposition 中文兼容
    function encodeRFC5987ValueChars(str: string) {
      return encodeURIComponent(str)
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
    }
    const filename = fileRecord.original_name || 'file';
    const asciiName = filename.replace(/[^\x20-\x7E]/g, '_'); // 非ASCII转下划线
    // 根据 preview 参数动态设置 Content-Disposition
    const urlObj = new URL(request.url);
    const isPreview = urlObj.searchParams.get('preview') === '1';
    headers.set(
      'Content-Disposition',
      (isPreview
        ? `inline; filename="${asciiName}"; filename*=UTF-8''${encodeRFC5987ValueChars(filename)}`
        : `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeRFC5987ValueChars(filename)}`)
    );
    // 合并 CORS 头
    const cors = corsHeaders(request);
    cors.forEach((v, k) => headers.set(k, v));
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    await logger.error('Get file error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get file', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  fileId: string,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // 获取文件记录
    const fileRecord = await env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(fileId).first();
    if (!fileRecord) {
      throw new ApiError('File not found', 404);
    }
    // 权限检查：只有文件上传者或管理员可以删除
    if (!context.user || (fileRecord.uploaded_by_username !== context.user.username && !hasPermission(context.user.role, 'admin')) ) {
      throw new ApiError('Permission denied', 403);
    }

    const dbService = new DatabaseService(env.DB, env.CACHE);
    
    // 从 R2 删除文件
    const storageService = new StorageService(env.R2_BUCKET);
    const deleted = await storageService.deleteFile(fileRecord.r2_key);
    
    if (!deleted) {
      throw new ApiError('Failed to delete file from storage', 500);
    }

    // 从数据库删除记录
    await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(fileId).run();

    const res = createSuccessResponse({ message: 'File deleted successfully' });
    const headers = corsHeaders(request);
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Delete file error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to delete file', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取存储使用情况
 */
export async function getStorageUsage(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    // getStorageUsage 权限判断
    if (!context.user || !hasPermission(context.user.role, 'collaborator')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const storageService = new StorageService(env.R2_BUCKET);
    
    // 管理员可以查看全部使用情况，其他用户只能查看自己的
    let prefix = '';
    if (!hasPermission(context.user.role, 'admin')) {
      prefix = `uploads/${context.user.username}/`;
    }

    const usage = await storageService.getStorageUsage(prefix);
    
    // 获取数据库中的文件统计
    const dbStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_files,
        SUM(size) as total_size,
        type,
        COUNT(*) as count
      FROM files 
      ${hasPermission(context.user.role, 'admin') ? '' : 'WHERE uploaded_by_username = ?'}
      GROUP BY type
    `).bind(...(hasPermission(context.user.role, 'admin') ? [] : [context.user.username])).all();

    const res = createSuccessResponse({
        storage: usage,
        database: dbStats.results,
      });
    const headers = corsHeaders(request);
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Get storage usage error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get storage usage', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

// CORS 头工具函数（如无全局版本则补充）
function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return headers;
}

// 处理 OPTIONS 预检请求
export async function handleOptions(request: Request): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
