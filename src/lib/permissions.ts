/**
 * 用户角色常量
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
  USER: 'user',
  GUEST: 'guest',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/**
 * 权限常量
 */
export const PERMISSIONS = {
  // 文章权限
  ARTICLE_CREATE: 'article:create',
  ARTICLE_READ: 'article:read',
  ARTICLE_UPDATE: 'article:update',
  ARTICLE_DELETE: 'article:delete',
  ARTICLE_PUBLISH: 'article:publish',
  ARTICLE_MODERATE: 'article:moderate',

  // 页面权限
  PAGE_CREATE: 'page:create',
  PAGE_READ: 'page:read',
  PAGE_UPDATE: 'page:update',
  PAGE_DELETE: 'page:delete',
  PAGE_PUBLISH: 'page:publish',

  // 分类和标签权限
  CATEGORY_CREATE: 'category:create',
  CATEGORY_READ: 'category:read',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  TAG_CREATE: 'tag:create',
  TAG_READ: 'tag:read',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',

  // 用户管理权限
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // 文件管理权限
  FILE_UPLOAD: 'file:upload',
  FILE_READ: 'file:read',
  FILE_UPDATE: 'file:update',
  FILE_DELETE: 'file:delete',
  FILE_MANAGE: 'file:manage',

  // 友情链接权限
  FRIEND_LINK_CREATE: 'friend_link:create',
  FRIEND_LINK_READ: 'friend_link:read',
  FRIEND_LINK_UPDATE: 'friend_link:update',
  FRIEND_LINK_DELETE: 'friend_link:delete',

  // 评论权限
  COMMENT_CREATE: 'comment:create',
  COMMENT_READ: 'comment:read',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_MODERATE: 'comment:moderate',

  // 系统设置权限
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_MANAGE: 'settings:manage',

  // 分析统计权限
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_MANAGE: 'analytics:manage',

  // 系统管理权限
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore',
  SYSTEM_HEALTH: 'system:health',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_ADMIN: 'system:admin',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * 角色权限矩阵
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.ADMIN]: [
    // 管理员拥有所有权限
    ...Object.values(PERMISSIONS),
  ],

  [USER_ROLES.COLLABORATOR]: [
    // 协作者权限
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.ARTICLE_UPDATE,
    PERMISSIONS.ARTICLE_DELETE,
    PERMISSIONS.ARTICLE_PUBLISH,

    PERMISSIONS.PAGE_CREATE,
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.PAGE_UPDATE,
    PERMISSIONS.PAGE_DELETE,
    PERMISSIONS.PAGE_PUBLISH,

    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,

    PERMISSIONS.TAG_CREATE,
    PERMISSIONS.TAG_READ,
    PERMISSIONS.TAG_UPDATE,
    PERMISSIONS.TAG_DELETE,

    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.FILE_UPDATE,
    PERMISSIONS.FILE_DELETE,

    PERMISSIONS.FRIEND_LINK_CREATE,
    PERMISSIONS.FRIEND_LINK_READ,
    PERMISSIONS.FRIEND_LINK_UPDATE,
    PERMISSIONS.FRIEND_LINK_DELETE,

    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_MODERATE,

    PERMISSIONS.ANALYTICS_READ,

    PERMISSIONS.SETTINGS_READ,
  ],

  [USER_ROLES.USER]: [
    // 普通用户权限
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.TAG_READ,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.FRIEND_LINK_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
  ],

  [USER_ROLES.GUEST]: [
    // 访客权限
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.TAG_READ,
    PERMISSIONS.FRIEND_LINK_READ,
    PERMISSIONS.COMMENT_READ,
  ],
}

/**
 * 检查用户是否拥有特定权限
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions.includes(permission)
}

/**
 * 检查用户是否拥有多个权限中的任意一个
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * 检查用户是否拥有所有指定权限
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * 获取用户的所有权限
 */
export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * 检查用户是否为管理员
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === USER_ROLES.ADMIN
}

/**
 * 检查用户是否为协作者或更高级别
 */
export function isCollaboratorOrAbove(userRole: UserRole): boolean {
  return userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.COLLABORATOR
}

