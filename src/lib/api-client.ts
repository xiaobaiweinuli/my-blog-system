import { secureFetch } from "./utils/secure-fetch";
import type { Tag } from "@/types"
// API客户端配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://loushi.dpdns.org'

// 请求配置
const defaultHeaders = {
  'Content-Type': 'application/json',
}

// 错误处理
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getApiBaseUrl(endpoint: string) {
  // 绝对路径直接返回
  if (/^https?:\/\//.test(endpoint)) return endpoint;
  
  // 所有请求都指向已部署的Cloudflare Workers后端
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://loushi.dpdns.org';
  return base.replace(/\/$/, '') + endpoint;
}

function isFormData(body: any): boolean {
  if (!body) return false
  // 兼容浏览器和 Node.js 的 FormData
  return (
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof body === 'object' &&
      typeof body.append === 'function' &&
      typeof body.get === 'function' &&
      typeof body.has === 'function')
  )
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiBaseUrl(endpoint);

  // 判断是否是 FormData，如果是就不要加 Content-Type
  let headers = { ...defaultHeaders, ...options.headers }
  if (isFormData(options.body)) {
    delete (headers as any)['Content-Type']
  }

  const config: RequestInit = {
    headers,
    ...options,
  }

  try {
    const response = await secureFetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    )
  }
}

// 用户类型（可根据需要调整字段）
export interface UserInfo {
  id?: string
  username: string
  name?: string
  email?: string
  role?: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  created_at?: string
  updated_at?: string
  last_login_at?: string
  is_active?: boolean
}

