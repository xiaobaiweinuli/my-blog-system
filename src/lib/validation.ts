import { z } from 'zod'

/**
 * 通用验证规则
 */
export const commonValidation = {
  // 基础字符串验证
  requiredString: (minLength = 1, maxLength = 255) =>
    z.string()
      .min(minLength, `最少需要 ${minLength} 个字符`)
      .max(maxLength, `最多允许 ${maxLength} 个字符`)
      .trim(),

  // 可选字符串验证
  optionalString: (maxLength = 255) =>
    z.string()
      .max(maxLength, `最多允许 ${maxLength} 个字符`)
      .trim()
      .optional(),

  // 邮箱验证
  email: z.string()
    .email('请输入有效的邮箱地址')
    .max(255, '邮箱地址过长'),

  // URL 验证
  url: z.string()
    .url('请输入有效的 URL')
    .max(2048, 'URL 过长'),

  // 可选 URL 验证
  optionalUrl: z.string()
    .url('请输入有效的 URL')
    .max(2048, 'URL 过长')
    .optional()
    .or(z.literal('')),

  // Slug 验证（用于 URL 路径）
  slug: z.string()
    .min(1, 'Slug 不能为空')
    .max(100, 'Slug 过长')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能包含小写字母、数字和连字符'),

  // 密码验证
  password: z.string()
    .min(8, '密码至少需要 8 个字符')
    .max(128, '密码过长')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),

  // 颜色验证（十六进制）
  hexColor: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, '请输入有效的十六进制颜色值'),

  // 日期验证
  date: z.string()
    .datetime('请输入有效的日期时间格式'),

  // 数字验证
  positiveNumber: z.number()
    .positive('必须是正数'),

  // 整数验证
  positiveInteger: z.number()
    .int('必须是整数')
    .positive('必须是正数'),

  // 文件大小验证（字节）
  fileSize: (maxSizeInMB: number) =>
    z.number()
      .max(maxSizeInMB * 1024 * 1024, `文件大小不能超过 ${maxSizeInMB}MB`),

  // 数组验证
  nonEmptyArray: <T>(itemSchema: z.ZodSchema<T>) =>
    z.array(itemSchema)
      .min(1, '至少需要一个项目'),

  // 枚举验证
  enum: <T extends readonly [string, ...string[]]>(values: T) => ({
    parse: (value: any) => {
      if (values.includes(value)) {
        return value
      }
      throw new Error(`值必须是以下之一: ${values.join(', ')}`)
    },
    optional: () => ({
      parse: (value: any) => {
        if (value === undefined || value === null) {
          return undefined
        }
        if (values.includes(value)) {
          return value
        }
        throw new Error(`值必须是以下之一: ${values.join(', ')}`)
      }
    })
  }),
}

/**
 * 用户相关验证
 */
export const userValidation = {
  // 用户注册
  register: z.object({
    username: commonValidation.requiredString(3, 50)
      .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
    email: commonValidation.email,
    password: commonValidation.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: '密码确认不匹配',
    path: ['confirmPassword'],
  }),

  // 用户登录
  login: z.object({
    email: commonValidation.email,
    password: z.string().min(1, '请输入密码'),
  }),

  // 用户资料更新
  updateProfile: z.object({
    username: commonValidation.requiredString(3, 50)
      .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
    email: commonValidation.email,
    bio: commonValidation.optionalString(500),
    website: commonValidation.optionalUrl,
    avatar: commonValidation.optionalUrl,
  }),

  // 密码重置
  resetPassword: z.object({
    token: commonValidation.requiredString(),
    password: commonValidation.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: '密码确认不匹配',
    path: ['confirmPassword'],
  }),
}

/**
 * 文章相关验证
 */
