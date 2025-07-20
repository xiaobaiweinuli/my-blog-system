// 使用类型断言来避免类型冲突
export type WorkersD1Database = any
export type WorkersR2Bucket = any
export type WorkersKVNamespace = any
export type WorkersExecutionContext = any
export type WorkersAi = any
export type WorkersScheduledEvent = any

// Cloudflare Workers 环境变量类型
export interface Env {
  // 环境变量
  ENVIRONMENT: string;
  FRONTEND_URL: string;
  SITE_URL?: string;
  NODE_ENV?: string;

  // 敏感信息 (通过 wrangler secret 设置)
  JWT_SECRET: string;

  // CORS 配置
  CORS_ORIGINS?: string;

  // 速率限制配置
  RATE_LIMIT_REQUESTS_PER_MINUTE?: string;

  // 日志配置
  LOG_LEVEL?: string;
  ENABLE_ANALYTICS?: string;
  ENABLE_MONITORING?: string;
  LOG_ENDPOINT?: string;
  ENABLE_REQUEST_LOG?: string;

  // Cloudflare 绑定
  DB: WorkersD1Database;
  STORAGE?: WorkersR2Bucket; // 已废弃，推荐使用 R2_BUCKET
  R2_BUCKET?: WorkersR2Bucket;
  CACHE: WorkersKVNamespace;
  SESSIONS: WorkersKVNamespace;
  RATE_LIMIT_KV?: WorkersKVNamespace;
  SESSION_KV?: WorkersKVNamespace;
  AI: WorkersAi;
  ANALYTICS?: any;
  GITHUB_TOKEN?: string;
  GISCUS_REPO?: string;
  GISCUS_DISCUSSION_NUMBER?: string;
  ADMIN_EMAILS?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  ROOT_DOMAIN?: string;
  WWW_DOMAIN?: string;
  HCAPTCHA_SECRET?: string; // 新增 hCaptcha 密钥
  MAILBOXLAYER_KEY?: string; // 新增邮箱检测密钥
}

// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string; // 加密后的密码
  avatar_url?: string;
  role: 'admin' | 'collaborator' | 'user';
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
  is_email_verified?: boolean;
}

// 文章类型
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  summary?: string;
  cover_image?: string;
  status: string;
  category: string;
  tags: string[]; // 存储时转换为 JSON 字符串
  author_username: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  like_count?: number;
}

// 文件类型
export interface FileRecord {
  id: string;
  name: string;
  original_name: string;
  size: number;
  type: string;
  url: string;
  r2_key: string;
  uploaded_by_username: string;
  uploaded_at?: string;
  is_public?: boolean;
  folder?: string;
  metadata?: string;
}

// 友情链接类型
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar?: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  order_index: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// JWT 载荷类型
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  type?: 'access' | 'refresh';
  jti?: string; // JWT ID for refresh tokens
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 文件上传类型
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  folder?: string;
  isPublic?: boolean;
}

// AI 摘要请求类型
export interface SummaryRequest {
  content: string;
  maxLength?: number;
  language?: string;
}

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 中间件上下文类型
export interface Context {
  env: Env;
  user?: User;
  requestId: string;
  extraHeaders?: HeadersInit;
}

// 路由处理器类型
export type RouteHandler = (
  request: Request,
  env: Env,
  ctx: WorkersExecutionContext,
  context?: Context
) => Promise<Response>;

// 查询选项类型
export interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

// 缓存选项类型
export interface CacheOptions {
  ttl?: number; // 秒
  key?: string;
}
