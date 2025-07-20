import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse } from '../utils';
import { hasPermission } from '../utils/jwt';
import { getPerformanceMonitor } from '../utils/monitoring';
import { getLogger } from '../utils/logger';
import { insertAlert } from '../services/alert';

/**
 * 获取性能指标
 */
export async function getPerformanceMetrics(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const url = new URL(request.url);
    const metricName = url.searchParams.get('metric');
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '300000');

    const monitor = getPerformanceMonitor(env);

    if (metricName) {
      // 获取特定指标的统计信息
      const stats = monitor.getMetricStats(metricName, timeWindow);
      if (!stats) {
        throw new ApiError('Metric not found or no data available', 404);
      }

      const res = createSuccessResponse({
        metric: metricName,
        timeWindow,
        stats,
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    } else {
      // 获取所有指标名称
      const metricNames = monitor.getMetricNames();
      const metrics: Record<string, any> = {};

      for (const name of metricNames) {
        const stats = monitor.getMetricStats(name, timeWindow);
        if (stats) {
          metrics[name] = stats;
        }
      }

      const res = createSuccessResponse({
        timeWindow,
        metrics,
        metricNames,
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
  } catch (error) {
    await logger.error('Get performance metrics error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get performance metrics', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取健康检查状态
 */
export async function getHealthStatus(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const monitor = getPerformanceMonitor(env);
    const healthCheck = await monitor.performHealthCheck();

    const statusCode = healthCheck.status === 'healthy' ? 200 :
                      healthCheck.status === 'degraded' ? 200 : 503;

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(JSON.stringify(healthCheck, null, 2), {
      status: statusCode,
      headers,
    });
  } catch (error) {
    console.error('Health check error:', error);
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }), {
      status: 503,
      headers,
    });
  }
}

/**
 * 获取系统日志
 */
export async function getSystemLogs(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const start = Date.now();
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const url = new URL(request.url);
    const level = url.searchParams.get('level');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const startTime = url.searchParams.get('startTime');
    const endTime = url.searchParams.get('endTime');

    let sql = `SELECT * FROM system_logs WHERE 1=1`;
    const params: any[] = [];
    if (level) {
      sql += ` AND level = ?`;
      params.push(level);
    }
    if (startTime) {
      sql += ` AND timestamp >= ?`;
      params.push(Number(startTime));
    }
    if (endTime) {
      sql += ` AND timestamp <= ?`;
      params.push(Number(endTime));
    }
    sql += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await env.DB.prepare(sql).bind(...params).all();

    let countSql = `SELECT COUNT(*) as total FROM system_logs WHERE 1=1`;
    const countParams: any[] = [];
    if (level) {
      countSql += ` AND level = ?`;
      countParams.push(level);
    }
    if (startTime) {
      countSql += ` AND timestamp >= ?`;
      countParams.push(Number(startTime));
    }
    if (endTime) {
      countSql += ` AND timestamp <= ?`;
      countParams.push(Number(endTime));
    }
    const countRes = await env.DB.prepare(countSql).bind(...countParams).first();
    const total = countRes?.total || 0;

    const logs = results.map((row: any) => ({
      ...row,
      context: row.context ? JSON.parse(row.context) : undefined,
    }));

    const res = createSuccessResponse({
      logs,
      pagination: { limit, offset, total },
      filters: { level, startTime, endTime },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await insertAlert(env, {
      name: 'get_system_logs_error',
      severity: 'high',
      message: error instanceof Error ? error.message : String(error),
      context: { error }
    });
    console.error('Get system logs error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get system logs', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取实时指标
 */
export async function getRealTimeMetrics(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const monitor = getPerformanceMonitor(env);
    
    // 获取最近5分钟的关键指标
    const timeWindow = 300000; // 5分钟
    const metrics = {
      responseTime: monitor.getMetricStats('response_time', timeWindow),
      requestCount: monitor.getMetricStats('request_count', timeWindow),
      errorRate: monitor.getMetricStats('error_rate', timeWindow),
      dbQueryTime: monitor.getMetricStats('db_query_time', timeWindow),
    };

    // 获取健康状态
    const health = await monitor.performHealthCheck();

    const res = createSuccessResponse({
      timestamp: Date.now(),
      health: health.status,
      metrics,
      alerts: [], // 这里可以添加活跃告警
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    console.error('Get real-time metrics error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get real-time metrics', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取告警历史
 */
export async function getAlertHistory(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const start = Date.now();
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const url = new URL(request.url);
    const severity = url.searchParams.get('severity');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let sql = `SELECT * FROM alerts WHERE 1=1`;
    const params: any[] = [];
    if (severity) {
      sql += ` AND severity = ?`;
      params.push(severity);
    }
    sql += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await env.DB.prepare(sql).bind(...params).all();

    let countSql = `SELECT COUNT(*) as total FROM alerts WHERE 1=1`;
    const countParams: any[] = [];
    if (severity) {
      countSql += ` AND severity = ?`;
      countParams.push(severity);
    }
    const countRes = await env.DB.prepare(countSql).bind(...countParams).first();
    const total = countRes?.total || 0;

    const duration = Date.now() - start;
    if (duration > 5000) {
      await insertAlert(env, {
        name: 'slow_query_alert_history',
        severity: 'medium',
        message: `getAlertHistory 查询耗时过长: ${duration}ms`,
        metric_name: 'query_time',
        metric_value: duration,
        metric_unit: 'ms',
        context: { severity, limit, offset }
      });
    }

    const res = createSuccessResponse({
      alerts: results,
      pagination: { limit, offset, total },
      filters: { severity },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await insertAlert(env, {
      name: 'get_alert_history_error',
      severity: 'high',
      message: error instanceof Error ? error.message : String(error),
      context: { error }
    });
    console.error('Get alert history error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get alert history', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取系统统计信息
 */
export async function getSystemStats(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const monitor = getPerformanceMonitor(env);
    
    // 获取各种时间窗口的统计
    const timeWindows = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
    };

    const stats: Record<string, any> = {};

    for (const [period, window] of Object.entries(timeWindows)) {
      stats[period] = {
        requests: monitor.getMetricStats('request_count', window),
        responseTime: monitor.getMetricStats('response_time', window),
        errorRate: monitor.getMetricStats('error_rate', window),
        dbQueries: monitor.getMetricStats('db_query_count', window),
      };
    }

    // 获取当前健康状态
    const health = await monitor.performHealthCheck();

    const res = createSuccessResponse({
      timestamp: Date.now(),
      health,
      stats,
      uptime: Date.now(), // 这里应该是实际的运行时间
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    console.error('Get system stats error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get system stats', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 清理旧指标数据
 */
export async function cleanupMetrics(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const body = await request.json() as any;
    const maxAge = typeof body.maxAge === 'number' ? body.maxAge : parseInt(body.maxAge) || 3600000;
    const maxAgeMs = maxAge;

    const monitor = getPerformanceMonitor(env);
    monitor.cleanupOldMetrics(maxAgeMs);

    const logger = getLogger(env);
    await logger.info('Metrics cleanup completed', {
      maxAge: maxAgeMs,
      userId: context.user.username,
    });

    const res = createSuccessResponse({
      message: 'Metrics cleanup completed',
      maxAge: maxAgeMs,
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    console.error('Cleanup metrics error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to cleanup metrics', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 导出指标数据
 */
export async function exportMetrics(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '86400000'); // 24小时

    const monitor = getPerformanceMonitor(env);
    const metricNames = monitor.getMetricNames();
    
    const exportData: Record<string, any> = {
      timestamp: new Date().toISOString(),
      timeWindow,
      metrics: {},
    };

    for (const name of metricNames) {
      const stats = monitor.getMetricStats(name, timeWindow);
      if (stats) {
        exportData.metrics[name] = stats;
      }
    }

    if (format === 'csv') {
      // 生成CSV格式
      let csv = 'metric,count,avg,min,max,p95,p99\n';
      for (const [name, stats] of Object.entries(exportData.metrics)) {
        const s = stats as any;
        csv += `${name},${s.count},${s.avg},${s.min},${s.max},${s.p95},${s.p99}\n`;
      }

      const res = new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="metrics-${Date.now()}.csv"`,
        },
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    } else {
      // 默认JSON格式
      const res = new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="metrics-${Date.now()}.json"`,
        },
      });
      const headers = new Headers(res.headers);
      const cors = corsHeaders(request);
      cors.forEach((v: string, k: string) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
  } catch (error) {
    console.error('Export metrics error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to export metrics', 500, undefined, Object.fromEntries(headers.entries()));
  }
}
