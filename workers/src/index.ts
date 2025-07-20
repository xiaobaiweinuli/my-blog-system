import { Env, Context } from './types';
import { handleOptions, createErrorResponse } from './utils';
import { authMiddleware, loggingMiddleware, corsMiddleware, rateLimitMiddleware } from './middleware/auth';
import { initAdminUser } from './utils/init-admin';
import { requestLogger } from './middleware/requestLogger';

// 导入路由处理器
import {
  login,
  verifyToken,
  refreshToken,
  logout,
  getCurrentUser,
  updateUser,
  register,
  verifyEmail
} from './routes/auth';

import {
  uploadFile,
  getFiles,
  getFile,
  deleteFile,
  getStorageUsage,
} from './routes/files';

import {
  generateSummary,
  generateTags,
  analyzeContent,
  translateText,
} from './routes/ai';

import {
  searchArticles,
  advancedSearch,
} from './routes/search';

import {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
} from './routes/articles';

import {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  getUserStats,
  deleteUser,
  createUser,
  getPublicUserByUsername,
  getAllPublicUsers,
  sendVerificationEmail,
  resendVerificationEmail, // 新增导入
} from './routes/users';

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBySlug,
} from './routes/categories';

import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getTagBySlug,
  updateTagsOrder,
} from './routes/tags';

import {
  getPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
} from './routes/pages';

import {
  getFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
  updateFriendLinksStatus,
  approveFriendLink,
} from './routes/friend-links';

import {
  generateRSSFeed,
  generateAtomFeed,
  generateJSONFeed,
} from './routes/rss';

import {
  recordArticleView,
  getArticleStats,
  getDashboardStats,
  getPopularTags,
  getGiscusStats,
  deleteGiscusComment,
  getGiscusAllTitles
} from './routes/analytics';

import {
  generateSitemapIndex,
  generatePagesSitemap,
  generateArticlesSitemap,
  generateCategoriesSitemap,
  generateTagsSitemap,
  getSitemapStats,
  generateSitemapFiles,
  getSitemapFiles,
  getSitemapConfig,
  updateSitemapConfig,
  generateMainSitemap
} from './routes/sitemap';

import {
  getSystemHealth,
  getDetailedSystemStatus,
  runDatabaseMigration,
  createDatabaseBackup,
  restoreDatabaseBackup,
  customMigrate,
  renameTable,
  dropTableOrColumn,
  listTables
} from './routes/health';

import {
  getPerformanceMetrics,
  getHealthStatus,
  getSystemLogs,
  getRealTimeMetrics,
  getAlertHistory,
  getSystemStats,
  cleanupMetrics,
  exportMetrics,
} from './routes/monitoring';

import { getRecentActivity } from './routes/activity';
import { checkSlug } from './routes/articles';
import {
  getAllSettings,
  getSetting,
  putSetting,
  deleteSetting,
  getPublicSettings
} from './routes/settings';

