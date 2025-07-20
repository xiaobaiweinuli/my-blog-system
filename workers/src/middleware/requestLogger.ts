import { Env, Context } from '../types';
import { getLogger, LogLevel } from '../utils/logger';

// 跳过日志采集的接口路径（静态、健康、监控等）
const SKIP_PATHS: (string | RegExp)[] = [
  '/favicon.ico', '/robots.txt', '/sitemap.xml',
  /^\/sitemap-.*\.xml$/,
  '/api/monitoring/health', '/api/monitoring/performance', '/api/monitoring/realtime',
  '/api/monitoring/stats', '/api/monitoring/logs', '/api/monitoring/alerts',
  '/api/monitoring/cleanup', '/api/monitoring/export',
  '/api/health', '/api/health/detailed', '/api/health/list-tables',
  '/api/health/backup', '/api/health/restore', '/api/health/custom-migrate',
  '/api/health/drop', '/api/health/rename-table',
  '/api/rss', '/api/atom', '/api/json-feed'
];

// 只记录这些方法，GET 只记录敏感接口
const LOG_METHODS = ['POST', 'PUT', 'DELETE'];
const LOG_FREQ_LIMIT = 10; // 每分钟同一IP+路径+方法最多10条
const logFreqMap = new Map<string, { count: number, time: number }>();

function isSensitiveGet(path: string) {
  // 只记录敏感GET接口
  return [
    /^\/api\/admin\//,
    /^\/api\/users\//,
    /^\/api\/files\//,
    /^\/api\/settings\//,
    /^\/api\/articles\//,
    /^\/api\/giscus\//,
    /^\/api\/analytics\//,
    /^\/api\/friend-links\//,
    /^\/api\/pages\//,
    /^\/api\/categories\//,
    /^\/api\/tags\//
  ].some(re => re.test(path));
}

export async function requestLogger(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  next: () => Promise<Response>
): Promise<Response> {
  if (env.ENABLE_REQUEST_LOG === 'false') {
    return await next();
  }
  const urlObj = new URL(request.url);
  const path = urlObj.pathname;
  const method = request.method.toUpperCase();

  // 跳过无需采集的接口
  if (
    SKIP_PATHS.some(p => typeof p === 'string' ? p === path : p.test(path)) ||
    (method === 'GET' && !isSensitiveGet(path))
  ) {
    return await next();
  }

  // 日志频率限制
  const ip = request.headers.get('CF-Connecting-IP') || context.requestId;
  const freqKey = `${ip}:${method}:${path}`;
  const now = Date.now();
  const freq = logFreqMap.get(freqKey) || { count: 0, time: now };
  if (now - freq.time < 60000) {
    if (freq.count >= LOG_FREQ_LIMIT) return await next();
    freq.count++;
  } else {
    freq.count = 1;
    freq.time = now;
  }
  logFreqMap.set(freqKey, freq);

  // 只记录必要字段
  const start = Date.now();
  let response: Response | undefined = undefined;
  let error: any = null;
  try {
    response = await next();
    return response;
  } catch (e) {
    error = e;
    throw e;
  } finally {
    const duration = Date.now() - start;
    const logger = getLogger(env);
    const logData = {
      method,
      url: path,
      status: response ? response.status : 500,
      duration,
      user_id: context.user?.username,
      request_id: context.requestId,
      userAgent: request.headers.get('User-Agent'),
      referer: request.headers.get('Referer'),
      component: 'http',
      error: error ? (error instanceof Error ? error.message : String(error)) : undefined
    };
    if (error) {
      await logger.log(LogLevel.ERROR, '请求异常', logData);
    } else {
      await logger.info('请求完成', logData);
    }
  }
} 