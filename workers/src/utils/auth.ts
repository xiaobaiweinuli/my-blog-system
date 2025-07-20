import { ApiError } from '../types';
export function requireAdmin(context: any) {
  if (!context.user || context.user.role !== 'admin') {
    throw new ApiError('权限不足', 403);
  }
} 