interface ApiConfigParam {
  name: string;
  type: string;
  required: boolean;
  example?: any;
  description?: string;
  desc?: string;
  enum?: { value: string; label: string; desc: string }[];
}
interface ApiConfig {
  group: string;
  name: string;
  path: string;
  method: string;
  params: ApiConfigParam[];
  desc: string;
  responseFields?: { name: string; desc: string }[];
}
const apiConfigJson: ApiConfig[] = [
    {
      "group": "认证",
      "name": "用户登录",
      "path": "/api/auth/login",
      "method": "POST",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" },
        { "name": "password", "type": "string", "required": true, "desc": "密码" }
      ],
      "desc": "用户登录，返回 token",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.token", desc: "JWT Token" },
        { name: "data.refreshToken", desc: "刷新Token" },
        { name: "data.user", desc: "用户信息对象" },
        { name: "data.user.username", desc: "用户名" },
        { name: "data.user.role", desc: "用户角色" },
        { name: "data.user.email", desc: "邮箱" },
        { name: "data.user.name", desc: "姓名" }
      ]
    },
    {
      group: "认证",
      name: "用户注册",
      path: "/api/auth/register",
      method: "POST",
      params: [
        { name: "username", type: "string", required: true, desc: "用户名" },
        { name: "email", type: "string", required: true, desc: "邮箱" },
        { name: "name", type: "string", required: true, desc: "姓名/昵称" },
        { name: "password", type: "string", required: true, desc: "密码" }
      ],
      desc: "开放注册接口，注册新用户并发送邮箱验证邮件",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "用户ID" },
        { name: "data.username", desc: "用户名" },
        { name: "data.email", desc: "邮箱" },
        { name: "data.name", desc: "姓名/昵称" },
        { name: "data.role", desc: "用户角色" },
        { name: "data.avatar_url", desc: "头像链接" },
        { name: "data.bio", desc: "个人简介" },
        { name: "data.location", desc: "位置" },
        { name: "data.website", desc: "个人网站" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" },
        { name: "data.is_active", desc: "是否激活" },
        { name: "data.is_email_verified", desc: "邮箱是否已验证" }
      ]
    },
    {
      "group": "认证",
      "name": "获取当前用户",
      "path": "/api/auth/me",
      "method": "GET",
      "params": [],
      "desc": "获取当前登录用户信息",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.user.username", desc: "用户名" },
        { name: "data.user.role", desc: "用户角色" },
        { name: "data.user.email", desc: "邮箱" },
        { name: "data.user.name", desc: "姓名" }
      ]
    },
    {
      "group": "认证",
      "name": "刷新 Token",
      "path": "/api/auth/refresh",
      "method": "POST",
      "params": [
        { "name": "refreshToken", "type": "string", "required": true, "desc": "刷新令牌" }
      ],
      "desc": "刷新 JWT Token",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.token", desc: "新的JWT Token" },
        { name: "data.user.username", desc: "用户名" },
        { name: "data.user.role", desc: "用户角色" }
      ]
    },
    {
      "group": "认证",
      "name": "登出",
      "path": "/api/auth/logout",
      "method": "POST",
      "params": [],
      "desc": "登出当前用户（需携带 Authorization header）",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "文章",
      "name": "获取文章列表",
      "path": "/api/articles",
      "method": "GET",
      "params": [
        { "name": "page", "type": "number", "required": false, "desc": "页码" },
        { "name": "limit", "type": "number", "required": false, "desc": "每页数量" },
        { "name": "status", "type": "string", "required": false, "desc": "文章状态" },
        { "name": "category", "type": "string", "required": false, "desc": "分类" },
        { "name": "tags", "type": "string", "required": false, "desc": "标签，多个用英文逗号分隔，如 tags=测试,分组" },
        { "name": "tags_mode", "type": "string", "required": false, "desc": "标签筛选模式，any(默认，包含任一标签)，all(包含全部标签)" },
        { "name": "author_username", "type": "string", "required": false, "desc": "作者ID" }
      ],
      desc: "分页获取文章列表",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.items", desc: "文章列表" },
        { name: "data.items[].id", desc: "文章ID" },
        { name: "data.items[].title", desc: "文章标题" },
        { name: "data.items[].content", desc: "正文内容" },
        { name: "data.items[].author", desc: "作者信息" },
        { name: "data.items[].category", desc: "分类" },
        { name: "data.items[].tags", desc: "标签列表" },
        { name: "data.items[].status", desc: "文章状态" },
        { name: "data.items[].created_at", desc: "创建时间" },
        { name: "data.items[].updated_at", desc: "更新时间" },
        { name: "data.pagination.page", desc: "当前页码" },
        { name: "data.pagination.limit", desc: "每页数量" },
        { name: "data.pagination.total", desc: "总条数" },
        { name: "data.pagination.totalPages", desc: "总页数" }
      ]
    },
    {
      "group": "文章",
      "name": "根据 slug 获取文章",
      "path": "/api/articles/{slug}",
      "method": "GET",
      "params": [
        { "name": "slug", "type": "string", "required": true, "desc": "文章唯一标识" }
      ],
      "desc": "根据 slug 获取文章详情",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "文章ID" },
        { name: "data.title", desc: "文章标题" },
        { name: "data.content", desc: "正文内容" },
        { name: "data.author", desc: "作者信息" },
        { name: "data.category", desc: "分类" },
        { name: "data.tags", desc: "标签列表" },
        { name: "data.status", desc: "文章状态" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "文章",
      "name": "检测 slug 是否已存在",
      "path": "/api/articles/check-slug",
      "method": "GET",
      "params": [
        { "name": "slug", "type": "string", "required": true, "desc": "唯一标识（slug）" }
      ],
      "desc": "检测 slug 是否已存在，前端可用于实时校验 slug 唯一性",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "data.exists", "desc": "slug 是否已存在（true/false）" }
      ]
    },
    {
      "group": "文章",
      "name": "创建文章",
      "path": "/api/articles",
      "method": "POST",
      "params": [
        { "name": "title", "type": "string", "required": true, "desc": "标题" },
        { "name": "slug", "type": "string", "required": true, "desc": "唯一标识（slug）" },
        { "name": "content", "type": "string", "required": true, "desc": "正文内容" },
        { "name": "excerpt", "type": "string", "required": false, "desc": "摘要" },
        { "name": "summary ", "type": "string", "required": false, "desc": "AI摘要" },
        { "name": "category", "type": "string", "required": false, "desc": "分类" },
        { "name": "tags", "type": "array", "required": false, "desc": "标签列表" },
        { "name": "status", "type": "string", "required": false, "desc": "文章状态" },
        { "name": "cover_image", "type": "string", "required": false, "desc": "封面图片链接" },
        { "name": "auto_generate_summary", "type": "boolean", "required": false, "desc": "是否自动生成AI摘要（仅当 summary 为空时生效）" }
      ],
      "desc": "创建新文章（需登录协作者及以上权限）",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "文章ID" },
        { name: "data.title", desc: "文章标题" },
        { name: "data.content", desc: "正文内容" },
        { name: "data.author", desc: "作者信息" },
        { name: "data.category", desc: "分类" },
        { name: "data.tags", desc: "标签列表" },
        { name: "data.status", desc: "文章状态" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "文章",
      "name": "更新文章",
      "path": "/api/articles/{id}",
      "method": "PUT",
      "params": [
        { name: "id", type: "string", required: true, desc: "文章ID" },
        { name: "title", type: "string", required: false, desc: "文章标题" },
        { name: "content", type: "string", required: false, desc: "正文内容" },
        { name: "excerpt", type: "string", required: false, desc: "摘要" },
        { "name": "summary ", "type": "string", "required": false, "desc": "AI摘要" },
        { name: "category", type: "string", required: false, desc: "分类" },
        { name: "tags", type: "array", required: false, desc: "标签列表" },
        { name: "status", type: "string", required: false, desc: "文章状态（draft/published/archived）" },
        { name: "cover_image", type: "string", required: false, desc: "封面图片链接" }
      ],
      "desc": "更新文章（需登录协作者及以上权限）",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "文章ID" },
        { name: "data.title", desc: "文章标题" },
        { name: "data.content", desc: "正文内容" },
        { name: "data.author", desc: "作者信息" },
        { name: "data.category", desc: "分类" },
        { name: "data.tags", desc: "标签列表" },
        { name: "data.status", desc: "文章状态" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "文章",
      "name": "删除文章",
      "path": "/api/articles/{id}",
      "method": "DELETE",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "文章ID" }
      ],
      "desc": "删除文章（需登录协作者及以上权限）",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "用户管理",
      "name": "获取用户列表",
      "path": "/api/admin/users",
      "method": "GET",
      "params": [],
      "desc": "仅管理员可用，获取所有用户"
    },
    {
      "group": "用户管理",
      "name": "获取公开用户信息",
      "path": "/api/users/{username}",
      "method": "GET",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" }
      ],
      "desc": "获取指定用户的公开信息（无需登录，游客可访问）",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "data.username", "desc": "用户名" },
        { "name": "data.name", "desc": "昵称/姓名" },
        { "name": "data.avatar_url", "desc": "头像链接" },
        { "name": "data.bio", "desc": "个人简介" },
        { "name": "data.website", "desc": "个人网站" }
      ]
    },
    {
      "group": "用户管理",
      "name": "根据用户名获取用户",
      "path": "/api/admin/users/{username}",
      "method": "GET",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" }
      ],
      "desc": "仅管理员可用，根据用户名获取用户"
    },
    {
      "group": "用户管理",
      "name": "创建用户",
      "path": "/api/admin/users",
      "method": "POST",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" },
        { "name": "email", "type": "string", "required": true, "desc": "邮箱" },
        { "name": "name", "type": "string", "required": true, "desc": "姓名" },
        { "name": "password", "type": "string", "required": true, "desc": "密码" },
        { "name": "role", "type": "string", "required": false, "desc": "角色" },
        { "name": "avatar_url", "type": "string", "required": false, "desc": "头像链接" },
        { "name": "bio", "type": "string", "required": false, "desc": "简介" },
        { "name": "is_email_verified", "type": "string", "required": true, "desc": "邮箱认证true/false" },
        { "name": "location", "type": "string", "required": false, "desc": "位置" },
        { "name": "website", "type": "string", "required": false, "desc": "个人网站" }
      ],
      "desc": "仅管理员可用，创建新用户"
    },
    {
      "group": "用户管理",
      "name": "更新用户角色",
      "path": "/api/admin/users/{username}",
      "method": "PUT",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" },
        { "name": "role", "type": "string", "required": true, "desc": "角色（admin/collaborator/user）" }
      ],
      "desc": "仅管理员可用，更新用户角色"
    },
    {
      "group": "用户管理",
      "name": "禁用/启用用户",
      "path": "/api/admin/users/{username}",
      "method": "PATCH",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" },
        { "name": "is_active", "type": "boolean", "required": true, "desc": "是否启用（true/false）" }
      ],
      "desc": "仅管理员可用，禁用或启用用户"
    },
    {
      "group": "用户管理",
      "name": "删除用户",
      "path": "/api/admin/users/{username}",
      "method": "DELETE",
      "params": [
        { "name": "username", "type": "string", "required": true, "desc": "用户名" }
      ],
      "desc": "仅管理员可用，删除用户"
    },
    {
      "group": "用户管理",
      "name": "用户统计",
      "path": "/api/admin/users/stats",
      "method": "GET",
      "params": [],
      "desc": "仅管理员可用，获取用户统计信息"
    },
    {
      "group": "文件",
      "name": "上传文件",
      "path": "/api/files/upload",
      "method": "POST",
      "params": [
        { "name": "file", "type": "file", "required": true, "desc": "文件" },
        { "name": "isPublic", "type": "string", "required": true, "desc": "权限true/false" },
      ],
      "desc": "上传文件",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "文件ID" },
        { name: "data.name", desc: "文件名" },
        { name: "data.size", desc: "文件大小（字节）" },
        { name: "data.type", desc: "文件类型" },
        { name: "data.url", desc: "文件访问URL" },
        { name: "data.created_at", desc: "上传时间" }
      ]
    },
    {
      "group": "文件",
      "name": "获取文件列表",
      "path": "/api/files",
      "method": "GET",
      "params": [],
      "desc": "获取所有文件",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "文件列表" },
        { name: "data[].id", desc: "文件ID" },
        { name: "data[].name", desc: "文件名" },
        { name: "data[].size", desc: "文件大小（字节）" },
        { name: "data[].type", desc: "文件类型" },
        { name: "data[].url", desc: "文件访问URL" },
        { name: "data[].created_at", desc: "上传时间" }
      ]
    },
    {
      "group": "文件",
      "name": "获取单个文件",
      "path": "/api/files/{id}",
      "method": "GET",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "文件ID" }
      ],
      "desc": "根据ID获取文件",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "文件ID" },
        { name: "data.name", desc: "文件名" },
        { name: "data.size", desc: "文件大小（字节）" },
        { name: "data.type", desc: "文件类型" },
        { name: "data.url", desc: "文件访问URL" },
        { name: "data.created_at", desc: "上传时间" }
      ]
    },
    {
      "group": "文件",
      "name": "删除文件",
      "path": "/api/files/{id}",
      "method": "DELETE",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "文件ID" }
      ],
      "desc": "根据ID删除文件",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "文件",
      "name": "存储用量",
      "path": "/api/files/storage/usage",
      "method": "GET",
      "params": [],
      "desc": "获取文件存储用量"
    },
    {
      "group": "AI",
      "name": "内容摘要生成",
      "path": "/api/ai/summary",
      "method": "POST",
      "params": [
        { "name": "content", "type": "string", "required": true, "desc": "内容" }
      ],
      "desc": "AI 生成内容摘要",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.summary", desc: "AI生成的内容摘要" }
      ]
    },
    {
      "group": "AI",
      "name": "标签生成",
      "path": "/api/ai/tags",
      "method": "POST",
      "params": [
        { "name": "title", "type": "string", "required": true, "desc": "标题" },
        { "name": "content", "type": "string", "required": true, "desc": "内容" }
      ],
      "desc": "AI 生成标签",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.tags", desc: "AI生成的标签数组" }
      ]
    },
    {
      "group": "AI",
      "name": "内容分析",
      "path": "/api/ai/analyze",
      "method": "POST",
      "params": [
        { "name": "title", "type": "string", "required": true, "desc": "标题" },
        { "name": "content", "type": "string", "required": true, "desc": "内容" }
      ],
      "desc": "AI 内容分析",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.analysis", desc: "AI分析结果" }
      ]
    },
    {
      "group": "AI",
      "name": "文本翻译",
      "path": "/api/ai/translate",
      "method": "POST",
      "params": [
        { "name": "text", "type": "string", "required": true, "desc": "文本" },
        { "name": "target_lang", "type": "string", "required": true, "desc": "目标语言（zh/en）" }
      ],
      "desc": "AI 文本翻译",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.translated", desc: "翻译后的文本" }
      ]
    },
    {
      "group": "搜索",
      "name": "文章搜索",
      "path": "/api/search",
      "method": "GET",
      "params": [
        { "name": "q", "type": "string", "required": true, "desc": "搜索关键词" }
      ],
      "desc": "文章全文搜索",
  responseFields: [
    { name: "success", desc: "是否成功" },
    { name: "data.articles", desc: "搜索结果文章列表" },
    { name: "data.articles[].id", desc: "文章ID" },
    { name: "data.articles[].title", desc: "文章标题" },
    { name: "data.articles[].excerpt", desc: "摘要" },
    { name: "data.articles[].author", desc: "作者信息" },
    { name: "data.articles[].category", desc: "分类" },
    { name: "data.articles[].tags", desc: "标签列表" },
    { name: "data.articles[].author_username", desc: "创建者" },
    { name: "data.articles[].created_at", desc: "创建时间" },
    { name: "data.articles[].published_at", desc: "发布时间" },
    { name: "data.articles[].updated_at", desc: "更新时间" },
    { name: "data.pagination.page", desc: "当前页码" },
    { name: "data.pagination.limit", desc: "每页数量" },
    { name: "data.pagination.total", desc: "总条数" },
    { name: "data.pagination.totalPages", desc: "总页数" }
  ]
    },
    {
      "group": "搜索",
      "name": "高级搜索",
      "path": "/api/search/advanced",
      "method": "POST",
      "params": [
        { "name": "query", "type": "object", "required": true, "desc": "搜索条件" }
      ],
      "desc": "文章高级搜索",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.articles", desc: "搜索结果文章列表" },
        { name: "data.articles[].id", desc: "文章ID" },
        { name: "data.articles[].title", desc: "文章标题" },
        { name: "data.articles[].excerpt", desc: "摘要" },
        { name: "data.articles[].author", desc: "作者信息" },
        { name: "data.articles[].category", desc: "分类" },
        { name: "data.articles[].tags", desc: "标签列表" },
        { name: "data.articles[].author_username", desc: "创建者" },
        { name: "data.articles[].created_at", desc: "创建时间" },
        { name: "data.articles[].published_at", desc: "发布时间" },
        { name: "data.articles[].updated_at", desc: "更新时间" },
        { name: "data.pagination.page", desc: "当前页码" },
        { name: "data.pagination.limit", desc: "每页数量" },
        { name: "data.pagination.total", desc: "总条数" },
        { name: "data.pagination.totalPages", desc: "总页数" }
      ]
    },
    {
      "group": "分类",
      "name": "获取分类列表",
      "path": "/api/categories",
      "method": "GET",
      "params": [],
      "desc": "获取所有分类",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "分类列表" },
        { name: "data[].id", desc: "分类ID" },
        { name: "data[].name", desc: "分类名称" },
        { name: "data[].slug", desc: "分类slug" },
        { name: "data[].created_at", desc: "创建时间" },
        { name: "data[].updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "分类",
      "name": "创建分类",
      "path": "/api/categories",
      "method": "POST",
      "params": [
        { "name": "name", "type": "string", "required": true, "desc": "分类名称" },
        { "name": "slug", "type": "string", "required": true, "desc": "分类slug" }
      ],
      "desc": "创建新分类",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "分类ID" },
        { name: "data.name", desc: "分类名称" },
        { name: "data.slug", desc: "分类slug" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "分类",
      "name": "更新分类",
      "path": "/api/categories/{id}",
      "method": "PUT",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "分类ID" },
        { "name": "name", "type": "string", "required": false, "desc": "分类名称" }
      ],
      "desc": "更新分类"
    },
    {
      "group": "分类",
      "name": "删除分类",
      "path": "/api/categories/{id}",
      "method": "DELETE",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "分类ID" }
      ],
      "desc": "删除分类"
    },
    {
      "group": "标签",
      "name": "获取标签列表",
      "path": "/api/tags",
      "method": "GET",
      "params": [],
      "desc": "获取所有标签",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "标签列表" },
        { name: "data[].id", desc: "标签ID" },
        { name: "data[].name", desc: "标签名称" },
        { name: "data[].slug", desc: "标签slug" },
        { name: "data[].created_at", desc: "创建时间" },
        { name: "data[].updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "标签",
      "name": "创建标签",
      "path": "/api/tags",
      "method": "POST",
      "params": [
        { "name": "name", "type": "string", "required": true, "desc": "标签名称" },
        { "name": "slug", "type": "string", "required": true, "desc": "标签slug" }
      ],
      "desc": "创建新标签",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "标签ID" },
        { name: "data.name", desc: "标签名称" },
        { name: "data.slug", desc: "标签slug" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "标签",
      "name": "更新标签",
      "path": "/api/tags/{id}",
      "method": "PUT",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "标签ID" },
        { "name": "name", "type": "string", "required": false, "desc": "标签名称" }
      ],
      "desc": "更新标签"
    },
    {
      "group": "标签",
      "name": "删除标签",
      "path": "/api/tags/{id}",
      "method": "DELETE",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "标签ID" }
      ],
      "desc": "删除标签"
    },
    {
      "group": "页面",
      "name": "获取页面列表",
      "path": "/api/pages",
      "method": "GET",
      "params": [],
      "desc": "获取所有页面",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "页面列表" },
        { name: "data[].id", desc: "页面ID" },
        { name: "data[].title", desc: "页面标题" },
        { name: "data[].content", desc: "页面内容" },
        { name: "data[].slug", desc: "页面slug" },
        { name: "data[].created_at", desc: "创建时间" },
        { name: "data[].updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "页面",
      "name": "创建页面",
      "path": "/api/pages",
      "method": "POST",
      "params": [
        { "name": "title", "type": "string", "required": true, "desc": "标题" },
        { "name": "content", "type": "string", "required": true, "desc": "内容" }
      ],
      "desc": "创建新页面",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "页面ID" },
        { name: "data.title", desc: "页面标题" },
        { name: "data.content", desc: "页面内容" },
        { name: "data.slug", desc: "页面slug" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "页面",
      "name": "更新页面",
      "path": "/api/pages/{id}",
      "method": "PUT",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "页面ID" },
        { "name": "title", "type": "string", "required": false, "desc": "标题" },
        { "name": "content", "type": "string", "required": false, "desc": "内容" }
      ],
      "desc": "更新页面"
    },
    {
      "group": "页面",
      "name": "删除页面",
      "path": "/api/pages/{id}",
      "method": "DELETE",
      "params": [
        { "name": "id", "type": "string", "required": true, "desc": "页面ID" }
      ],
      "desc": "删除页面"
    },
    {
      "group": "友链",
      "name": "获取友链列表",
      "path": "/api/friend-links",
      "method": "GET",
      "params": [],
      "desc": "获取所有友链",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "友链列表" },
        { name: "data[].id", desc: "友链ID" },
        { name: "data[].name", desc: "友链名称" },
        { name: "data[].url", desc: "友链URL" },
        { name: "data[].status", desc: "友链状态" },
        { name: "data[].created_at", desc: "创建时间" },
        { name: "data[].updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "友链",
      "name": "创建友链",
      "path": "/api/friend-links",
      "method": "POST",
      "params": [
        { "name": "name", "type": "string", "required": true, "desc": "友链名称" },
        { "name": "url", "type": "string", "required": true, "desc": "友链URL" },
        { "name": "description", "type": "string", "required": true, "desc": "描述" },
        { "name": "avatar", "type": "string", "required": true, "desc": "头像URL" },
        { "name": "category", "type": "string", "required": true, "desc": "分类" },
        { "name": "status", "type": "string", "required": true, "desc": "状态" }
      ],
      "desc": "创建新友链",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "友链ID" },
        { name: "data.name", desc: "友链名称" },
        { name: "data.url", desc: "友链URL" },
        { name: "data.status", desc: "友链状态" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" }
      ]
    },
    {
      "group": "友链",
      "name": "更新友链",
      "path": "/api/friend-links/{id}",
      "method": "PUT",
      "params": [
        { "name": "linkIds", "type": "string", "required": true, "desc": "友链ID" },
        { "name": "name", "type": "string", "required": false, "desc": "友链名称" },
        { "name": "url", "type": "string", "required": false, "desc": "友链URL" },
        { "name": "description", "type": "string", "required": false, "desc": "描述" },
        { "name": "avatar", "type": "string", "required": false, "desc": "头像URL" },
        { "name": "category", "type": "string", "required": false, "desc": "分类" },
        { "name": "status", "type": "string", "required": false, "desc": "状态" }
      ],
      "desc": "更新友链"
    },
    {
      "group": "友链",
      "name": "删除友链",
      "path": "/api/friend-links/{id}",
      "method": "DELETE",
      "params": [
        { "name": "linkIds", "type": "string", "required": true, "desc": "友链ID" }
      ],
      "desc": "删除友链"
    },
    {
      "group": "友链",
      "name": "批量更新友链状态",
      "path": "/api/friend-links/status",
      "method": "PUT",
      "params": [
        { "name": "linkIds", "type": "array", "required": true, "desc": "友链ID列表" },
        { "name": "status", "type": "string", "required": true, "desc": "友链状态" }
      ],
      "desc": "批量更新友链状态"
    },
    {
      "group": "RSS",
      "name": "获取 RSS Feed",
      "path": "/api/rss",
      "method": "GET",
      "params": [],
      "desc": "获取 RSS Feed",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "RSS Feed 内容(XML字符串)" }
      ]
    },
    {
      "group": "RSS",
      "name": "获取 Atom Feed",
      "path": "/api/atom",
      "method": "GET",
      "params": [],
      "desc": "获取 Atom Feed",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "Atom Feed 内容(XML字符串)" }
      ]
    },
    {
      "group": "RSS",
      "name": "获取 JSON Feed",
      "path": "/api/json-feed",
      "method": "GET",
      "params": [],
      "desc": "获取 JSON Feed",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "JSON Feed 内容(JSON对象)" }
      ]
    },
    {
      "group": "最近活动",
      "name": "最近的操作记录",
      "path": "/api/activity",
      "method": "GET",
      "params": [
      ],
      "desc": "最近的操作记录",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "Giscus",
      "name": "Giscus评论统计",
      "path": "/api/giscus/stats",
      "method": "GET",
      "params": [
        { "name": "discussion_number", "type": "string", "required": false, "desc": "Discussion编号（可选，优先级高）" },
        { "name": "mapping", "type": "string", "required": false, "desc": "映射类型（如 title，可选）" },
        { "name": "term", "type": "string", "required": false, "desc": "映射用的字符串（如标题，配合 mapping 使用）" }
      ],
      "desc": "统计 Giscus 评论数、用户数、reaction数",
      responseFields: [
        { name: "success", "desc": "是否成功" },
        { name: "comment_count", "desc": "评论总数（不含主楼）" },
        { name: "reply_count", "desc": "总回复数（同 comment_count，等于所有评论数之和）" },
        { name: "like_count", "desc": "总点赞数（所有 THUMBS_UP 的总和，主楼+评论）" },
        { name: "reaction_summary", "desc": "各表情类型的总数（主楼+评论），如 {THUMBS_UP: 2, HEART: 1} " },
        { name: "discussion_reactions", "desc": "主楼（帖子本身）各表情类型的数量" },
        { name: "user_count", "desc": "参与用户数（不含主楼作者，只统计有评论或点过 reaction 的用户，去重）" },
        { name: "users", "desc": "所有用户的详细信息数组（含评论、表情统计）" },
        { name: "users[].login", "desc": "用户 login" },
        { name: "users[].avatarUrl", "desc": "用户头像" },
        { name: "users[].url", "desc": "用户主页链接" },
        { name: "users[].comment_count", "desc": "该用户评论数" },
        { name: "users[].comments", "desc": "该用户所有评论内容数组" },
        { name: "users[].reactions", "desc": "该用户点过的所有表情类型及数量，如 {THUMBS_UP: 2, HEART: 1}" },
        { name: "comments", "desc": "每条评论的详情及表情统计数组" },
        { name: "comments[].id", "desc": "评论ID" },
        { name: "comments[].body", "desc": "评论内容" },
        { name: "comments[].author", "desc": "评论作者信息" },
        { name: "comments[].created_at", "desc": "评论创建时间" },
        { name: "comments[].reactions", "desc": "该评论的所有表情类型及数量，如 {THUMBS_UP: 1, HEART: 0}" }
      ]
    },
    {
      "group": "Giscus",
      "name": "删除Giscus评论",
      "path": "/api/giscus/delete-comment",
      "method": "DELETE",
      "params": [
        { "name": "repo", "type": "string", "required": true, "desc": "GitHub 仓库（owner/repo）" },
        { "name": "comment_id", "type": "string", "required": true, "desc": "评论ID" }
      ],
      "desc": "删除指定 Giscus 评论（需管理员）",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "message", "desc": "提示信息" }
      ]
    },
    {
      "group": "统计",
      "name": "记录文章浏览",
      "path": "/api/analytics/article-view",
      "method": "POST",
      "params": [
        { "name": "articleId", "type": "string", "required": true, "desc": "文章ID" },
        { "name": "visitorId", "type": "string", "required": true, "desc": "访客" }
      ],
      "desc": "记录文章浏览量",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "统计",
      "name": "获取文章统计",
      "path": "/api/analytics/article-stats",
      "method": "GET",
      "params": [],
      "desc": "获取文章统计信息",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "文章统计数据" }
      ]
    },
    {
      "group": "统计",
      "name": "获取仪表盘统计",
      "path": "/api/analytics/dashboard",
      "method": "GET",
      "params": [],
      "desc": "获取仪表盘统计信息",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "仪表盘统计数据" }
      ]
    },
    {
      "group": "统计",
      "name": "获取热门标签",
      "path": "/api/analytics/popular-tags",
      "method": "GET",
      "params": [],
      "desc": "获取热门标签",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "热门标签列表" },
        { name: "data[].name", desc: "标签名称" },
        { name: "data[].count", desc: "标签使用次数" }
      ]
    },
    {
      "group": "站点地图",
      "name": "获取站点地图索引",
      "path": "/api/sitemap",
      "method": "GET",
      "params": [],
      "desc": "获取站点地图索引"
    },
    {
      "group": "站点地图",
      "name": "获取页面地图",
      "path": "/api/sitemap/pages",
      "method": "GET",
      "params": [],
      "desc": "获取页面地图"
    },
    {
      "group": "站点地图",
      "name": "获取文章地图",
      "path": "/api/sitemap/articles",
      "method": "GET",
      "params": [],
      "desc": "获取文章地图"
    },
    {
      "group": "站点地图",
      "name": "获取分类地图",
      "path": "/api/sitemap/categories",
      "method": "GET",
      "params": [],
      "desc": "获取分类地图"
    },
    {
      "group": "站点地图",
      "name": "获取标签地图",
      "path": "/api/sitemap/tags",
      "method": "GET",
      "params": [],
      "desc": "获取标签地图"
    },
    {
      "group": "健康检查",
      "name": "系统健康检查",
      "path": "/api/health",
      "method": "GET",
      "params": [],
      "desc": "系统健康检查",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.status", desc: "系统状态（ok/error）" },
        { name: "data.time", desc: "检查时间" }
      ]
    },
    {
      "group": "健康检查",
      "name": "详细健康状态",
      "path": "/api/health/detailed",
      "method": "GET",
      "params": [],
      "desc": "获取详细健康状态",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "详细健康信息对象" }
      ]
    },
    {
      "group": "健康检查",
      "name": "新建表/增加字段",
      "path": "/api/health/custom-migrate",
      "method": "POST",
      "params": [
        { "name": "action", "type": "string", "required": true, "desc": "操作类型(createTable=新建表, addColumn=加字段)", "example": "createTable" },
        { "name": "table", "type": "string", "required": true, "desc": "表名", "example": "comments" },
        { "name": "columns", "type": "array", "required": true, "desc": "字段列表，每项包含name/type/primary/notNull/default" }
      ],
      "desc": "新建表/增加字段",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "健康检查",
      "name": "创建数据库备份",
      "path": "/api/health/backup",
      "method": "POST",
      "params": [],
      "desc": "创建数据库备份",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "备份信息" }
      ]
    },
    {
      "group": "健康检查",
      "name": "恢复数据库备份",
      "path": "/api/health/restore",
      "method": "POST",
      "params": [{ "name": "backupId", "type": "string", "required": true, "desc": "备份ID" }],
      "desc": "恢复数据库备份",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "监控",
      "name": "性能监控",
      "path": "/api/monitoring/performance",
      "method": "GET",
      "params": [],
      "desc": "获取性能监控数据",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "性能监控数据" }
      ]
    },
    {
      "group": "监控",
      "name": "健康监控",
      "path": "/api/monitoring/health",
      "method": "GET",
      "params": [],
      "desc": "获取健康监控数据",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "健康监控数据" }
      ]
    },
    {
      "group": "监控",
      "name": "系统日志",
      "path": "/api/monitoring/logs",
      "method": "GET",
      "params": [],
      "desc": "获取系统日志",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "系统日志内容" }
      ]
    },
    {
      "group": "监控",
      "name": "实时监控",
      "path": "/api/monitoring/realtime",
      "method": "GET",
      "params": [],
      "desc": "获取实时监控数据",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "实时监控数据" }
      ]
    },
    {
      "group": "监控",
      "name": "告警历史",
      "path": "/api/monitoring/alerts",
      "method": "GET",
      "params": [],
      "desc": "获取告警历史",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "告警历史列表" }
      ]
    },
    {
      "group": "监控",
      "name": "系统统计",
      "path": "/api/monitoring/stats",
      "method": "GET",
      "params": [],
      "desc": "获取系统统计",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "系统统计数据" }
      ]
    },
    {
      "group": "监控",
      "name": "清理监控数据",
      "path": "/api/monitoring/cleanup",
      "method": "POST",
      "params": [],
      "desc": "清理监控数据",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "监控",
      "name": "导出监控数据",
      "path": "/api/monitoring/export",
      "method": "GET",
      "params": [],
      "desc": "导出监控数据",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "导出的监控数据内容" }
      ]
    },
    {
      "group": "健康检查",
      "name": "获取所有表和字段",
      "path": "/api/health/list-tables",
      "method": "GET",
      "params": [],
      "desc": "获取所有表及字段结构",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "data[].table", "desc": "表名" },
        { "name": "data[].columns", "desc": "字段列表" },
        { "name": "data[].columns[].name", "desc": "字段名" },
        { "name": "data[].columns[].type", "desc": "字段类型" },
        { "name": "data[].columns[].notnull", "desc": "是否必填" },
        { "name": "data[].columns[].pk", "desc": "是否主键" },
        { "name": "data[].columns[].dflt_value", "desc": "默认值" }
      ]
    },
    {
      "group": "健康检查",
      "name": "删除表或字段",
      "path": "/api/health/drop",
      "method": "POST",
      "params": [
        { "name": "table", "type": "string", "required": true, "desc": "表名" },
        { "name": "type", "type": "string", "required": true, "desc": "操作类型(table/column)", "example": "table" },
        { "name": "column", "type": "string", "required": false, "desc": "字段名（type=column时必填）" }
      ],
      "desc": "删除表或字段",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "message", "desc": "提示信息" }
      ]
    },
    {
      "group": "健康检查",
      "name": "重命名表",
      "path": "/api/health/rename-table",
      "method": "POST",
      "params": [
        { "name": "oldName", "type": "string", "required": true, "desc": "原表名" },
        { "name": "newName", "type": "string", "required": true, "desc": "新表名" }
      ],
      "desc": "重命名表",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "message", "desc": "提示信息" }
      ]
    },
    {
      "group": "系统设置",
      "name": "获取所有设置",
      "path": "/api/settings",
      "method": "GET",
      "params": [],
      "desc": "获取所有系统设置",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "设置列表" }
      ]
    },
    {
      "group": "系统设置",
      "name": "获取单个设置",
      "path": "/api/settings/{key}",
      "method": "GET",
      "params": [
        { "name": "key", "type": "string", "required": true, "desc": "设置键" }
      ],
      "desc": "获取指定设置",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "设置值" }
      ]
    },
    {
      "group": "系统设置",
      "name": "新增设置",
      "path": "/api/settings/{key}",
      "method": "PUT",
      "params": [
        { "name": "key", "type": "string", "required": true, "desc": "设置键" },
        { "name": "value", "type": "string", "required": true, "desc": "网站名称" },
        { "name": "description", "type": "string", "required": true, "desc": "网站描述" },
        { "name": "url", "type": "string", "required": true, "desc": "网址" }
      ],
      "desc": "新增设置",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "系统设置",
      "name": "更新设置",
      "path": "/api/settings/{key}",
      "method": "PUT",
      "params": [
        { "name": "key", "type": "string", "required": true, "desc": "设置键" },
        { "name": "value", "type": "string", "required": false, "desc": "网站名称" },
        { "name": "description", "type": "string", "required": false, "desc": "网站描述" },
        { "name": "url", "type": "string", "required": false, "desc": "网址" }
      ],
      "desc": "更新设置",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "系统设置",
      "name": "删除设置",
      "path": "/api/settings/{key}",
      "method": "DELETE",
      "params": [
        { "name": "key", "type": "string", "required": true, "desc": "设置键" }
      ],
      "desc": "删除设置",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      "group": "用户管理",
      "name": "获取所有公开用户",
      "path": "/api/users",
      "method": "GET",
      "params": [],
      "desc": "获取所有公开用户（is_active=true，无需登录，游客可访问）",
      "responseFields": [
        { "name": "success", "desc": "是否成功" },
        { "name": "data", "desc": "用户公开信息数组" },
        { "name": "data[].username", "desc": "用户名" },
        { "name": "data[].name", "desc": "昵称/姓名" },
        { "name": "data[].avatar_url", "desc": "头像链接" },
        { "name": "data[].bio", "desc": "个人简介" },
        { "name": "data[].website", "desc": "个人网站" }
      ]
    },
    // 站点地图相关接口
    {
      group: '站点地图',
      name: '获取 Sitemap 统计',
      path: '/api/sitemap/stats',
      method: 'GET',
      params: [],
      desc: '获取所有 sitemap 文件的统计信息，包括 URL 数量、文件大小、更新时间、状态等',
      responseFields: [
        { name: 'success', desc: '是否成功' },
        { name: 'data.file_count', desc: 'sitemap 文件总数' },
        { name: 'data.total_url_count', desc: '所有 sitemap 的 URL 总数' },
        { name: 'data.last_generated', desc: '最近一次生成时间' },
        { name: 'data.files', desc: '各 sitemap 文件详细信息数组' },
        { name: 'data.files[].name', desc: '文件名' },
        { name: 'data.files[].url_count', desc: 'URL 数量' },
        { name: 'data.files[].size', desc: '文件字节数' },
        { name: 'data.files[].lastmod', desc: '最后更新时间' },
        { name: 'data.files[].status', desc: '状态(ok/warning/error)' },
        { name: 'data.files[].warnings', desc: '警告信息数组' },
        { name: 'data.files[].errors', desc: '错误信息数组' }
      ]
    },
    {
      group: '站点地图',
      name: '批量生成 Sitemap',
      path: '/api/sitemap/generate',
      method: 'POST',
      params: [],
      desc: '批量生成所有 sitemap 文件并写入数据库，返回每个文件的生成结果',
      responseFields: [
        { name: 'success', desc: '是否成功' },
        { name: 'message', desc: '提示信息' },
        { name: 'last_generated', desc: '最近一次生成时间' },
        { name: 'files', desc: '各 sitemap 文件详细信息数组' },
        { name: 'files[].name', desc: '文件名' },
        { name: 'files[].url_count', desc: 'URL 数量' },
        { name: 'files[].size', desc: '文件字节数' },
        { name: 'files[].lastmod', desc: '最后更新时间' },
        { name: 'files[].status', desc: '状态(ok/warning/error)' },
        { name: 'files[].warnings', desc: '警告信息数组' },
        { name: 'files[].errors', desc: '错误信息数组' }
      ]
    },
    {
      group: '站点地图',
      name: '查看所有 Sitemap 文件',
      path: '/api/sitemap/files',
      method: 'GET',
      params: [],
      desc: '列出所有已生成的 sitemap 文件及其元数据',
      responseFields: [
        { name: 'success', desc: '是否成功' },
        { name: 'data', desc: '文件数组' },
        { name: 'data[].name', desc: '文件名' },
        { name: 'data[].type', desc: '类型(main/article/page/category/tag/image/video/lang/other)' },
        { name: 'data[].url_count', desc: 'URL 数量' },
        { name: 'data[].size', desc: '文件字节数' },
        { name: 'data[].lastmod', desc: '最后更新时间' },
        { name: 'data[].status', desc: '状态(ok/warning/error)' },
        { name: 'data[].warnings', desc: '警告信息数组' },
        { name: 'data[].errors', desc: '错误信息数组' }
      ]
    },
    {
      group: '站点地图',
      name: '获取/设置 Sitemap 配置',
      path: '/api/sitemap/config',
      method: 'GET',
      params: [],
      desc: '获取 sitemap 生成相关配置',
      responseFields: [
        { name: 'success', desc: '是否成功' },
        { name: 'data.enable_sitemap', desc: '是否启用 sitemap' },
        { name: 'data.auto_generate', desc: '是否自动生成 sitemap' },
        { name: 'data.include_articles', desc: '是否包含文章' },
        { name: 'data.include_pages', desc: '是否包含页面' },
        { name: 'data.include_image', desc: '是否包含图片 sitemap' },
        { name: 'data.include_news', desc: '是否包含新闻 sitemap' },
        { name: 'data.include_video', desc: '是否包含视频 sitemap' },
        { name: 'data.priority_default', desc: '默认优先级' },
        { name: 'data.changefreq_default', desc: '默认变更频率' },
        { name: 'data.split_size', desc: '分块阈值' },
        { name: 'data.exclude_paths', desc: '需要排除的路径数组' },
        { name: 'data.custom_urls', desc: '自定义 URL 数组' }
      ]
    },
    {
      group: '站点地图',
      name: '更新 Sitemap 配置',
      path: '/api/sitemap/config',
      method: 'POST',
      params: [
        { name: 'enable_sitemap', type: 'boolean', required: false, desc: '是否启用 sitemap' },
        { name: 'auto_generate', type: 'boolean', required: false, desc: '是否自动生成 sitemap' },
        { name: 'include_articles', type: 'boolean', required: false, desc: '是否包含文章' },
        { name: 'include_pages', type: 'boolean', required: false, desc: '是否包含页面' },
        { name: 'include_image', type: 'boolean', required: false, desc: '是否包含图片 sitemap' },
        { name: 'include_news', type: 'boolean', required: false, desc: '是否包含新闻 sitemap' },
        { name: 'include_video', type: 'boolean', required: false, desc: '是否包含视频 sitemap' },
        { name: 'priority_default', type: 'number', required: false, desc: '默认优先级' },
        { name: 'changefreq_default', type: 'string', required: false, desc: '默认变更频率' },
        { name: 'split_size', type: 'number', required: false, desc: '分块阈值' },
        { name: 'exclude_paths', type: 'array', required: false, desc: '需要排除的路径数组' },
        { name: 'custom_urls', type: 'array', required: false, desc: '自定义 URL 数组' }
      ],
      desc: '更新 sitemap 生成相关配置，支持部分字段更新',
      responseFields: [
        { name: 'success', desc: '是否成功' },
        { name: 'message', desc: '提示信息' }
      ]
    },
    {
      group: "友链",
      name: "审批友链",
      path: "/api/friend-links/{id}/approve",
      method: "POST",
      params: [
        { name: "id", type: "string", required: true, desc: "友链ID" }
      ],
      desc: "管理员审批友链（通过）",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" }
      ]
    },
    {
      group: "认证",
      name: "用户注册（支持自定义邮件内容）",
      path: "/api/auth/register",
      method: "POST",
      params: [
        { name: "username", type: "string", required: true, desc: "用户名" },
        { name: "email", type: "string", required: true, desc: "邮箱" },
        { name: "name", type: "string", required: true, desc: "姓名/昵称" },
        { name: "password", type: "string", required: true, desc: "密码" },
        { name: "subject", type: "string", required: false, desc: "邮件标题（可自定义）" },
        { name: "html", type: "string", required: false, desc: "邮件HTML内容（可自定义，已做XSS/敏感词过滤）" },
        { name: "from", type: "string", required: false, desc: "发件人邮箱/名称（可自定义）" },
        { name: "verifyUrl", type: "string", required: false, desc: "认证跳转链接（可自定义）" },
        { name: "successRedirectUrl", type: "string", required: false, desc: "认证成功后跳转页面（拼接到认证链接参数）" },
        { name: "failRedirectUrl", type: "string", required: false, desc: "认证失败后跳转页面（拼接到认证链接参数）" },
        { name: "showSupportContact", type: "boolean", required: false, desc: "是否在邮件中显示客服/帮助联系方式" },
        { name: "expireMinutes", type: "number", required: false, desc: "链接/验证码有效期（分钟），如15、30" }
      ],
      desc: "开放注册接口，支持自定义邮箱验证邮件内容、跳转、有效期、客服等。所有自定义内容均做XSS和敏感词过滤。",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data.id", desc: "用户ID" },
        { name: "data.username", desc: "用户名" },
        { name: "data.email", desc: "邮箱" },
        { name: "data.name", desc: "姓名/昵称" },
        { name: "data.role", desc: "用户角色" },
        { name: "data.avatar_url", desc: "头像链接" },
        { name: "data.bio", desc: "个人简介" },
        { name: "data.location", desc: "位置" },
        { name: "data.website", desc: "个人网站" },
        { name: "data.created_at", desc: "创建时间" },
        { name: "data.updated_at", desc: "更新时间" },
        { name: "data.is_active", desc: "是否激活" },
        { name: "data.is_email_verified", desc: "邮箱是否已验证" }
      ]
    },
    {
      group: "认证",
      name: "重发邮箱验证邮件（支持自定义邮件内容）",
      path: "/api/auth/resend-verification-email",
      method: "POST",
      params: [
        { name: "email", type: "string", required: true, desc: "注册邮箱" },
        { name: "subject", type: "string", required: false, desc: "邮件标题（可自定义）" },
        { name: "html", type: "string", required: false, desc: "邮件HTML内容（可自定义，已做XSS/敏感词过滤）" },
        { name: "from", type: "string", required: false, desc: "发件人邮箱/名称（可自定义）" },
        { name: "verifyUrl", type: "string", required: false, desc: "认证跳转链接（可自定义）" },
        { name: "successRedirectUrl", type: "string", required: false, desc: "认证成功后跳转页面（拼接到认证链接参数）" },
        { name: "failRedirectUrl", type: "string", required: false, desc: "认证失败后跳转页面（拼接到认证链接参数）" },
        { name: "showSupportContact", type: "boolean", required: false, desc: "是否在邮件中显示客服/帮助联系方式" },
        { name: "expireMinutes", type: "number", required: false, desc: "链接/验证码有效期（分钟），如15、30" }
      ],
      desc: "重发邮箱验证邮件接口，支持自定义邮件内容、跳转、有效期、客服等。所有自定义内容均做XSS和敏感词过滤。",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "message", desc: "提示信息" },
        { name: "error", desc: "错误信息（失败时）" }
      ]
    },
    {
      group: "Giscus",
      name: "Giscus获取所有文章标题",
      path: "/api/giscus/all-titles",
      method: "GET",
      params: [
        { name: "repo", type: "string", required: false, desc: "GitHub 仓库（owner/repo），可选，默认取环境变量" },
        { name: "first", type: "number", required: false, desc: "返回前多少条，默认100，最大100（可分页）" },
        { name: "after", type: "string", required: false, desc: "分页游标，传 endCursor" }
      ],
      desc: "获取指定 Giscus 仓库下所有 discussion（文章）的编号和标题列表，可用于评论文章映射。支持分页。",
      responseFields: [
        { name: "repo", desc: "仓库名（owner/repo）" },
        { name: "discussions", desc: "discussion 列表" },
        { name: "discussions[].number", desc: "discussion 编号" },
        { name: "discussions[].title", desc: "discussion 标题" }
      ]
    },
    {
      group: "系统设置",
      name: "获取公开设置（无需登录）",
      path: "/api/settings/public",
      method: "GET",
      params: [],
      desc: "获取所有公开系统设置，无需登录，前端可用于自定义配置、公告、主题等。返回 settings 表全部字段。",
      responseFields: [
        { name: "success", desc: "是否成功" },
        { name: "data", desc: "设置列表" },
        { name: "data[].key", desc: "设置键" },
        { name: "data[].value", desc: "设置值" },
        { name: "data[].updated_by", desc: "最后更新人" },
        { name: "data[].updated_at", desc: "最后更新时间" }
      ]
    }
];

