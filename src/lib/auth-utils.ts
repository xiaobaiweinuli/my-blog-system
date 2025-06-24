import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createError } from './error';
import { User } from 'next-auth';

/**
 * Validate the user session and check if the user is authenticated
 * @throws {AppError} If the user is not authenticated
 */
export function validateUserSession(session: any): asserts session is { user: User } {
  if (!session?.user) {
    throw createError('UNAUTHORIZED', 'You must be logged in to access this resource');
  }
}

/**
 * Check if the current user has admin role
 * @param session The current session object
 * @returns {boolean} True if the user is an admin
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === 'admin';
}

/**
 * Check if the current user has collaborator or admin role
 * @param session The current session object
 * @returns {boolean} True if the user is a collaborator or admin
 */
export function isCollaboratorOrAdmin(session: any): boolean {
  return ['collaborator', 'admin'].includes(session?.user?.role || '');
}

/**
 * Get the current user session
 * @returns The current user session
 */
export async function getCurrentUserSession() {
  return getServerSession(authOptions);
}

/**
 * Require admin role for the current user
 * @throws {AppError} If the user is not an admin
 */
export async function requireAdmin() {
  const session = await getCurrentUserSession();
  validateUserSession(session);
  
  if (!isAdmin(session)) {
    throw createError('FORBIDDEN', 'You do not have permission to access this resource');
  }
  
  return session;
}

/**
 * Require collaborator or admin role for the current user
 * @throws {AppError} If the user is not a collaborator or admin
 */
export async function requireCollaboratorOrAdmin() {
  const session = await getCurrentUserSession();
  validateUserSession(session);
  
  if (!isCollaboratorOrAdmin(session)) {
    throw createError('FORBIDDEN', 'You do not have permission to access this resource');
  }
  
  return session;
}