/**
 * 检查用户是否为注册用户或更高级别
 */
export function isUserOrAbove(userRole: UserRole): boolean {
  return userRole !== USER_ROLES.GUEST
}

/**
 * 权限检查装饰器
 */
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const userRole = (this as any).userRole || args[0]?.userRole
      
      if (!userRole || !hasPermission(userRole, permission)) {
        throw new Error(`Permission denied: ${permission}`)
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * 权限检查中间件工厂
 */
export function createPermissionMiddleware(permission: Permission) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * 资源权限检查
 */
export const ResourcePermissions = {
  /**
   * 检查文章权限
   */
  article: {
    canCreate: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.ARTICLE_CREATE),
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.ARTICLE_READ),
    canUpdate: (userRole: UserRole, isOwner: boolean = false) => 
      hasPermission(userRole, PERMISSIONS.ARTICLE_UPDATE) || isOwner,
    canDelete: (userRole: UserRole, isOwner: boolean = false) => 
      hasPermission(userRole, PERMISSIONS.ARTICLE_DELETE) || (isOwner && isCollaboratorOrAbove(userRole)),
    canPublish: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.ARTICLE_PUBLISH),
    canModerate: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.ARTICLE_MODERATE),
  },

  /**
   * 检查页面权限
   */
  page: {
    canCreate: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.PAGE_CREATE),
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.PAGE_READ),
    canUpdate: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.PAGE_UPDATE),
    canDelete: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.PAGE_DELETE),
    canPublish: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.PAGE_PUBLISH),
  },

  /**
   * 检查用户权限
   */
  user: {
    canCreate: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.USER_CREATE),
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.USER_READ),
    canUpdate: (userRole: UserRole, isSelf: boolean = false) => 
      hasPermission(userRole, PERMISSIONS.USER_UPDATE) || isSelf,
    canDelete: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.USER_DELETE),
    canManageRoles: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.USER_MANAGE_ROLES),
  },

  /**
   * 检查文件权限
   */
  file: {
    canUpload: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.FILE_UPLOAD),
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.FILE_READ),
    canUpdate: (userRole: UserRole, isOwner: boolean = false) => 
      hasPermission(userRole, PERMISSIONS.FILE_UPDATE) || isOwner,
    canDelete: (userRole: UserRole, isOwner: boolean = false) => 
      hasPermission(userRole, PERMISSIONS.FILE_DELETE) || isOwner,
    canManage: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.FILE_MANAGE),
  },

  /**
   * 检查系统权限
   */
  system: {
    canViewHealth: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.SYSTEM_HEALTH),
    canBackup: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.SYSTEM_BACKUP),
    canRestore: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.SYSTEM_RESTORE),
    canViewLogs: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.SYSTEM_LOGS),
    canAdmin: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.SYSTEM_ADMIN),
  },
}

/**
 * 权限验证错误
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public permission: Permission,
    public userRole: UserRole
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 权限验证工具
 */
export const PermissionUtils = {
  /**
   * 验证权限并抛出错误
   */
  requirePermission: (userRole: UserRole, permission: Permission) => {
    if (!hasPermission(userRole, permission)) {
      throw new PermissionError(
        `Permission denied: ${permission}`,
        permission,
        userRole
      )
    }
  },

  /**
   * 验证多个权限中的任意一个
   */
  requireAnyPermission: (userRole: UserRole, permissions: Permission[]) => {
    if (!hasAnyPermission(userRole, permissions)) {
      throw new PermissionError(
        `Permission denied: requires one of [${permissions.join(', ')}]`,
        permissions[0],
        userRole
      )
    }
  },

  /**
   * 验证所有权限
   */
  requireAllPermissions: (userRole: UserRole, permissions: Permission[]) => {
    if (!hasAllPermissions(userRole, permissions)) {
      throw new PermissionError(
        `Permission denied: requires all of [${permissions.join(', ')}]`,
        permissions[0],
        userRole
      )
    }
  },

  /**
   * 安全地检查权限（不抛出错误）
   */
  checkPermission: (userRole: UserRole, permission: Permission) => {
    try {
      return hasPermission(userRole, permission)
    } catch {
      return false
    }
  },
}
