import { ApiError } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getBeijingTimeISOString } from './time';

interface UserUniquenessInput {
  username: string;
  email: string;
  name: string;
}

export async function checkUserUniqueness(env: any, { username, email, name }: UserUniquenessInput) {
  // 检查用户名是否已存在
  const existingUser = await env.CACHE.get(`user:${username}`, 'json');
  if (existingUser) throw new ApiError('用户名已存在', 409);

  // 检查邮箱和昵称（name）是否已存在
  let cursor: string | undefined;
  do {
    const list = await env.CACHE.list({ cursor });
    cursor = list.cursor;
    for (const key of list.keys) {
      if (key.name.startsWith('user:')) {
        const userData = await env.CACHE.get(key.name, 'json');
        if (userData) {
          if (userData.email === email) throw new ApiError('邮箱已存在', 409);
          if (userData.name === name) throw new ApiError('昵称已存在', 409);
        }
      }
    }
  } while (cursor);
}

interface BuildUserInput {
  username: string;
  email: string;
  name: string;
  password: string;
  role?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export function buildUserObject({ username, email, name, password, role = 'user', avatar_url = '', bio = '', location = '', website = '' }: BuildUserInput) {
  return {
    id: uuidv4(),
    username,
    email,
    name,
    password,
    role,
    avatar_url,
    bio,
    location,
    website,
    created_at: getBeijingTimeISOString(),
    updated_at: getBeijingTimeISOString(),
    last_login_at: null,
    is_active: true,
    is_email_verified: false,
  };
}

export async function createAndStoreEmailToken(env: any, username: string, ttl: number = 3600) {
  const token = uuidv4();
  await env.CACHE.put(`email_verify:${token}`, username, { expirationTtl: ttl });
  return token;
}

export function omitSensitiveFields(obj: any, fields: string[]) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const field of fields) delete result[field];
  return result;
}

/**
 * 批量获取所有用户（支持分页、过滤、脱敏）
 * @param env KV 环境对象
 * @param options 可选参数：page, limit, filter, omitFields
 */
export async function listAllUsersFromKV(env: any, options?: {
  page?: number;
  limit?: number;
  filter?: (user: any) => boolean;
  omitFields?: string[];
}): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number; }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const filter = options?.filter;
  const omitFields = options?.omitFields ?? ['password'];
  const users: any[] = [];
  let cursor: string | undefined;
  do {
    const list = await env.CACHE.list({ cursor });
    cursor = list.cursor;
    for (const key of list.keys) {
      if (key.name.startsWith('user:')) {
        const userData = await env.CACHE.get(key.name, 'json');
        if (userData && (!filter || filter(userData))) {
          users.push(omitSensitiveFields(userData, omitFields));
        }
      }
    }
  } while (cursor);
  const total = users.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paged = users.slice((page - 1) * limit, page * limit);
  return {
    items: paged,
    total,
    page,
    limit,
    totalPages
  };
} 