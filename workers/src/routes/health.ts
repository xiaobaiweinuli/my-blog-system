import { Env, Context, ApiError } from '../types';
import { createSuccessResponse, createErrorResponse } from '../utils';
import { hasPermission } from '../utils/jwt';
import {
  getDatabaseHealth,
  DatabaseMigration,
  DatabaseBackup
} from '../utils/database';
import { getBeijingTimeISOString } from '../utils/time';
import { getLogger } from '../utils/logger';

/**
 * 系统健康检查
 */
export async function getSystemHealth(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    const startTime = Date.now();

    // 基础健康检查
    const health = {
      status: 'healthy',
      timestamp: getBeijingTimeISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV || 'development',
      uptime: Date.now() - startTime,
      checks: {
        database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown' },
        storage: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown' },
        auth: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown' },
      },
    };

    // 数据库健康检查
    try {
      const dbHealth = await getDatabaseHealth(env);
      health.checks.database = {
        status: dbHealth.connected ? 'healthy' : 'unhealthy',
        connected: dbHealth.connected,
        tablesCount: dbHealth.tablesCount,
        lastBackup: dbHealth.lastBackup,
        error: dbHealth.error,
      } as any;
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as any;
    }

    // 存储健康检查
    try {
      if (env.R2_BUCKET) {
        // 尝试写入一个测试文件
        const testKey = `health-check-${Date.now()}`;
        await env.R2_BUCKET.put(testKey, 'test');
        await env.R2_BUCKET.delete(testKey);
        health.checks.storage = { status: 'healthy' };
      } else {
        (health.checks.storage as any) = { status: 'unhealthy', error: 'R2 bucket not configured' };
      }
    } catch (error) {
      health.checks.storage = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as any;
    }

    // 认证健康检查
    try {
      if (env.JWT_SECRET) {
        health.checks.auth = { status: 'healthy' };
      } else {
        (health.checks.auth as any) = { status: 'unhealthy', error: 'JWT secret not configured' };
      }
    } catch (error) {
      health.checks.auth = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as any;
    }

    // 确定整体状态
    const hasUnhealthy = Object.values(health.checks).some(check => check.status === 'unhealthy');
    health.status = hasUnhealthy ? 'unhealthy' : 'healthy';

    const responseStatus = health.status === 'healthy' ? 200 : 503;
    
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(JSON.stringify(health, null, 2), {
      status: responseStatus,
      headers,
    });
  } catch (error) {
    await logger.error('Health check error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Health check failed', 503, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 详细的系统状态（需要管理员权限）
 */
export async function getDetailedSystemStatus(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const migration = new DatabaseMigration(env);
    // const backup = new DatabaseBackup(env); // 暂时未使用

    // 获取详细状态
    const status = {
      system: {
        timestamp: getBeijingTimeISOString(),
        version: '1.0.0',
        environment: env.NODE_ENV || 'development',
        region: (request as any).cf?.colo || 'unknown',
        country: (request as any).cf?.country || 'unknown',
      },
      database: await getDatabaseHealth(env),
      migration: {
        currentVersion: await migration.getCurrentVersion(),
        latestVersion: 3, // 应该从迁移类获取
      },
      storage: await getStorageStatus(env),
      performance: await getPerformanceMetrics(env),
      security: await getSecurityStatus(env),
    };

    return createSuccessResponse(status);
  } catch (error) {
    await logger.error('Detailed status error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to get system status', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 执行数据库迁移
 */
export async function runDatabaseMigration(
  _request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const migration = new DatabaseMigration(env);
    const result = await migration.migrate();

    if (result.success) {
      return createSuccessResponse({
        message: 'Migration completed successfully',
        currentVersion: result.currentVersion,
      });
    } else {
      return createErrorResponse(result.error || 'Migration failed', 500);
    }
  } catch (error) {
    await logger.error('Migration error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(_request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to run migration', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 创建数据库备份
 */
export async function createDatabaseBackup(
  _request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const backup = new DatabaseBackup(env);
    const result = await backup.createBackup();

    if (result.success) {
      return createSuccessResponse({
        message: 'Backup created successfully',
        backupId: result.backupId,
      });
    } else {
      return createErrorResponse(result.error || 'Backup failed', 500);
    }
  } catch (error) {
    console.error('Backup error:', error);
    const headers = corsHeaders(_request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to create backup', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 恢复数据库备份
 */
export async function restoreDatabaseBackup(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const { backupId } = await request.json() as { backupId: string };
    if (!backupId) {
      throw new ApiError('Backup ID is required', 400);
    }

    const backup = new DatabaseBackup(env);
    const result = await backup.restoreBackup(backupId);

    if (result.success) {
      return createSuccessResponse({
        message: 'Backup restored successfully',
        backupId,
      });
    } else {
      return createErrorResponse(result.error || 'Restore failed', 500);
    }
  } catch (error) {
    console.error('Restore error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to restore backup', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取存储状态
 */
async function getStorageStatus(env: Env): Promise<any> {
  try {
    if (!env.R2_BUCKET) {
      return { status: 'not_configured' };
    }

    // 获取存储桶信息
    const objects = await env.R2_BUCKET.list({ limit: 1 });
    
    return {
      status: 'healthy',
      configured: true,
      objectCount: objects.objects.length,
      truncated: objects.truncated,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 获取性能指标
 */
async function getPerformanceMetrics(env: Env): Promise<any> {
  try {
    const startTime = Date.now();
    
    // 测试数据库查询性能
    await env.DB.prepare('SELECT 1').first();
    const dbLatency = Date.now() - startTime;

    return {
      dbLatency,
      timestamp: getBeijingTimeISOString(),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 获取安全状态
 */
async function getSecurityStatus(env: Env): Promise<any> {
  return {
    jwtConfigured: !!env.JWT_SECRET,
    corsConfigured: !!env.CORS_ORIGINS,
    rateLimitConfigured: !!env.RATE_LIMIT_REQUESTS_PER_MINUTE,
  };
}
/**
 * 自定义建表/加字段
 */
export async function customMigrate(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }
    const body = await request.json();
    const { action, table, columns } = body as {
      action: 'createTable' | 'addColumn';
      table: string;
      columns: {
        name: string;
        type: string;
        primary?: boolean;
        notNull?: boolean;
        default?: string;
      }[];
    };
    if (!action || !table || !Array.isArray(columns) || columns.length === 0) {
      throw new ApiError('参数不完整', 400);
    }

    let sql = '';
    if (action === 'createTable') {
      const colDefs = columns.map(col => {
        let def = `"${col.name}" ${col.type}`;
        if (col.primary) def += ' PRIMARY KEY';
        if (col.notNull) def += ' NOT NULL';
        if (col.default) def += ` DEFAULT ${col.default}`;
        return def;
      });
      sql = `CREATE TABLE IF NOT EXISTS "${table}" (${colDefs.join(', ')})`;
    } else if (action === 'addColumn') {
      // 只支持单字段加列
      const col = columns[0];
      let def = `"${col.name}" ${col.type}`;
      if (col.notNull) def += ' NOT NULL';
      if (col.default) def += ` DEFAULT ${col.default}`;
      sql = `ALTER TABLE "${table}" ADD COLUMN ${def}`;
    } else {
      throw new ApiError('未知操作', 400);
    }

    await env.DB.prepare(sql).run();

    return createSuccessResponse({ message: '操作成功', sql });
  } catch (error) {
    console.error('Custom migrate error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof Error ? error : '操作失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 获取所有表和字段
 */
export async function listTables(
  _request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }
    // 查询所有表
    let tables;
    try {
      tables = await env.DB.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      ).all();
    } catch (err) {
      console.error('[listTables] 查询表名出错:', err, (typeof err === 'object' && err && 'stack' in err) ? (err as any).stack : '');
      // 兼容本地D1: 如果是SQLITE_AUTH，兜底返回部分表名
      if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as any).message === 'string' &&
        (err as any).message.includes('SQLITE_AUTH')
      ) {
        return createSuccessResponse([
          { table: 'users', columns: [] },
          { table: 'articles', columns: [] },
          { table: 'categories', columns: [] },
          { table: 'tags', columns: [] }
        ]);
      }
      throw err;
    }
    const result = [];
    for (const t of (tables.results as any[])) {
      const tableName = t.name;
      if (tableName.startsWith('_')) continue; // 跳过 D1 系统表
      let columns;
      try {
        columns = await env.DB.prepare(`PRAGMA table_info("${tableName}")`).all();
      } catch (err) {
        console.error(`[listTables] PRAGMA table_info(${tableName}) 出错:`, err, (typeof err === 'object' && err && 'stack' in err) ? (err as any).stack : '');
        throw err;
      }
      result.push({
        table: tableName,
        columns: (columns.results as any[]).map((c: any) => ({
          name: c.name,
          type: c.type,
          notnull: !!c.notnull,
          pk: !!c.pk,
          dflt_value: c.dflt_value
        }))
      });
    }
    return createSuccessResponse(result);
  } catch (error) {
    console.error('[listTables] 捕获到异常:', error, (typeof error === 'object' && error && 'stack' in error) ? (error as any).stack : '');
    const headers = corsHeaders(_request);
    return createErrorResponse(error instanceof Error ? error.message : '操作失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 删除表或字段（字段级删除通过重建表实现）
 */
export async function dropTableOrColumn(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }
    const { table, column, type } = await request.json() as any;
    if (type === 'table') {
      await env.DB.prepare(`DROP TABLE IF EXISTS "${table}"`).run();
      return createSuccessResponse({ message: `表 ${table} 已删除` });
    } else if (type === 'column') {
      // 字段级删除：重建表
      // 1. 获取原表结构
      const pragma = await env.DB.prepare(`PRAGMA table_info("${table}")`).all();
      const columns = (pragma.results as any[]).filter((c: any) => c.name !== column);
      if (columns.length === (pragma.results as any[]).length) {
        return createErrorResponse('字段不存在', 400);
      }
      // 2. 获取原表所有数据
      const rows = await env.DB.prepare(`SELECT * FROM "${table}"`).all();
      // 3. 生成新表SQL
      const colDefs = columns.map((col: any) => {
        let def = `"${col.name}" ${col.type}`;
        if (col.pk) def += ' PRIMARY KEY';
        if (col.notnull) def += ' NOT NULL';
        if (col.dflt_value !== null && col.dflt_value !== undefined) def += ` DEFAULT ${col.dflt_value}`;
        return def;
      });
      const tmpTable = `tmp_${table}_${Date.now()}`;
      await env.DB.prepare(`CREATE TABLE "${tmpTable}" (${colDefs.join(', ')})`).run();
      // 4. 拷贝数据
      if ((rows.results as any[]).length > 0) {
        const colNames = columns.map((c: any) => `"${c.name}"`).join(', ');
        for (const row of (rows.results as any[])) {
          const values = columns.map((c: any) => row[c.name]);
          const placeholders = columns.map(() => '?').join(', ');
          await env.DB.prepare(`INSERT INTO "${tmpTable}" (${colNames}) VALUES (${placeholders})`).bind(...values).run();
        }
      }
      // 5. 删除原表，重命名新表
      await env.DB.prepare(`DROP TABLE "${table}"`).run();
      await env.DB.prepare(`ALTER TABLE "${tmpTable}" RENAME TO "${table}"`).run();
      return createSuccessResponse({ message: `字段 ${column} 已删除` });
    } else {
      return createErrorResponse('未知操作类型', 400);
    }
  } catch (error) {
    console.error('Drop table/column error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof Error ? error.message : '操作失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 重命名表
 */
export async function renameTable(
  request: Request,
  env: Env,
  _ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  try {
    if (!context.user || !hasPermission(context.user.role, 'admin')) {
      throw new ApiError('Insufficient permissions', 403);
    }
    const { oldName, newName } = await request.json() as any;
    if (!oldName || !newName) {
      return createErrorResponse('参数不完整', 400);
    }
    await env.DB.prepare(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`).run();
    return createSuccessResponse({ message: `表已重命名为 ${newName}` });
  } catch (error) {
    console.error('Rename table error:', error);
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof Error ? error.message : '操作失败', 500, undefined, Object.fromEntries(headers.entries()));
  }
}