// 自动修正友链相关API status参数的enum配置
apiConfigJson.forEach(api => {
  if (api.path && api.path.startsWith('/api/friend-links')) {
    if (Array.isArray(api.params)) {
      api.params.forEach(p => {
        if (p.name === 'status') {
          p.enum = [
            { value: 'pending', label: 'pending', desc: '待审核' },
            { value: 'approved', label: 'approved', desc: '已通过' },
            { value: 'rejected', label: 'rejected', desc: '已拒绝' }
          ];
        }
      });
    }
    // 移除API对象外层的enum
    if ('enum' in api) {
      delete api.enum;
    }
  }
});

const LOGO_URL = 'https://avatars.githubusercontent.com/u/94781176?v=4'; // 可替换为你的 Logo 链接

const apiExplorerJsInline = `
// src/api-explorer.js
let globalToken = localStorage.getItem('token') || '';

function setToken(token) {
  globalToken = token;
  localStorage.setItem('token', token);
}

function getToken() {
  return globalToken;
}

function loadApiConfig() {
  return window.apiConfig;
}

function validateParam(value, type) {
  if (type === 'number') return /^-?\d+(\.\d+)?$/.test(value);
  if (type === 'boolean') return value === 'true' || value === 'false';
  return true;
}

// 自定义下拉菜单实现
function createCustomDropdown(name, options, placeholder = '请选择', value = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-dropdown';
  wrapper.tabIndex = 0;
  const display = document.createElement('div');
  display.className = 'dropdown-display';
  display.textContent = value ? (options.find(o => o.value === value)?.label || value) : placeholder;
  wrapper.appendChild(display);
  const list = document.createElement('ul');
  list.className = 'dropdown-list';
  options.forEach(opt => {
    const li = document.createElement('li');
    li.className = 'dropdown-option';
    li.setAttribute('data-value', opt.value);
    li.innerHTML = '<span class="opt-main">' + opt.value + '</span>' + (opt.desc ? '<span class="opt-desc">：' + opt.desc + '</span>' : '');
    if (opt.value === value) li.classList.add('selected');
    li.onclick = function(e) {
      e.stopPropagation();
      wrapper.setAttribute('data-value', opt.value);
      display.textContent = opt.value + (opt.desc ? '：' + opt.desc : '');
      list.style.display = 'none';
      wrapper.classList.remove('open');
      Array.from(list.children).forEach(x => x.classList.remove('selected'));
      li.classList.add('selected');
      // 触发 change 事件
      wrapper.dispatchEvent(new Event('change'));
    };
    list.appendChild(li);
  });
  wrapper.appendChild(list);
  display.onclick = function(e) {
    e.stopPropagation();
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
    wrapper.classList.toggle('open');
  };
  // 关闭下拉
  document.addEventListener('click', function() {
    list.style.display = 'none';
    wrapper.classList.remove('open');
  });
  // 取值/赋值接口
  wrapper.getValue = function() {
    return wrapper.getAttribute('data-value') || '';
  };
  wrapper.setValue = function(val) {
    const opt = options.find(o => o.value === val);
    wrapper.setAttribute('data-value', val);
    display.textContent = opt ? (opt.value + (opt.desc ? '：' + opt.desc : '')) : placeholder;
    Array.from(list.children).forEach(x => x.classList.remove('selected'));
    const li = Array.from(list.children).find(x => x.getAttribute('data-value') === val);
    if (li) li.classList.add('selected');
  };
  // 兼容参数收集
  wrapper.name = name;
  return wrapper;
}

function createApiBlock(api) {
  const block = document.createElement('div');
  block.className = 'api-block';
  let paramHtml = '';
  const isCustomMigrate = api.path === '/api/health/custom-migrate';
  const isAdvancedSearch = api.path === '/api/search/advanced' && api.params.some(p => p.name === 'query' && p.type === 'object');
  if (isCustomMigrate) {
    paramHtml += '<div class="params">';
    paramHtml += '<div class="param-row"><label>操作类型</label><select name="action"><option value="createTable">新建表</option><option value="addColumn">加字段</option></select></div>';
    paramHtml += '<div class="param-row"><label>表名</label><input name="table" type="" placeholder="如 comments" required></div>';
    paramHtml += '<div class="param-row"><label>字段列表</label><button type="" class="add-col-btn" style="margin-left:8px;">+添加字段</button></div>';
    paramHtml += '<div class="columns-area"></div>';
    paramHtml += '</div>';
  } else if (isAdvancedSearch) {
    paramHtml += '<div class="params">';
    paramHtml += '<div class="param-row"><label>标题</label><input name="title" type="text" placeholder="标题关键词"></div>';
    paramHtml += '<div class="param-row"><label>内容</label><input name="content" type="text" placeholder="内容关键词"></div>';
    paramHtml += '<div class="param-row"><label>分类</label><input name="category" type="text" placeholder="分类"></div>';
    paramHtml += '<div class="param-row"><label>标签</label><input name="tags" type="text" placeholder="多个标签用逗号分隔"></div>';
    paramHtml += '<div class="param-row"><label>作者</label><input name="author_username" type="text" placeholder="作者用户名"></div>';
    paramHtml += '<div class="param-row"><label>状态</label>' +
      '<select name="status"><option value="">全部</option><option value="draft">草稿</option><option value="published">发布</option><option value="archived">归档</option></select></div>';
    paramHtml += '<div class="param-row"><label>创建时间起</label><input name="created_at_gte" type="date"></div>';
    paramHtml += '<div class="param-row"><label>创建时间止</label><input name="created_at_lte" type="date"></div>';
    paramHtml += '</div>';
  } else if (api.params && Array.isArray(api.params) && api.params.length > 0) {
    paramHtml += '<div class="params">';
    for (var i = 0; i < api.params.length; i++) {
      var p = api.params[i];
      const labelDesc = p.desc || '';
      paramHtml += '<div class="param-row" data-param="' + p.name + '">' +
        '<label>' + p.name + (p.required ? ' <span class="required">*</span>' : '') +
        (labelDesc ? ' <span style="color:#888;font-size:0.98em;margin-left:6px;">(' + labelDesc + ')</span>' : '') +
        '</label>' +
        (p.name === 'content'
          ? '<textarea name="content" rows="8" style="width:100%;resize:vertical;" placeholder="支持多行Markdown"></textarea>'
          : (Array.isArray(p.enum)
            ? '<div class="custom-dropdown-mount" data-name="' + p.name + '"></div>'
            : (p.type === 'file'
              ? '<input name="' + p.name + '" type="file" ' + (p.required ? 'required' : '') + '>'
              : (p.name === 'role'
                ? '<div class="custom-dropdown-mount" data-name="role"></div>'
                : p.name === 'status'
                  ? '<div class="custom-dropdown-mount" data-name="status"></div>'
                  : '<input name="' + p.name + '" type="text" placeholder="' + (p.example || '') + '" ' + (p.required ? 'required' : '') + ' data-type="' + (p.type || 'string') + '">' 
                )
              )
            )
          ) +
        (p.type ? '<span class="param-type">' + p.type + '</span>' : '') +
        (p.example !== undefined ? '<div class="param-example" style="color:#888;font-size:0.93em;margin-left:8px;">示例：' + p.example + '</div>' : '') +
        (p.example ? '<button type="button" class="fill-example" data-name="' + p.name + '">示例</button>' : '') +
        '<span class="param-error" style="color:#e00;font-size:12px;display:none"></span>' +
        '</div>';
    }
    paramHtml += '</div>';
  }
  block.innerHTML =
    '<h3>' + api.method + ' <span class="api-path">' + api.path + '</span></h3>' +
    '<div class="api-desc">' + (api.desc || '无描述') + '</div>' +
    '<form>' +
      paramHtml +
      '<button type="submit" class="send-btn">发送请求</button>' +
    '</form>' +
    // CURL 区块折叠，默认收起
    '<div class="curl-group"><h4 class="curl-title group-title" style="cursor:pointer;user-select:none">CURL <span class="toggle">[展开]</span></h4>' +
    '<div class="curl-content" style="display:none"><pre class="curl-block"></pre></div></div>' +
    // 响应区块折叠，默认收起
    '<div class="response-group"><h4 class="response-title group-title" style="cursor:pointer;user-select:none">Responses <span class="toggle">[展开]</span></h4>' +
    '<div class="response-content" style="display:none"><pre class="api-response"></pre></div></div>';

  // 先声明form和responsePre，后续所有逻辑都能用
  const form = block.querySelector('form');
  const responsePre = block.querySelector('.api-response'); 

  // CURL 折叠逻辑
  const curlGroup = block.querySelector('.curl-group');
  const curlTitle = block.querySelector('.curl-title');
  const curlContent = block.querySelector('.curl-content');
  curlTitle.onclick = function() {
    if (curlContent.style.display === 'none') {
      curlContent.style.display = '';
      curlTitle.querySelector('.toggle').textContent = '[收起]';
    } else {
      curlContent.style.display = 'none';
      curlTitle.querySelector('.toggle').textContent = '[展开]';
    }
  };
  // Responses 折叠逻辑
  const responseGroup = block.querySelector('.response-group');
  const responseTitle = block.querySelector('.response-title');
  const responseContent = block.querySelector('.response-content');
  responseTitle.onclick = function() {
    if (responseContent.style.display === 'none') {
      responseContent.style.display = '';
      responseTitle.querySelector('.toggle').textContent = '[收起]';
    } else {
      responseContent.style.display = 'none';
      responseTitle.querySelector('.toggle').textContent = '[展开]';
    }
  };
  // CURL命令生成函数
  function genCurl(api, params) {
    let url = location.origin + api.path;
    let method = api.method || 'GET';
    let headers = [];
    let token = getToken();
    if (token) headers.push('Authorization: Bearer ' + token);
    if (method === 'GET') {
      const urlParams = new URLSearchParams();
      Object.keys(params || {}).forEach(k => {
        if (params[k] !== '' && params[k] !== undefined && params[k] !== null) urlParams.append(k, params[k]);
      });
      if (urlParams.toString()) url += '?' + urlParams.toString();
    }
    let curl = 'curl';
    curl += ' -X ' + method;
    headers.forEach(h => {
      curl += ' -H ' + JSON.stringify(h);
    });
    if (method !== 'GET') {
      // 判断是否有文件
      let hasFile = false;
      if (params) {
        Object.keys(params).forEach(k => {
          if (params[k] instanceof File) hasFile = true;
        });
      }
      if (hasFile) {
        Object.keys(params).forEach(k => {
          if (params[k] instanceof File) {
            curl += ' -F ' + k + '=@<file>';
          } else {
            curl += ' -F ' + k + '=' + params[k];
          }
        });
      } else {
        curl += ' -H "Content-Type: application/json"';
        curl += ' -d ' + JSON.stringify(JSON.stringify(params || {}));
      }
    }
    curl += ' ' + JSON.stringify(url);
    return curl;
  }
  // 参数变动时实时生成CURL
  function updateCurlBlock(params) {
    const curlBlock = block.querySelector('.curl-block');
    curlBlock.textContent = genCurl(api, params || {});
  }
  // 监听参数变动
  if (!isCustomMigrate) {
    form.addEventListener('input', function() {
      // 实时收集参数
      let params = {};
      const paramRows = form.querySelectorAll('.param-row');
      paramRows.forEach(row => {
        // 收集所有 input/select/textarea
        row.querySelectorAll('input, select, textarea').forEach(input => {
          let name = input.name || input.getAttribute('name') || input.getAttribute('data-name');
          let value = '';
          if (input.type === 'file') {
            value = input.files && input.files[0];
          } else if (input.type === 'checkbox') {
            value = input.checked;
          } else {
            value = input.value;
          }
          if (name) params[name] = value;
        });
        // 收集所有 custom-dropdown
        row.querySelectorAll('.custom-dropdown').forEach(dropdown => {
          let name = dropdown.name || dropdown.getAttribute('name') || dropdown.getAttribute('data-name');
          let value = dropdown.getValue ? dropdown.getValue() : '';
          if (name) params[name] = value;
        });
      });
      updateCurlBlock(params);
    });
    // 初始化CURL
    updateCurlBlock({});
  }
  // 可视化建表/加字段表单逻辑
  if (isCustomMigrate) {
    const columnsArea = block.querySelector('.columns-area');
    let columns = [
      { name: '', type: 'TEXT', primary: false, notNull: false, default: '' }
    ];
    function renderColumns() {
      columnsArea.innerHTML = '';
      columns.forEach((col, idx) => {
        const row = document.createElement('div');
        row.className = 'param-row';
        row.innerHTML =
          '<input name="col_name" type="text" placeholder="字段名" value="' + (col.name || '') + '" style="width:110px;margin-right:6px;">' +
          '<select name="col_type" style="width:90px;margin-right:6px;">' +
            '<option value="TEXT"' + (col.type==='TEXT'?' selected':'') + '>TEXT</option>' +
            '<option value="INTEGER"' + (col.type==='INTEGER'?' selected':'') + '>INTEGER</option>' +
            '<option value="REAL"' + (col.type==='REAL'?' selected':'') + '>REAL</option>' +
            '<option value="BOOLEAN"' + (col.type==='BOOLEAN'?' selected':'') + '>BOOLEAN</option>' +
            '<option value="DATETIME"' + (col.type==='DATETIME'?' selected':'') + '>DATETIME</option>' +
            '<option value="BLOB"' + (col.type==='BLOB'?' selected':'') + '>BLOB</option>' +
            '<option value="JSON"' + (col.type==='JSON'?' selected':'') + '>JSON</option>' +
            '<option value="CUSTOM"' + (col.type==='CUSTOM'?' selected':'') + '>自定义</option>' +
          '</select>' +
          '<input name="col_custom_type" type="text" placeholder="自定义类型" value="' + (col.type==='CUSTOM'?(col.customType||''):'') + '" style="width:80px;display:' + (col.type==='CUSTOM'?'':'none') + ';margin-right:6px;">' +
          '<label><input name="col_primary" type="checkbox"' + (col.primary?' checked':'') + '>主键</label>' +
          '<label style="margin-left:8px;"><input name="col_notnull" type="checkbox"' + (col.notNull?' checked':'') + '>必填</label>' +
          '<input name="col_default" type="text" placeholder="默认值" value="' + (col.default||'') + '" style="width:90px;margin-left:8px;">' +
          '<button type="button" class="del-col-btn" style="margin-left:8px;">删除</button>';
        // 事件绑定
        row.querySelector('[name="col_name"]').oninput = e => { columns[idx].name = e.target.value; };
        row.querySelector('[name="col_type"]').onchange = e => {
          columns[idx].type = e.target.value;
          if (e.target.value === 'CUSTOM') {
            row.querySelector('[name="col_custom_type"]').style.display = '';
          } else {
            row.querySelector('[name="col_custom_type"]').style.display = 'none';
            columns[idx].customType = '';
          }
        };
        row.querySelector('[name="col_custom_type"]').oninput = e => { columns[idx].customType = e.target.value; };
        row.querySelector('[name="col_primary"]').onchange = e => { columns[idx].primary = e.target.checked; };
        row.querySelector('[name="col_notnull"]').onchange = e => { columns[idx].notNull = e.target.checked; };
        row.querySelector('[name="col_default"]').oninput = e => { columns[idx].default = e.target.value; };
        row.querySelector('.del-col-btn').onclick = () => {
          columns.splice(idx, 1);
          renderColumns();
        };
        columnsArea.appendChild(row);
      });
    }
    renderColumns();
    block.querySelector('.add-col-btn').onclick = () => {
      columns.push({ name: '', type: 'TEXT', primary: false, notNull: false, default: '' });
      renderColumns();
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const action = form.querySelector('[name="action"]').value;
      const table = form.querySelector('[name="table"]').value.trim();
      const colData = columns.map(col => ({
        name: col.name.trim(),
        type: col.type === 'CUSTOM' ? (col.customType || '').trim() : col.type,
        primary: !!col.primary,
        notNull: !!col.notNull,
        default: col.default ? col.default.trim() : undefined
      })).filter(col => col.name && col.type);
      if (!action || !table || colData.length === 0) {
        responsePre.textContent = '请填写完整表名和字段信息';
        return;
      }
      responsePre.textContent = '请求中...';
      form.querySelector('.send-btn').disabled = true;
      try {
        const res = await fetch(api.path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getToken() ? 'Bearer ' + getToken() : ''
          },
          body: JSON.stringify({ action, table, columns: colData })
        });
        const text = await res.text();
        try {
          const jsonObj = JSON.parse(text);
          if (api.responseFields && Array.isArray(api.responseFields) && api.responseFields.length > 0) {
            responsePre.innerHTML = '<code>' + renderJsonWithComments(jsonObj, api.responseFields) + '</code>';
          } else {
            responsePre.innerHTML = '<code>' + syntaxHighlight(jsonObj) + '</code>';
          }
          responsePre.classList.add('json');
        } catch {
          responsePre.textContent = text;
          responsePre.classList.remove('json');
        }
      } catch (err) {
        responsePre.textContent = '请求失败: ' + err;
        responsePre.classList.remove('json');
      }
      form.querySelector('.send-btn').disabled = false;
    };
  } else {
    // 普通API表单提交逻辑，阻止默认刷新
    form.onsubmit = async function(e) {
      e.preventDefault();
      console.log('表单提交', api.method, api.path);
      responsePre.textContent = '请求中...';
      form.querySelector('.send-btn').disabled = true;
      // 参数收集
      let params = {};
      let hasError = false;
      const paramRows = form.querySelectorAll('.param-row');
      paramRows.forEach(row => {
        // 收集所有 input/select/textarea
        row.querySelectorAll('input, select, textarea').forEach(input => {
          let name = input.name || input.getAttribute('name') || input.getAttribute('data-name');
          let value = '';
          if (input.type === 'file') {
            value = input.files && input.files[0];
          } else if (input.type === 'checkbox') {
            value = input.checked;
          } else {
            value = input.value;
          }
          if (name) params[name] = value;
        });
        // 收集所有 custom-dropdown
        row.querySelectorAll('.custom-dropdown').forEach(dropdown => {
          let name = dropdown.name || dropdown.getAttribute('name') || dropdown.getAttribute('data-name');
          let value = dropdown.getValue ? dropdown.getValue() : '';
          if (name) params[name] = value;
        });
      });
      if (hasError) {
        responsePre.textContent = '请填写必填参数';
        form.querySelector('.send-btn').disabled = false;
        return;
      }
      // linkIds 自动转为数组，兼容逗号分隔和单个
      if (params.linkIds && typeof params.linkIds === 'string') {
        params.linkIds = params.linkIds.replace(/，/g, ',');
        params.linkIds = params.linkIds.split(',').map(x => x.trim()).filter(Boolean);
      }
      // 过滤掉空字符串、undefined、null、空数组的字段
      Object.keys(params).forEach(k => {
        if (
          params[k] === '' ||
          params[k] === undefined ||
          params[k] === null ||
          (Array.isArray(params[k]) && params[k].length === 0)
        ) {
          delete params[k];
        }
      });
      let fetchOptions = {
        method: api.method,
        headers: {
          'Authorization': getToken() ? 'Bearer ' + getToken() : ''
        },
      };
      let url = api.path;
      // 通用：自动替换所有 {xxx} 路径参数
      url = url.replace(/\{([^}]+)\}/g, (match, p1) => {
        const v = params[p1];
        if (v !== undefined && v !== null && v !== '') {
          delete params[p1];
          return encodeURIComponent(v);
        }
        return match;
      });
      if ((api.method === 'PUT' || api.method === 'POST' || api.method === 'DELETE') && /\{id\}/.test(api.path)) {
        // 这里已在上面处理，无需再做替换，只处理 body 相关逻辑
        // DELETE请求不需要body
        if (api.method === 'DELETE') {
          fetchOptions.body = undefined;
          console.log('走 DELETE 分支，body: undefined');
        } else {
          // PUT/POST 也要赋值body
          console.log('走 PUT/POST 分支（带{id}）');
          const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));
          const hasFile = fileInputs.some(input => input.files && input.files.length > 0);
          if (hasFile) {
            console.log('走 formData 分支');
            const formData = new FormData();
            Object.keys(params).forEach(k => {
              if (params[k] instanceof File) {
                formData.append(k, params[k]);
              } else {
                formData.append(k, params[k]);
              }
            });
            fetchOptions.body = formData;
            delete fetchOptions.headers['Content-Type'];
          } else {
            console.log('走 JSON 分支');
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(params);
          }
          console.log('最终提交 params:', params, 'body:', fetchOptions.body, 'body类型:', typeof fetchOptions.body);
        }
      } else if (api.method === 'GET') {
        console.log('走 GET 分支');
        // GET参数拼接
        const urlParams = new URLSearchParams();
        Object.keys(params).forEach(k => {
          if (params[k] !== '' && params[k] !== undefined && params[k] !== null) urlParams.append(k, params[k]);
        });
        if (urlParams.toString()) url += '?' + urlParams.toString();
      } else {
        console.log('走 POST/PUT 分支');
        // 统一处理文件和body
        const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));
        const hasFile = fileInputs.some(input => input.files && input.files.length > 0);
        if (hasFile) {
          console.log('走 formData 分支');
          const formData = new FormData();
          Object.keys(params).forEach(k => {
            if (params[k] instanceof File) {
              formData.append(k, params[k]);
            } else {
              formData.append(k, params[k]);
            }
          });
          fetchOptions.body = formData;
          delete fetchOptions.headers['Content-Type'];
        } else {
          console.log('走 JSON 分支');
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(params);
        }
        // 日志输出
        console.log('最终提交 params:', params, 'body:', fetchOptions.body, 'body类型:', typeof fetchOptions.body);
      }
      try {
        const res = await fetch(url, fetchOptions);
        const text = await res.text();
        try {
          const jsonObj = JSON.parse(text);
          // 新增：如果是登出接口且成功，自动清理本地登录状态
          if (api.path === '/api/auth/logout' && jsonObj.success) {
            setToken('');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            if (typeof globalToken !== 'undefined') globalToken = '';
            renderApiExplorer();
            return; // 不再渲染响应内容
          }
          if (api.responseFields && Array.isArray(api.responseFields) && api.responseFields.length > 0) {
            responsePre.innerHTML = '<code>' + renderJsonWithComments(jsonObj, api.responseFields) + '</code>';
          } else {
            responsePre.innerHTML = '<code>' + syntaxHighlight(jsonObj) + '</code>';
          }
          responsePre.classList.add('json');
        } catch {
          responsePre.textContent = text;
          responsePre.classList.remove('json');
        }
      } catch (err) {
        responsePre.textContent = '请求失败: ' + err;
        responsePre.classList.remove('json');
      }
      form.querySelector('.send-btn').disabled = false;
    };
  }
  // 普通API表单提交逻辑，阻止默认刷新
  // 自动挂载role/status自定义下拉
  setTimeout(() => {
    const roleMount = block.querySelector('.custom-dropdown-mount[data-name="role"]');
    if (roleMount && !roleMount.hasChildNodes()) {
      const options = [
        { value: 'admin', label: 'admin', desc: '管理员' },
        { value: 'collaborator', label: 'collaborator', desc: '协作者' },
        { value: 'user', label: 'user', desc: '普通用户' }
      ];
      const dropdown = createCustomDropdown('role', options, '请选择角色');
      roleMount.appendChild(dropdown);
    }
    const statusMount = block.querySelector('.custom-dropdown-mount[data-name="status"]');
    if (statusMount && !statusMount.hasChildNodes()) {
      // 优先用参数对象的 enum
      let options = null;
      if (api.params && Array.isArray(api.params)) {
        const statusParam = api.params.find(p => p.name === 'status');
        if (statusParam && Array.isArray(statusParam.enum)) {
          options = statusParam.enum;
        }
      }
      // 没有 enum 时才用默认文章枚举
      if (!options) {
        options = [
          { value: 'draft', label: 'draft', desc: '草稿' },
          { value: 'published', label: 'published', desc: '已发布' },
          { value: 'archived', label: 'archived', desc: '归档' }
        ];
      }
      const dropdown = createCustomDropdown('status', options, '请选择状态');
      statusMount.appendChild(dropdown);
    }
  }, 0);
  // 自动挂载所有带enum的自定义下拉
  setTimeout(() => {
    if (api.params && Array.isArray(api.params)) {
      api.params.forEach(p => {
        if (Array.isArray(p.enum)) {
          const mount = block.querySelector('.custom-dropdown-mount[data-name="' + p.name + '"]');
          if (mount && !mount.hasChildNodes()) {
            const dropdown = createCustomDropdown(p.name, p.enum, '请选择' + (p.desc || p.name));
            mount.appendChild(dropdown);
          }
        }
      });
    }
    // ...原有role/status自动挂载逻辑...
  }, 0);
  return block;
}

function syntaxHighlight(json) {
  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// 带注释的JSON渲染
function renderJsonWithComments(obj, responseFields, path = '', indent = '  ') {
  let html = '';
  if (Array.isArray(obj)) {
    html += '[<br>';
    for (let i = 0; i < obj.length; i++) {
      html += indent + renderJsonWithComments(obj[i], responseFields, path + '[]', indent + '  ');
      if (i < obj.length - 1) html += ',<br>';
    }
    html += '<br>' + indent.slice(2) + ']';
  } else if (typeof obj === 'object' && obj !== null) {
    html += '{<br>';
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let fieldPath = path ? (path.endsWith('[]') ? path + '.' + key : path + '.' + key) : key;
      const field = responseFields.find(f => f.name === fieldPath);
      if (field && field.desc) {
        html += indent + '<span class="json-comment">// ' + field.desc + '</span><br>';
      }
      html += indent + '<span class="json-key">"' + key + '"</span>: ' +
        renderJsonWithComments(obj[key], responseFields, fieldPath, indent + '  ');
      if (i < keys.length - 1) html += ',<br>';
    }
    html += '<br>' + indent.slice(2) + '}';
  } else {
    let val = JSON.stringify(obj);
    if (typeof obj === 'string') {
      html += '<span class="string">' + val + '</span>';
    } else if (typeof obj === 'number') {
      html += '<span class="number">' + val + '</span>';
    } else if (typeof obj === 'boolean') {
      html += '<span class="boolean">' + val + '</span>';
    } else if (obj === null) {
      html += '<span class="null">null</span>';
    } else {
      html += val;
    }
  }
  return html;
}

function renderTokenInput() {
  const tokenDiv = document.createElement('div');
  tokenDiv.className = 'token-input';
  tokenDiv.innerHTML = '<label>Token: <input id="api-token" type="text" value="' + (getToken() || '') + '" placeholder="可选，自动带入 Authorization" style="width:320px"></label>';
  tokenDiv.querySelector('input').oninput = function(e) {
    setToken(e.target.value);
  };
  return tokenDiv;
}

function renderExportButton(apis) {
  const btn = document.createElement('button');
  btn.textContent = '导出接口文档 (JSON)';
  btn.className = 'export-btn';
  btn.onclick = function() {
    const blob = new Blob([JSON.stringify(apis, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-docs.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return btn;
}

function createGroupBlock(group, apis) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'api-group';
  groupDiv.innerHTML = '<h2 class="group-title" style="cursor:pointer;user-select:none">' + group + ' <span class="toggle">[展开]</span></h2>';
  const apisDiv = document.createElement('div');
  apisDiv.className = 'group-apis';
  apisDiv.style.display = 'none'; // 默认收起
  apis.forEach(api => {
    apisDiv.appendChild(createApiBlock(api));
  });
  groupDiv.appendChild(apisDiv);
  // 折叠/展开
  groupDiv.querySelector('.group-title').onclick = function() {
    if (apisDiv.style.display === 'none') {
      apisDiv.style.display = '';
      groupDiv.querySelector('.toggle').textContent = '[收起]';
    } else {
      apisDiv.style.display = 'none';
      groupDiv.querySelector('.toggle').textContent = '[展开]';
    }
  };
  return groupDiv;
}

// 登录表单和用户信息渲染
function renderLoginOrUserInfo(container) {
  container.innerHTML = '';
  const token = getToken();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  if (!token || !userInfo) {
    // 未登录，显示登录表单
    const loginDiv = document.createElement('div');
    loginDiv.className = 'login-form';
    loginDiv.innerHTML = [
      '<form id="login-form" style="display:flex;gap:12px;justify-content:center;align-items:center;margin-bottom:1.5rem;">',
      '  <input name="username" placeholder="用户名" required style="padding:6px 12px;border:1px solid #ccc;border-radius:4px;font-size:1rem;width:140px;">',
      '  <input name="password" type="password" placeholder="密码" required style="padding:6px 12px;border:1px solid #ccc;border-radius:4px;font-size:1rem;width:140px;">',
      '  <button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:4px;padding:6px 18px;font-size:1rem;cursor:pointer;">登录</button>',
      '  <span class="login-error" style="color:#e00;font-size:0.98em;margin-left:10px;"></span>',
      '</form>'
    ].join('');
    container.appendChild(loginDiv);
    const form = loginDiv.querySelector('#login-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const username = form.username.value.trim();
      const password = form.password.value;
      form.querySelector('.login-error').textContent = '';
      form.querySelector('button').disabled = true;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success && data.data && data.data.token) {
          setToken(data.data.token);
          localStorage.setItem('userInfo', JSON.stringify({ ...(data.data.user || { username, role: data.data.role || 'user' }), refreshToken: data.data.refreshToken }));
          renderLoginOrUserInfo(container);
          renderApiExplorer();
        } else {
          form.querySelector('.login-error').textContent = data.error || '登录失败';
        }
      } catch (err) {
        form.querySelector('.login-error').textContent = '网络错误';
      }
      form.querySelector('button').disabled = false;
    };
  } else {
    // 已登录，显示用户信息和登出按钮
    const infoDiv = document.createElement('div');
    infoDiv.className = 'user-info';
    infoDiv.innerHTML = [
      '<div style="display:flex;align-items:center;gap:18px;justify-content:center;margin-bottom:1.5rem;">',
      '  <span style="font-weight:500;color:#2563eb;">已登录：</span>',
      '  <span style="font-size:1.08em;color:#222;">' + userInfo.username + '</span>',
      '  <span style="color:#888;">[' + (userInfo.role || 'user') + ']</span>',
      '  <span style="color:#aaa;font-size:0.98em;">Token:</span>',
      '  <input id="api-token" type="text" value="' + token + '" readonly style="width:320px;padding:6px 12px;border:1px solid #ccc;border-radius:4px;font-size:1em;">',
      (userInfo.refreshToken ? '  <span style="color:#aaa;font-size:0.98em;margin-left:16px;">refreshToken:</span>' +
      '  <input id="api-refresh-token" type="text" value="' + userInfo.refreshToken + '" readonly style="width:320px;padding:6px 12px;border:1px solid #ccc;border-radius:4px;font-size:1em;">' : ''),
      '  <button id="logout-btn" style="background:#fff;border:1px solid #2563eb;color:#2563eb;border-radius:4px;padding:6px 16px;font-size:1em;cursor:pointer;">退出登录</button>',
      '</div>'
    ].join('');
    container.appendChild(infoDiv);
    infoDiv.querySelector('#logout-btn').onclick = function() {
      setToken('');
      localStorage.removeItem('userInfo');
      renderApiExplorer();
    };
  }
}

// 右侧分组目录渲染
function renderGroupSidebar(groups) {
  let sidebar = document.getElementById('api-group-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'api-group-sidebar';
    document.body.appendChild(sidebar);
  }
  sidebar.innerHTML = '<h4>接口分组</h4><ul>' +
    groups.map(function(g) { return '<li data-group="' + g + '">' + g + '</li>'; }).join('') +
    '</ul>';
  // 目录点击跳转
  Array.prototype.forEach.call(sidebar.querySelectorAll('li'), function(li) {
    li.onclick = function() {
      var groupTitles = document.querySelectorAll('.group-title');
      for (var i = 0; i < groupTitles.length; i++) {
        var el = groupTitles[i];
        if (el.textContent.trim().indexOf(li.dataset.group) === 0) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // 高亮
          Array.prototype.forEach.call(sidebar.querySelectorAll('li'), function(x) { x.classList.remove('active'); });
          li.classList.add('active');
          break;
        }
      }
    };
  });
}

async function renderApiExplorer() {
  var apis = loadApiConfig();
  var container = document.getElementById('api-explorer');
  container.innerHTML = '';
  // 登录区块
  var loginBox = document.createElement('div');
  renderLoginOrUserInfo(loginBox);
  container.appendChild(loginBox);
  // 未登录不渲染 API
  if (!getToken() || !localStorage.getItem('userInfo')) return;
  // 按 group 分组
  var groupMap = {};
  apis.forEach(function(api) {
    if (!groupMap[api.group]) groupMap[api.group] = [];
    groupMap[api.group].push(api);
  });
  // 导出按钮
  container.appendChild(renderExportButton(apis));
  // 渲染分组
  Object.keys(groupMap).forEach(function(group) {
    container.appendChild(createGroupBlock(group, groupMap[group]));
  });
  // 渲染右侧分组目录
  renderGroupSidebar(Object.keys(groupMap));
}

window.addEventListener('DOMContentLoaded', renderApiExplorer);
`;

