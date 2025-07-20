import { Article } from '@/types'
import { secureFetch } from '@/lib/utils/secure-fetch'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface CreateArticleData {
  title: string
  content: string
  excerpt?: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived' | 'scheduled' | 'auto-saved' | 'manual-saved'
  cover_image?: string
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string
}

export interface ArticleListParams {
  page?: number
  limit?: number
  status?: string
  category?: string
  author_id?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 文章 API 客户端
 */
export class ArticlesAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * 创建文章
   */
  async createArticle(data: CreateArticleData): Promise<ApiResponse<Article>> {
    try {
      const response = await secureFetch(`${this.baseUrl}/api/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建文章失败: 网络或认证错误',
      }
    }
  }

  /**
   * 获取文章列表
   */
  async getArticles(params: ArticleListParams = {}): Promise<ApiResponse<PaginatedResponse<Article>>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))
    if (params.status) searchParams.set('status', params.status)
    if (params.category) searchParams.set('category', params.category)
    if (params.author_id) searchParams.set('author_id', params.author_id)

    const response = await secureFetch(`${this.baseUrl}/api/articles?${searchParams}`)
    return response.json()
  }

  /**
   * 根据 slug 获取文章
   */
  async getArticleBySlug(slug: string): Promise<ApiResponse<Article>> {
    const response = await secureFetch(`${this.baseUrl}/api/articles/${slug}`)
    return response.json()
  }

  /**
   * 更新文章
   */
  async updateArticle(id: string, data: Partial<CreateArticleData>): Promise<ApiResponse<Article>> {
    const response = await secureFetch(`${this.baseUrl}/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await secureFetch(`${this.baseUrl}/api/articles/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  }

  /**
   * 搜索文章
   */
  async searchArticles(query: string, params: any = {}): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams({ q: query, ...params })
    const response = await secureFetch(`${this.baseUrl}/api/search?${searchParams}`)
    return response.json()
  }
}

// 默认实例
export const articlesAPI = new ArticlesAPI()

// 便捷函数
export const {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  searchArticles,
} = articlesAPI

/**
 * 数据格式转换函数
 * 将后端返回的数据格式转换为前端期望的格式
 */
export function transformArticleFromAPI(apiArticle: any): Article {
  return {
    id: apiArticle.id,
    title: apiArticle.title,
    slug: apiArticle.slug,
    content: apiArticle.content,
    excerpt: apiArticle.excerpt,
    summary: apiArticle.summary,
    coverImage: apiArticle.cover_image,
    tags: Array.isArray(apiArticle.tags) ? apiArticle.tags : [],
    category: apiArticle.category,
    status: apiArticle.status,
    authorId: apiArticle.author_id,
    author: {
      id: apiArticle.author_id,
      name: 'Unknown', // 需要从用户 API 获取
      email: '',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    publishedAt: apiArticle.published_at ? new Date(apiArticle.published_at) : undefined,
    createdAt: new Date(apiArticle.created_at),
    updatedAt: new Date(apiArticle.updated_at),
    viewCount: apiArticle.view_count || 0,
    likeCount: apiArticle.like_count || 0,
  }
}

/**
 * 将前端文章数据转换为 API 格式
 */
export function transformArticleToAPI(article: Partial<Article>): Partial<CreateArticleData> {
  return {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    category: article.category,
    tags: article.tags,
    status: article.status as 'draft' | 'published' | 'archived',
    cover_image: article.coverImage,
  }
}
