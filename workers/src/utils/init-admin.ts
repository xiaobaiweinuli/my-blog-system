import { generateId, hashString } from './index';

/**
 * 管理员账号请手动在 KV 控制台维护，格式示例：
 * {"username":"admin","password":"123456","role":"admin","is_active":true}
 */
export async function initAdminUser(env: any) {
  // 已移除自动写入管理员逻辑，请手动在 KV 控制台维护管理员账号。
}