export const articleValidation = {
  // 创建/更新文章
  article: z.object({
    title: commonValidation.requiredString(1, 200),
    slug: commonValidation.slug,
    excerpt: commonValidation.optionalString(500),
    content: commonValidation.requiredString(1, 50000),
    category: commonValidation.requiredString(1, 50),
    tags: z.array(z.string().min(1).max(50)).max(10, '最多允许 10 个标签'),
    status: commonValidation.enum(['draft', 'published', 'private']),
    featured_image: commonValidation.optionalUrl,
    published_at: z.string().datetime().optional(),
    meta_title: commonValidation.optionalString(60),
    meta_description: commonValidation.optionalString(160),
  }),

  // 文章搜索
  search: z.object({
    q: commonValidation.optionalString(100),
    category: commonValidation.optionalString(50),
    tag: commonValidation.optionalString(50),
    status: commonValidation.enum(['draft', 'published', 'private']).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
}

/**
 * 分类和标签验证
 */
export const taxonomyValidation = {
  // 分类
  category: z.object({
    name: commonValidation.requiredString(1, 50),
    slug: commonValidation.slug,
    description: commonValidation.optionalString(200),
    color: commonValidation.hexColor.optional(),
    parent_id: z.string().uuid().optional(),
  }),

  // 标签
  tag: z.object({
    name: commonValidation.requiredString(1, 50),
    slug: commonValidation.slug,
    description: commonValidation.optionalString(200),
    color: commonValidation.hexColor.optional(),
  }),
}

/**
 * 页面验证
 */
export const pageValidation = {
  page: z.object({
    title: commonValidation.requiredString(1, 200),
    slug: commonValidation.slug,
    content: commonValidation.requiredString(1, 50000),
    status: commonValidation.enum(['draft', 'published', 'private']),
    template: commonValidation.optionalString(50),
    is_in_menu: z.boolean().default(false),
    order_index: z.number().int().min(0).default(0),
    parent_id: z.string().uuid().optional(),
    meta_title: commonValidation.optionalString(60),
    meta_description: commonValidation.optionalString(160),
  }),
}

/**
 * 友情链接验证
 */
export const friendLinkValidation = {
  friendLink: z.object({
    name: commonValidation.requiredString(1, 100),
    url: commonValidation.url,
    description: commonValidation.optionalString(200),
    avatar: commonValidation.optionalUrl,
    category: commonValidation.enum(['friend', 'tech', 'blog', 'other']),
    contact_email: commonValidation.email.optional(),
    is_featured: z.boolean().default(false),
    order_index: z.number().int().min(0).default(0),
  }),
}

/**
 * 文件上传验证
 */
export const fileValidation = {
  upload: z.object({
    file: z.instanceof(File)
      .refine((file) => file.size <= 10 * 1024 * 1024, '文件大小不能超过 10MB')
      .refine(
        (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type),
        '不支持的文件类型'
      ),
    alt: commonValidation.optionalString(200),
    caption: commonValidation.optionalString(500),
  }),

  // 图片特定验证
  image: z.object({
    file: z.instanceof(File)
      .refine((file) => file.size <= 5 * 1024 * 1024, '图片大小不能超过 5MB')
      .refine(
        (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
        '只支持 JPEG、PNG、WebP 和 GIF 格式'
      ),
    alt: commonValidation.requiredString(1, 200),
    caption: commonValidation.optionalString(500),
  }),
}

/**
 * 设置验证
 */
export const settingsValidation = {
  site: z.object({
    site_name: commonValidation.requiredString(1, 100),
    site_description: commonValidation.requiredString(1, 500),
    site_url: commonValidation.url,
    site_logo: commonValidation.optionalUrl,
    site_favicon: commonValidation.optionalUrl,
    default_language: commonValidation.enum(['zh']), // 固定为中文
    timezone: commonValidation.requiredString(1, 50),
  }),

  seo: z.object({
    meta_title: commonValidation.optionalString(60),
    meta_description: commonValidation.optionalString(160),
    meta_keywords: commonValidation.optionalString(200),
    og_image: commonValidation.optionalUrl,
    twitter_card: commonValidation.enum(['summary', 'summary_large_image']).optional(),
    google_analytics_id: commonValidation.optionalString(20),
    google_search_console: commonValidation.optionalString(100),
  }),
}

/**
 * 验证工具函数
 */
export const validationUtils = {
  /**
   * 安全解析数据
   */
  safeParse: <T>(schema: any, data: unknown) => {
    try {
      const result = schema.parse(data)
      return { success: true, data: result, errors: null }
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [{
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Validation failed',
        }]
      }
    }
  },

  /**
   * 格式化验证错误
   */
  formatErrors: (errors: any) => {
    if (Array.isArray(errors)) {
      return errors.reduce((acc: Record<string, string>, err: any) => {
        const field = err.field || 'unknown'
        acc[field] = err.message || 'Validation failed'
        return acc
      }, {})
    }
    return { unknown: 'Validation failed' }
  },

  /**
   * 验证并抛出错误
   */
  validateOrThrow: <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = validationUtils.formatErrors(error)
        throw new Error(`验证失败: ${JSON.stringify(formattedErrors)}`)
      }
      throw error
    }
  },

  /**
   * 创建表单验证器
   */
  createFormValidator: <T>(schema: z.ZodSchema<T>) => {
    return (data: unknown) => {
      const result = schema.safeParse(data)
      if (result.success) {
        return { isValid: true, data: result.data, errors: {} }
      } else {
        return {
          isValid: false,
          data: null,
          errors: validationUtils.formatErrors(result.error)
        }
      }
    }
  },
}