// API客户端类
export class ApiClient {
  // 认证相关
  static async login(code: string) {
    return request<{ success: boolean; data: { user: any; token: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  static async verifyToken() {
    return request<{ success: boolean; data: { user: any } }>('/api/auth/verify', {
      method: 'POST',
    })
  }

  static async refreshToken() {
    return request<{ success: boolean; data: { token: string } }>('/api/auth/refresh', {
      method: 'POST',
    })
  }

  static async logout() {
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    })
  }

  static async getCurrentUser() {
    return request<{ success: boolean; data: { user: any } }>('/api/auth/me')
  }

  // 文章相关
  static async getArticles(params?: {
    page?: number
    limit?: number
    status?: string
    category?: string
    tag?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.tag) searchParams.set('tag', params.tag)
    if (params?.search) searchParams.set('search', params.search)

    return request<{ success: boolean; data: { items: any[]; pagination: any } }>(
      `/api/articles?${searchParams.toString()}`
    )
  }

  static async getArticleBySlug(slug: string) {
    return request<{ success: boolean; data: { article: any } }>(`/api/articles/${slug}`)
  }

  static async createArticle(articleData: any) {
    return request<{ success: boolean; data: { article: any } }>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    })
  }

  static async updateArticle(id: string, articleData: any) {
    return request<{ success: boolean; data: { article: any } }>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    })
  }

  static async deleteArticle(id: string) {
    return request<{ success: boolean }>(`/api/articles/${id}`, {
      method: 'DELETE',
    })
  }

  // 分类相关
  static async getCategories() {
    return request<{ success: boolean; data: any[] }>('/api/categories')
  }

  static async createCategory(categoryData: any) {
    return request<{ success: boolean; data: { category: any } }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  static async updateCategory(id: string, categoryData: any) {
    return request<{ success: boolean; data: { category: any } }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  static async deleteCategory(id: string) {
    return request<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // 标签相关
  static async getTags() {
    return request<{ success: boolean; data: Tag[] }>('/api/tags')
  }

  static async createTag(tagData: any) {
    return request<{ success: boolean; data: { tag: any } }>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    })
  }

  static async updateTag(id: string, tagData: any) {
    return request<{ success: boolean; data: { tag: any } }>(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tagData),
    })
  }

  static async deleteTag(id: string) {
    return request<{ success: boolean }>(`/api/tags/${id}`, {
      method: 'DELETE',
    })
  }

  // 文件相关
  static async uploadFile(file: File, folder?: string, isPublic?: boolean) {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) formData.append('folder', folder)
    if (typeof isPublic === 'boolean') formData.append('isPublic', isPublic ? 'true' : 'false')
    return request<{ success: boolean; data: any }>('/api/files/upload', {
      method: 'POST',
      headers: {},
      body: formData,
    })
  }

  static async getFiles(params?: {
    page?: number
    limit?: number
    folder?: string
    type?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.folder) searchParams.set('folder', params.folder)
    if (params?.type) searchParams.set('type', params.type)

    return request<{ success: boolean; data: { items: any[]; pagination: any } }>(
      `/api/files?${searchParams.toString()}`
    )
  }

  static async deleteFile(id: string) {
    return request<{ success: boolean }>(`/api/files/${id}`, {
      method: 'DELETE',
    })
  }

  // 友情链接相关
  static async getFriendLinks(params?: { status?: string; category?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.category) searchParams.set('category', params.category)

    return request<{ success: boolean; data: { links: any[] } }>(
      `/api/friend-links?${searchParams.toString()}`
    )
  }

  static async createFriendLink(linkData: any) {
    return request<{ success: boolean; data: { link: any } }>('/api/friend-links', {
      method: 'POST',
      body: JSON.stringify(linkData),
    })
  }

  static async updateFriendLink(id: string, linkData: any) {
    return request<{ success: boolean; data: { link: any } }>(`/api/friend-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(linkData),
    })
  }

  static async deleteFriendLink(id: string) {
    return request<{ success: boolean }>(`/api/friend-links/${id}`, {
      method: 'DELETE',
    })
  }

  // 页面相关
  static async getPages() {
    return request<{ success: boolean; data: { pages: any[] } }>('/api/pages')
  }

  static async getPageBySlug(slug: string) {
    return request<{ success: boolean; data: { page: any } }>(`/api/pages/${slug}`)
  }

  static async createPage(pageData: any) {
    return request<{ success: boolean; data: { page: any } }>('/api/pages', {
      method: 'POST',
      body: JSON.stringify(pageData),
    })
  }

  static async updatePage(id: string, pageData: any) {
    return request<{ success: boolean; data: { page: any } }>(`/api/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pageData),
    })
  }

  static async deletePage(id: string) {
    return request<{ success: boolean }>(`/api/pages/${id}`, {
      method: 'DELETE',
    })
  }

  // AI相关
  static async generateSummary(content: string, maxLength?: number) {
    return request<{ success: boolean; data: { summary: string; usage: any } }>('/api/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ content, maxLength }),
    })
  }

  static async generateTags(title: string, content: string) {
    return request<{ success: boolean; data: { tags: string[]; usage: any } }>('/api/ai/tags', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    })
  }

  static async analyzeContent(title: string, content: string) {
    return request<{ success: boolean; data: { analysis: any; usage: any } }>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    })
  }

  // 搜索相关
  static async searchArticles(query: string, params?: {
    page?: number
    limit?: number
    category?: string
    tag?: string
  }) {
    const searchParams = new URLSearchParams({ q: query })
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.tag) searchParams.set('tag', params.tag)

    return request<{ success: boolean; data: { items: any[]; pagination: any } }>(
      `/api/search?${searchParams.toString()}`
    )
  }

  // 分析统计相关
  static async getDashboardStats() {
    return request<{ success: boolean; data: { stats: any } }>('/api/analytics/dashboard')
  }

  static async recordArticleView(articleId: string) {
    return request<{ success: boolean }>('/api/analytics/article-view', {
      method: 'POST',
      body: JSON.stringify({ articleId }),
    })
  }

  // 用户管理相关（仅管理员）
  static async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.role) searchParams.set('role', params.role)

    return request<{ success: boolean; data: { items: any[]; pagination: any } }>(
      `/api/admin/users?${searchParams.toString()}`
    )
  }

  static async updateUserRole(userId: string, role: string) {
    return request<{ success: boolean; data: { user: any } }>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  }

  static async toggleUserStatus(userId: string) {
    return request<{ success: boolean; data: { user: any } }>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
    })
  }

  static async deleteUser(userId: string) {
    return request<{ success: boolean }>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
  }

  // 最近活动相关
  static async getRecentActivity() {
    return request<{ success: boolean; data: any[] }>(
      '/api/activity'
    )
  }

  // 获取公开用户信息（游客可用）
  static async getUserByUsername(username: string) {
    return request<{ success: boolean; data: UserInfo }>(`/api/users/${encodeURIComponent(username)}`)
  }

  // 获取指定用户的完整信息（管理员用）
  static async getAdminUserByUsername(username: string) {
    return request<{ success: boolean; data: UserInfo }>(`/api/admin/users/${encodeURIComponent(username)}`)
  }
}

export { ApiError } 