/**
 * 主要的 Worker 处理函数
 */
export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // 自动初始化管理员（本地dev环境下无副作用，已存在则跳过）
    await initAdminUser(env);
    // 提前定义 corsHeaders 变量
    let corsHeaders: (req: Request) => Headers = () => new Headers();
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // 动态首页，集成 API Explorer
      if (path === '/' && method === 'GET') {
        return new Response(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>星霜笔记 API Explorer</title><style>
    body { font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Arial', sans-serif; background: #f7f8fa; margin: 0; }
    .header { display: flex; align-items: center; gap: 18px; margin-top: 2.5rem; margin-bottom: 1.2rem; justify-content: center; }
    .logo { width: 48px; height: 48px; border-radius: 12px; box-shadow: 0 2px 8px #0001; background: #fff; }
    h1 { color: #222; font-size: 2.2rem; margin: 0; }
    .desc { color: #666; font-size: 1.1rem; margin-bottom: 1.5rem; margin-top: 0.2rem; text-align: center; }
    #api-explorer { max-width: 900px; margin: 0 auto; padding: 2rem 0; }
    .token-input { margin-bottom: 1.5rem; text-align: center; }
    .token-input label { font-weight: 500; color: #444; }
    .token-input input { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 340px; margin-left: 8px; }
    .export-btn { background: #fff; border: 1px solid #2563eb; color: #2563eb; border-radius: 4px; padding: 6px 16px; font-size: 1rem; cursor: pointer; margin-bottom: 1.5rem; margin-left: 1rem; transition: background .2s; }
    .export-btn:hover { background: #2563eb; color: #fff; }
    .api-group { margin-bottom: 2.5rem; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px #0001; padding: 1.2rem 2rem; }
    .group-title { font-size: 1.3rem; color: #2563eb; margin: 0 0 1.2rem 0; display: flex; align-items: center; }
    .group-title .toggle { font-size: 1rem; color: #888; margin-left: 10px; cursor: pointer; }
    .api-block { border: 1px solid #f0f0f0; border-radius: 8px; background: #fafbfc; margin-bottom: 1.5rem; padding: 1.2rem 1.5rem; box-shadow: 0 1px 4px #0001; }
    .api-block h3 { margin: 0 0 0.5em 0; font-size: 1.1rem; color: #222; }
    .api-path { color: #2563eb; font-weight: 500; }
    .api-desc { color: #666; font-size: 0.98rem; margin-bottom: 0.7em; }
    .params { margin-bottom: 0.7em; }
    .param-row { display: flex; align-items: center; margin-bottom: 0.5em; }
    .param-row label { min-width: 90px; color: #333; font-weight: 500; }
    .param-row input { flex: 1; padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; margin-right: 8px; }
    .param-type { color: #888; font-size: 0.95em; margin-right: 8px; }
    .param-desc { color: #888; font-size: 0.95em; margin-left: 8px; }
    .param-row .fill-example { margin-left: 8px; background: #f3f6fa; border: 1px solid #2563eb; color: #2563eb; border-radius: 4px; padding: 2px 10px; font-size: 0.95em; cursor: pointer; transition: background .2s; }
    .param-row .fill-example:hover { background: #2563eb; color: #fff; }
    .param-error { margin-left: 8px; }
    .send-btn { background: #2563eb; color: #fff; border: none; border-radius: 4px; padding: 7px 22px; font-size: 1rem; cursor: pointer; margin-top: 0.5em; transition: background .2s; }
    .send-btn:hover { background: #174bbd; }
    .api-response { background: #f8f8f8; border-radius: 6px; padding: 0.8em 1em; margin-top: 1em; font-size: 0.98rem; min-height: 1.5em; color: #222; overflow-x: auto; }
    .json .string { color: #0b7500; }
    .json .number { color: #1c00cf; }
    .json .boolean { color: #aa0d91; }
    .json .null { color: #b5b5b5; }
    .json .key { color: #2563eb; }
    .param-row .role-select {
      min-width: 160px;
      padding: 7px 16px 7px 12px;
      border: 1.5px solid #2563eb;
      border-radius: 6px;
      font-size: 1.08rem;
      color: #2563eb;
      background: linear-gradient(90deg, #fafdff 80%, #eaf2ff 100%);
      box-shadow: 0 2px 8px #2563eb11;
      transition: border .2s, box-shadow .2s, background .2s;
      margin-right: 8px;
      appearance: none;
      font-weight: 500;
      outline: none;
      position: relative;
      background-image: url('data:image/svg+xml;utf8,<svg fill="%232563eb" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7.293 8.293a1 1 0 011.414 0L10 9.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z"/></svg>');
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 18px 18px;
    }
    .param-row .role-select:focus, .param-row .role-select:hover {
      border-color: #174bbd;
      box-shadow: 0 0 0 3px #2563eb22;
      background: linear-gradient(90deg, #f0f6ff 80%, #dbeafe 100%);
    }
    .param-row .role-select option {
      font-weight: 600;
      background: #fafdff;
      color: #2563eb;
    }
    .param-row .role-select option:checked {
      background: #e0edff;
      color: #174bbd;
    }
      .columns-area .param-row {
  display: flex;
  align-items: center;
  background: #f7fafd;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 10px;
  gap: 10px;
  box-shadow: 0 1px 4px #2563eb11;
}
.columns-area input[type="text"] {
  height: 36px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  padding: 0 12px;
  font-size: 1rem;
  min-width: 90px;
  transition: border .2s;
}
.columns-area input[type="text"]:focus {
  border-color: #2563eb;
  outline: none;
}
.columns-area select {
  height: 36px;
  border-radius: 6px;
  border: 1.5px solid #2563eb;
  background: #fff;
  color: #2563eb;
  font-size: 1rem;
  min-width: 80px;
  padding: 0 8px;
  margin-right: 4px;
}
.columns-area label {
  display: flex;
  align-items: center;
  font-size: 0.98em;
  color: #444;
  margin: 0 6px 0 0;
  gap: 2px;
}
.columns-area input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-right: 2px;
}
.columns-area .del-col-btn {
  background: #fff;
  border: 1.5px solid #e11d48;
  color: #e11d48;
  border-radius: 6px;
  padding: 4px 14px;
  font-size: 0.98em;
  cursor: pointer;
  margin-left: 8px;
  transition: background .2s, color .2s, border .2s;
}
.columns-area .del-col-btn:hover {
  background: #e11d48;
  color: #fff;
  border-color: #e11d48;
}
  /* 美化操作类型下拉框和表名输入框 */
.param-row input[type="text"], .param-row select {
  height: 36px;
  border-radius: 6px;
  border: 1.5px solid #2563eb;
  padding: 0 12px;
  font-size: 1rem;
  min-width: 120px;
  transition: border .2s;
  background: #fff;
  color: #2563eb;
  margin-right: 8px;
}
.param-row input[type="text"]:focus, .param-row select:focus {
  border-color: #174bbd;
  outline: none;
}
.param-row label {
  min-width: 70px;
  color: #333;
  font-weight: 500;
  margin-right: 8px;
  font-size: 1.02em;
}
.param-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.7em;
}
  /* 美化 +添加字段 按钮 */
.add-col-btn {
  background: #fff;
  border: 1.5px solid #2563eb;
  color: #2563eb;
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  margin-left: 8px;
  transition: background .2s, color .2s, border .2s;
  box-shadow: 0 1px 4px #2563eb11;
}
.add-col-btn:hover {
  background: #2563eb;
  color: #fff;
  border-color: #174bbd;
}
    #api-group-sidebar {
      position: fixed;
      top: 120px;
      right: 32px;
      width: 180px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 12px #0001;
      padding: 18px 10px 18px 18px;
      z-index: 100;
      max-height: 70vh;
      overflow-y: auto;
      font-size: 1.05em;
      display: block;
    }
    #api-group-sidebar h4 {
      margin: 0 0 10px 0;
      color: #2563eb;
      font-size: 1.08em;
      font-weight: 600;
    }
    #api-group-sidebar ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #api-group-sidebar li {
      margin-bottom: 10px;
      cursor: pointer;
      color: #2563eb;
      border-radius: 5px;
      padding: 4px 8px;
      transition: background .2s;
    }
    #api-group-sidebar li:hover, #api-group-sidebar li.active {
      background: #eaf2ff;
      color: #174bbd;
    }
    @media (max-width: 1100px) {
      #api-group-sidebar { display: none; }
    }
    @media (prefers-color-scheme: dark) {
      .param-row .role-select {
        background: linear-gradient(90deg, #232a3a 80%, #1e293b 100%);
        color: #93c5fd;
        border-color: #60a5fa;
      }
      .param-row .role-select:focus, .param-row .role-select:hover {
        border-color: #3b82f6;
        background: linear-gradient(90deg, #1e293b 80%, #2563eb 100%);
      }
      .param-row .role-select option {
        background: #232a3a;
        color: #93c5fd;
      }
      .param-row .role-select option:checked {
        background: #174bbd;
        color: #fff;
      }
      #api-group-sidebar {
        background: #232a3a;
        color: #93c5fd;
        box-shadow: 0 2px 12px #2563eb22;
      }
      #api-group-sidebar h4 {
        color: #60a5fa;
      }
      #api-group-sidebar li {
        color: #60a5fa;
      }
      #api-group-sidebar li:hover, #api-group-sidebar li.active {
        background: #174bbd;
        color: #fff;
      }
    }
    @media (max-width: 700px) { #api-explorer { padding: 0.5rem; } .api-group { padding: 0.7rem 0.5rem; } .api-block { padding: 0.7rem 0.5rem; } }
    .response-group { margin-top: 1.2em; background: #fcfcfd; border-radius: 8px; box-shadow: 0 1px 4px #0001; padding: 0.5em 1em 1em 1em; }
    .response-title { font-size: 1.08rem; color: #2563eb; margin: 0 0 0.7em 0; display: flex; align-items: center; cursor: pointer; user-select: none; }
    .response-title .toggle { font-size: 1em; color: #888; margin-left: 10px; cursor: pointer; }
    .response-content { transition: all .2s; }
    .curl-group { margin-top: 1.2em; background: #fcfcfd; border-radius: 8px; box-shadow: 0 1px 4px #0001; padding: 0.5em 1em 1em 1em; }
    .curl-title { font-size: 1.08rem; color: #2563eb; margin: 0 0 0.7em 0; display: flex; align-items: center; cursor: pointer; user-select: none; font-weight: 600; }
    .curl-title .toggle { font-size: 1em; color: #888; margin-left: 10px; cursor: pointer; }
    .curl-content { transition: all .2s; }
    .curl-block { font-size: 0.98rem; color: #222; background: none; border: none; padding: 0; margin: 0; white-space: pre-wrap; word-break: break-all; font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'monospace'; }
    .json .key { color: #2563eb; }
    .json-comment { color: #f90; font-style: italic; margin-left: 2px; }
    /* 自定义下拉菜单样式 */
    .custom-dropdown {
      position: relative;
      min-width: 220px;
      display: inline-block;
      border: 1.5px solid #2563eb;
      border-radius: 8px;
      background: linear-gradient(90deg, #fafdff 80%, #eaf2ff 100%);
      box-shadow: 0 2px 8px #2563eb11;
      font-size: 1.08rem;
      color: #2563eb;
      font-weight: 500;
      cursor: pointer;
      margin-right: 8px;
      transition: border .2s, box-shadow .2s, background .2s;
    }
    .custom-dropdown.open, .custom-dropdown:focus {
      border-color: #174bbd;
      box-shadow: 0 0 0 3px #2563eb22;
      background: linear-gradient(90deg, #f0f6ff 80%, #dbeafe 100%);
    }
    .dropdown-display {
      padding: 7px 32px 7px 12px;
      border-radius: 8px;
      min-height: 1.2em;
      user-select: none;
      position: relative;
      background: none;
    }
    .custom-dropdown:after {
      content: '';
      position: absolute;
      right: 12px;
      top: 50%;
      width: 14px;
      height: 14px;
      background: url('data:image/svg+xml;utf8,<svg fill="%232563eb" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7.293 8.293a1 1 0 011.414 0L10 9.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z"/></svg>') no-repeat center/contain;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .dropdown-list {
      display: none;
      position: absolute;
      left: 0; right: 0;
      top: 110%;
      z-index: 10;
      background: #fff;
      border: 1.5px solid #2563eb;
      border-radius: 10px;
      box-shadow: 0 4px 16px #2563eb22;
      margin: 0;
      padding: 4px 0;
      list-style: none;
      font-size: 1.08rem;
      color: #2563eb;
      max-height: 220px;
      overflow-y: auto;
    }
    .custom-dropdown.open .dropdown-list {
      display: block;
    }
    .dropdown-option {
      padding: 7px 18px 7px 14px;
      border-radius: 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: background .18s, color .18s;
    }
    .dropdown-option:hover {
      background: #eaf2ff;
      color: #174bbd;
    }
    .dropdown-option.selected {
      background: #2563eb;
      color: #fff;
    }
    .dropdown-option .opt-main {
      font-weight: 600;
      margin-right: 8px;
    }
    .dropdown-option .opt-desc {
      color: #888;
      font-size: 0.98em;
    }
    .custom-dropdown:focus {
      outline: none;
    }
    @media (prefers-color-scheme: dark) {
      .custom-dropdown {
        background: linear-gradient(90deg, #232a3a 80%, #1e293b 100%);
        color: #93c5fd;
        border-color: #60a5fa;
      }
      .custom-dropdown.open, .custom-dropdown:focus {
        border-color: #3b82f6;
        background: linear-gradient(90deg, #1e293b 80%, #2563eb 100%);
      }
      .dropdown-list {
        background: #232a3a;
        color: #93c5fd;
        border-color: #60a5fa;
      }
      .dropdown-option {
        color: #93c5fd;
      }
      .dropdown-option.selected {
        background: #174bbd;
        color: #fff;
      }
    }
  </style></head><body><div class="header"><img class="logo" src="${LOGO_URL}" alt="logo"><h1>星霜笔记</h1></div><div class="desc">支持 API 分组、Token、参数校验、导出等功能的自定义 API Explorer</div><div id="api-explorer"></div><div id="api-group-sidebar"></div><script>window.apiConfig = ${JSON.stringify(apiConfigJson, null, 2)};</script><script>${apiExplorerJsInline}</script></body></html>`, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders(request)
          },
        });
      }

      // 设置 CORS，允许本地和生产前端
      const allowedOrigins = (env.FRONTEND_URL || "")
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);
      allowedOrigins.push("http://localhost:3000", "https://loushi.dpdns.org", "*");
      corsHeaders = corsMiddleware(allowedOrigins);
      
      // 处理 OPTIONS 请求
      if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }

      // 初始化上下文
      let context: Context = {
        env,
        requestId: crypto.randomUUID(),
      };

      // 应用中间件
      context = await loggingMiddleware(request, env, ctx, context);
      context = await authMiddleware(request, env, ctx, context);

      // 路由处理
      let response: Response | undefined;

      // 认证相关路由
      if (path === '/api/auth/login' && method === 'POST') {
        response = await login(request, env, ctx, corsHeaders);
      } else if (path === '/api/auth/verify' && method === 'POST') {
        response = await verifyToken(request, env, ctx, corsHeaders);
      } else if (path === '/api/auth/refresh' && method === 'POST') {
        response = await refreshToken(request, env, ctx, corsHeaders);
      } else if (path === '/api/auth/logout' && method === 'POST') {
        response = await logout(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await getCurrentUser(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/auth/me' && method === 'PUT') {
        response = await updateUser(request, env, ctx, context, corsHeaders);
      }
      // 新增：发送邮箱验证邮件API
      else if (path === '/api/auth/send-verification-email' && method === 'POST') {
        try {
          const { email } = await request.json() as any;
          if (!email) {
            response = new Response(JSON.stringify({ success: false, error: '缺少邮箱参数' }), { status: 400 });
          } else {
            // 查找用户
            let cursor: string | undefined;
            let username = '';
            do {
              const list = await env.CACHE.list({ cursor });
              cursor = list.cursor;
              for (const key of list.keys) {
                if (key.name.startsWith('user:')) {
                  const u = await env.CACHE.get(key.name, 'json');
                  if (u && u.email === email) {
                    username = u.username;
                    break;
                  }
                }
              }
            } while (cursor && !username);
            if (!username) {
              response = new Response(JSON.stringify({ success: false, error: '用户不存在' }), { status: 404 });
            } else {
              // 生成token并发邮件
              const { v4: uuidv4 } = await import('uuid');
              const token = uuidv4();
              await env.CACHE.put(`email_verify:${token}`, username, { expirationTtl: 3600 });
              await sendVerificationEmail(email, token, env);
              response = new Response(JSON.stringify({ success: true, message: '验证邮件已发送' }), { status: 200 });
            }
          }
        } catch (e) {
          response = new Response(JSON.stringify({ success: false, error: '发送失败' }), { status: 500 });
        }
      }

      // 文件管理路由
      else if (path === '/api/files/upload' && method === 'POST') {
        response = await uploadFile(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/files' && method === 'GET') {
        response = await getFiles(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/files/storage/usage' && method === 'GET') {
        response = await getStorageUsage(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/files/') && method === 'GET') {
        // 修复：支持多级路径，保留 /api/files/ 后的所有内容
        const fileKey = decodeURIComponent(path.replace(/^\/api\/files\//, ''));
        if (!fileKey) {
          response = createErrorResponse('File ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getFile(request, env, ctx, fileKey, corsHeaders);
        }
      } else if (path.startsWith('/api/files/') && method === 'DELETE') {
        // 同理，支持多级路径
        const fileKey = decodeURIComponent(path.replace(/^\/api\/files\//, ''));
        if (!fileKey) {
          response = createErrorResponse('File ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deleteFile(request, env, ctx, context, fileKey, corsHeaders);
        }
      }

      // AI 相关路由
      else if (path === '/api/ai/summary' && method === 'POST') {
        response = await generateSummary(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/ai/tags' && method === 'POST') {
        response = await generateTags(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/ai/analyze' && method === 'POST') {
        response = await analyzeContent(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/ai/translate' && method === 'POST') {
        response = await translateText(request, env, ctx, context, corsHeaders);
      }

      // 搜索路由
      else if (path === '/api/search' && method === 'GET') {
        response = await searchArticles(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/search/advanced' && method === 'POST') {
        response = await advancedSearch(request, env, ctx, context, corsHeaders);
      }

      // 文章管理路由
      else if (path === '/api/articles/check-slug' && method === 'GET') {
        response = await checkSlug(request, env, ctx, context, corsHeaders);
      }
      else if (path === '/api/articles' && method === 'GET') {
        response = await getArticles(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/articles/') && method === 'GET') {
        const slug = path.split('/').pop();
        if (!slug) {
          response = createErrorResponse('Article slug is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getArticleBySlug(request, env, ctx, context, slug, corsHeaders);
        }
      } else if (path === '/api/articles' && method === 'POST') {
        response = await createArticle(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/articles/') && method === 'PUT') {
        const articleId = path.split('/').pop();
        if (!articleId) {
          response = createErrorResponse('Article ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await updateArticle(request, env, ctx, context, articleId, corsHeaders);
        }
      } else if (path.startsWith('/api/articles/') && method === 'DELETE') {
        const articleId = path.split('/').pop();
        if (!articleId) {
          response = createErrorResponse('Article ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deleteArticle(request, env, ctx, context, articleId, corsHeaders);
        }
      }
      

      // 用户管理路由 (仅管理员)
      else if (path === '/api/admin/users' && method === 'GET') {
        response = await getUsers(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/admin/users' && method === 'POST') {
        response = await createUser(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/admin/users/stats' && method === 'GET') {
        response = await getUserStats(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/admin/users/') && method === 'GET') {
        const username = path.split('/').pop();
        if (!username) {
          response = createErrorResponse('Username is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getUserById(request, env, ctx, context, username, corsHeaders);
        }
      } else if (path.startsWith('/api/admin/users/') && method === 'PUT') {
        const username = path.split('/').pop();
        if (!username) {
          response = createErrorResponse('Username is required', 400, undefined, corsHeaders(request));
        } else {
          response = await updateUserRole(request, env, ctx, context, username, corsHeaders);
        }
      } else if (path.startsWith('/api/admin/users/') && method === 'PATCH') {
        const username = path.split('/').pop();
        if (!username) {
          response = createErrorResponse('Username is required', 400, undefined, corsHeaders(request));
        } else {
          response = await toggleUserStatus(request, env, ctx, context, username, corsHeaders);
        }
      } else if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
        const username = path.split('/').pop();
        if (!username) {
          response = createErrorResponse('Username is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deleteUser(request, env, ctx, context, username, corsHeaders);
        }
      }

      // 分类管理路由
      else if (path === '/api/categories' && method === 'GET') {
        response = await getCategories(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/categories' && method === 'POST') {
        response = await createCategory(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/categories/') && method === 'PUT') {
        const categoryId = path.split('/').pop();
        if (!categoryId) {
          response = createErrorResponse('Category ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await updateCategory(request, env, ctx, context, categoryId, corsHeaders);
        }
      } else if (path.startsWith('/api/categories/') && method === 'DELETE') {
        const categoryId = path.split('/').pop();
        if (!categoryId) {
          response = createErrorResponse('Category ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deleteCategory(request, env, ctx, context, categoryId, corsHeaders);
        }
      } else if (path.startsWith('/api/categories/') && method === 'GET') {
        const slug = path.split('/').pop();
        if (!slug) {
          response = createErrorResponse('Category slug is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getCategoryBySlug(request, env, ctx, context, slug, corsHeaders);
        }
      }

      // 标签管理路由
      else if (path === '/api/tags' && method === 'GET') {
        response = await getTags(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/tags' && method === 'POST') {
        response = await createTag(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/tags/') && method === 'PUT') {
        const tagId = path.split('/').pop();
        if (!tagId) {
          response = createErrorResponse('Tag ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await updateTag(request, env, ctx, context, tagId, corsHeaders);
        }
      } else if (path.startsWith('/api/tags/') && method === 'DELETE') {
        const tagId = path.split('/').pop();
        if (!tagId) {
          response = createErrorResponse('Tag ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deleteTag(request, env, ctx, context, tagId, corsHeaders);
        }
      } else if (path.startsWith('/api/tags/') && method === 'GET') {
        const slug = path.split('/').pop();
        if (!slug) {
          response = createErrorResponse('Tag slug is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getTagBySlug(request, env, ctx, context, slug, corsHeaders);
        }
      } else if (path === '/api/tags/order' && method === 'PUT') {
        response = await updateTagsOrder(request, env, ctx, context, corsHeaders);
      }

      // 页面管理路由
      else if (path === '/api/pages' && method === 'GET') {
        response = await getPages(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/pages/') && method === 'GET') {
        const slug = path.split('/').pop();
        if (!slug) {
          response = createErrorResponse('Page slug is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getPageBySlug(request, env, ctx, context, slug, corsHeaders);
        }
      } else if (path === '/api/pages' && method === 'POST') {
        response = await createPage(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/pages/') && method === 'PUT') {
        const pageId = path.split('/').pop();
        if (!pageId) {
          response = createErrorResponse('Page ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await updatePage(request, env, ctx, context, pageId, corsHeaders);
        }
      } else if (path.startsWith('/api/pages/') && method === 'DELETE') {
        const pageId = path.split('/').pop();
        if (!pageId) {
          response = createErrorResponse('Page ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deletePage(request, env, ctx, context, pageId, corsHeaders);
        }
      }

      // 友情链接管理路由
      else if (path === '/api/friend-links' && method === 'GET') {
        response = await getFriendLinks(request, env, ctx, context, corsHeaders);
      } 
      else if (path === '/api/friend-links/status' && method === 'PUT') {
        response = await updateFriendLinksStatus(request, env, ctx, context, corsHeaders);
      }
      else if (path === '/api/friend-links' && method === 'POST') {
        response = await createFriendLink(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/friend-links/') && method === 'PUT') {
        const linkId = path.split('/').pop();
        if (!linkId) {
          response = createErrorResponse('Link ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await updateFriendLink(request, env, ctx, context, linkId, corsHeaders);
        }
      } else if (path.startsWith('/api/friend-links/') && method === 'DELETE') {
        const linkId = path.split('/').pop();
        if (!linkId) {
          response = createErrorResponse('Link ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await deleteFriendLink(request, env, ctx, context, linkId, corsHeaders);
        }
      } else if (path.match(/^\/api\/friend-links\/[\w-]+\/approve$/) && method === 'POST') {
        // /api/friend-links/:id/approve
        const linkId = path.split('/')[3];
        if (!linkId) {
          response = createErrorResponse('Link ID is required', 400, undefined, corsHeaders(request));
        } else {
          response = await approveFriendLink(request, env, ctx, context, linkId, corsHeaders);
        }
      }

      // RSS 订阅路由
      else if (path === '/api/rss' && method === 'GET') {
        response = await generateRSSFeed(request, env, ctx, context);
      } else if (path === '/api/atom' && method === 'GET') {
        response = await generateAtomFeed(request, env, ctx, context);
      } else if (path === '/api/json-feed' && method === 'GET') {
        response = await generateJSONFeed(request, env, ctx, context);
      }

      // 分析统计路由
      else if (path === '/api/analytics/article-view' && method === 'POST') {
        response = await recordArticleView(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/analytics/article-stats' && method === 'GET') {
        response = await getArticleStats(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/analytics/dashboard' && method === 'GET') {
        response = await getDashboardStats(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/analytics/popular-tags' && method === 'GET') {
        response = await getPopularTags(request, env, ctx, context, corsHeaders);
      }

      // 站点地图路由
      else if (path === '/api/sitemap' && method === 'GET') {
        response = await generateSitemapIndex(request, env, ctx, context);
      } else if (path === '/api/sitemap/pages' && method === 'GET') {
        response = await generatePagesSitemap(request, env, ctx, context);
      } else if (path === '/api/sitemap/articles' && method === 'GET') {
        response = await generateArticlesSitemap(request, env, ctx, context);
      } else if (path === '/api/sitemap/categories' && method === 'GET') {
        response = await generateCategoriesSitemap(request, env, ctx, context);
      } else if (path === '/api/sitemap/tags' && method === 'GET') {
        response = await generateTagsSitemap(request, env, ctx, context);
      } else if (path === '/api/sitemap/stats' && method === 'GET') {
        response = await getSitemapStats(request, env, ctx, context);
      } else if (path === '/api/sitemap/generate' && method === 'POST') {
        response = await generateSitemapFiles(request, env, ctx, context);
      } else if (path === '/api/sitemap/files' && method === 'GET') {
        response = await getSitemapFiles(request, env, ctx, context);
      } else if (path === '/api/sitemap/config' && method === 'GET') {
        response = await getSitemapConfig(request, env, ctx, context);
      } else if (path === '/api/sitemap/config' && method === 'POST') {
        response = await updateSitemapConfig(request, env, ctx, context);
      }
      // 站点地图静态路由
      else if (path === '/sitemap.xml' && method === 'GET') {
        response = await generateMainSitemap(request, env, ctx, context);
      } else if (path === '/sitemap-articles.xml' && method === 'GET') {
      response = await generateArticlesSitemap(request, env, ctx, context);
      } else if (path === '/sitemap-pages.xml' && method === 'GET') {
      response = await generatePagesSitemap(request, env, ctx, context);
      } else if (path === '/sitemap-categories.xml' && method === 'GET') {
      response = await generateCategoriesSitemap(request, env, ctx, context);
      } else if (path === '/sitemap-tags.xml' && method === 'GET') {
      response = await generateTagsSitemap(request, env, ctx, context);
      }

      // 健康检查路由
      else if (path === '/api/health' && method === 'GET') {
        response = await getSystemHealth(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/health/detailed' && method === 'GET') {
        response = await getDetailedSystemStatus(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/health/migrate' && method === 'POST') {
        response = await runDatabaseMigration(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/health/backup' && method === 'POST') {
        response = await createDatabaseBackup(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/health/restore' && method === 'POST') {
        response = await restoreDatabaseBackup(request, env, ctx, context, corsHeaders);
      }
      else if (path === '/api/health/custom-migrate' && method === 'POST') {
        response = await customMigrate(request, env, ctx, context, corsHeaders);
      }
      else if (path === '/api/health/list-tables' && method === 'GET') {
        response = await listTables(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/health/drop' && method === 'POST') {
        response = await dropTableOrColumn(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/health/rename-table' && method === 'POST') {
        response = await renameTable(request, env, ctx, context, corsHeaders);
      }

      // 监控路由
      else if (path === '/api/monitoring/performance' && method === 'GET') {
        response = await getPerformanceMetrics(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/health' && method === 'GET') {
        response = await getHealthStatus(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/logs' && method === 'GET') {
        response = await getSystemLogs(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/realtime' && method === 'GET') {
        response = await getRealTimeMetrics(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/alerts' && method === 'GET') {
        response = await getAlertHistory(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/stats' && method === 'GET') {
        response = await getSystemStats(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/cleanup' && method === 'POST') {
        response = await cleanupMetrics(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/monitoring/export' && method === 'GET') {
        response = await exportMetrics(request, env, ctx, context, corsHeaders);
      }

      // 最近活动流路由
      else if (path === '/api/activity' && method === 'GET') {
        response = await getRecentActivity(request, env, ctx, context, corsHeaders);
      }

      // 系统设置相关路由
      else if (path === '/api/settings/public' && method === 'GET') {
        response = await getPublicSettings(request, env, ctx, context, corsHeaders);
      }
      else if (path === '/api/settings' && method === 'GET') {
        response = await getAllSettings(request, env, ctx, context, corsHeaders);
      } else if (path.startsWith('/api/settings/') && method === 'GET') {
        const key = decodeURIComponent(path.split('/').pop()!);
        response = await getSetting(request, env, ctx, context, key, corsHeaders);
      } else if (path.startsWith('/api/settings/') && method === 'PUT') {
        const key = decodeURIComponent(path.split('/').pop()!);
        response = await putSetting(request, env, ctx, context, key, corsHeaders);
      } else if (path.startsWith('/api/settings/') && method === 'DELETE') {
        const key = decodeURIComponent(path.split('/').pop()!);
        response = await deleteSetting(request, env, ctx, context, key, corsHeaders);
      } else if (path === '/api/settings/public' && method === 'GET') {
        response = await getPublicSettings(request, env, ctx, context, corsHeaders);
      }

      // Giscus 相关统计与管理
      else if (path === '/api/giscus/stats' && method === 'GET') {
        response = await getGiscusStats(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/giscus/delete-comment' && method === 'DELETE') {
        response = await deleteGiscusComment(request, env, ctx, context, corsHeaders);
      } else if (path === '/api/giscus/all-titles' && method === 'GET') {
        response = await getGiscusAllTitles(request, env, ctx, context, corsHeaders);
      }

      // 公开用户信息接口
      else if (path.startsWith('/api/users/') && method === 'GET') {
        const username = path.split('/').pop();
        if (!username) {
          response = createErrorResponse('Username is required', 400, undefined, corsHeaders(request));
        } else {
          response = await getPublicUserByUsername(request, env, ctx, context, username, corsHeaders);
        }
      }

      // 公开用户列表接口
      else if (path === '/api/users' && method === 'GET') {
        response = await getAllPublicUsers(request, env, ctx, context, corsHeaders);
      }

      // 注册接口（开放注册）
      else if (path === '/api/auth/register' && method === 'POST') {
        response = await register(request, env, ctx, corsHeaders);
      }

      // 新增：重发验证邮件API
      else if (path === '/api/auth/resend-verification-email' && method === 'POST') {
        response = await resendVerificationEmail(request, env, ctx,context,corsHeaders);
      }

      // 新增：邮箱验证 GET 路由
      else if (path === '/api/auth/verify-email' && method === 'GET') {
        response = await verifyEmail(request, env, ctx, corsHeaders);
      }

      // 如果没有匹配的路由，返回404
      if (!response) {
        const notFoundHeaders = new Headers({
          'Content-Type': 'application/json',
          ...corsHeaders(request)
        });
        return new Response(JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `Route ${method} ${path} not found`
        }), {
          status: 404,
          headers: notFoundHeaders
        });
      }

      // 添加CORS头
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders(request)).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      // 保证所有响应都合并CORS头
      return headersMiddleware(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        }),
        context
      );

    } catch (error) {
      console.error('Worker error:', error);
      // 保证异常响应也合并CORS头
      const errorResponse = createErrorResponse('Internal Server Error', 500, undefined, corsHeaders(request));
      return headersMiddleware(errorResponse, { env, requestId: crypto.randomUUID() });
    }
  },

  // 定时任务处理
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    try {
      console.log('Running scheduled task:', event.cron);
      
      // 清理过期会话
      await cleanupExpiredSessions(env);
      
      // 清理临时文件
      await cleanupTempFiles(env);
      
      // 新增：清理超时未验证邮箱的用户
      await cleanupUnverifiedUsers(env);
      
      console.log('Scheduled task completed');
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  }
};

// 清理过期会话
async function cleanupExpiredSessions(env: Env): Promise<void> {
  try {
    // 这里可以添加清理过期会话的逻辑
    console.log('Cleaning up expired sessions...');
  } catch (error) {
    console.error('Cleanup sessions error:', error);
  }
}

// 清理临时文件
async function cleanupTempFiles(env: Env): Promise<void> {
  try {
    // 这里可以添加清理临时文件的逻辑
    console.log('Cleaning up temp files...');
  } catch (error) {
    console.error('Cleanup temp files error:', error);
  }
}

// 清理未验证邮箱且超时的用户（注册时已写入 pending_cleanup:username，TTL 15分钟）
async function cleanupUnverifiedUsers(env: Env): Promise<void> {
  try {
    let cursor: string | undefined;
    do {
      const list: { keys: { name: string }[]; cursor?: string } = await env.CACHE.list({ prefix: 'pending_cleanup:', cursor });
      cursor = list.cursor;
      for (const key of list.keys) {
        const username = key.name.replace('pending_cleanup:', '');
        const userData = await env.CACHE.get(`user:${username}`, 'json');
        if (userData && userData.is_email_verified === false) {
          await env.CACHE.delete(`user:${username}`);
          // 删除所有 email_verify:token 指向该用户的 token
          let tokenCursor: string | undefined;
          do {
            const tokenList: { keys: { name: string }[]; cursor?: string } = await env.CACHE.list({ prefix: 'email_verify:', cursor: tokenCursor });
            tokenCursor = tokenList.cursor;
            for (const tokenKey of tokenList.keys) {
              const tokenUsername = await env.CACHE.get(tokenKey.name);
              if (tokenUsername === username) {
                await env.CACHE.delete(tokenKey.name);
              }
            }
          } while (tokenCursor);
        }
        // 删除 pending_cleanup:username，无论是否清理
        await env.CACHE.delete(key.name);
      }
    } while (cursor);
  } catch (error) {
    console.error('Cleanup unverified users error:', error);
  }
}

// 新增 headersMiddleware
function headersMiddleware(response: Response, context: Context): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Request-Id', context.requestId);
  headers.set('X-Server-Time', new Date().toISOString());
  headers.set('X-Api-Version', '1.0.0');
  if (context.extraHeaders) {
    Object.entries(context.extraHeaders).forEach(([k, v]) => {
      headers.set(k, v as string);
    });
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
