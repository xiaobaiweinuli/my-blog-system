import { Article, User, Category, Tag, FriendLink } from "@/types"
import { ApiClient } from "./api-client"

/**
 * 数据服务类 - 替代 mock-data.ts
 * 提供真实的数据访问接口，统一管理所有数据操作
 */
export class DataService {
  private static instance: DataService
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  /**
   * 缓存管理
   */
  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  private setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // ==================== 用户相关 ====================

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await ApiClient.getCurrentUser()
      if (response.success) {
        return response.data.user
      }
      return null
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * 获取用户列表（管理员功能）
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
  }): Promise<{ users: User[]; pagination: any }> {
    const cacheKey = `users:${JSON.stringify(params)}`
    const cached = this.getCache<{ users: User[]; pagination: any }>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getUsers(params)
      if (response.success) {
        const result = {
          users: response.data.items,
          pagination: response.data.pagination,
        }
        this.setCache(cacheKey, result, 2 * 60 * 1000) // 2分钟缓存
        return result
      }
      throw new Error('Failed to fetch users')
    } catch (error) {
      console.error('Failed to get users:', error)
      throw error
    }
  }

  // ==================== 文章相关 ====================

  /**
   * 获取文章列表
   */
  async getArticles(options?: {
    page?: number
    limit?: number
    category?: string
    tag?: string
    search?: string
    status?: string
  }): Promise<{ articles: Article[]; pagination: any }> {
    const cacheKey = `articles:${JSON.stringify(options)}`
    const cached = this.getCache<{ articles: Article[]; pagination: any }>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getArticles(options)
      if (response.success) {
        const result = {
          articles: response.data.items,
          pagination: response.data.pagination,
        }
        this.setCache(cacheKey, result, 5 * 60 * 1000) // 5分钟缓存
        return result
      }
      throw new Error('Failed to fetch articles')
    } catch (error) {
      console.error('Failed to get articles:', error)
      throw error
    }
  }

  /**
   * 根据 slug 获取文章
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    const cacheKey = `article:${slug}`
    const cached = this.getCache<Article>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getArticleBySlug(slug)
      if (response.success) {
        const article = response.data.article
        this.setCache(cacheKey, article, 10 * 60 * 1000) // 10分钟缓存
        return article
      }
      return null
    } catch (error) {
      console.error('Failed to get article by slug:', error)
      return null
    }
  }

  /**
   * 创建文章
   */
  async createArticle(articleData: any): Promise<Article> {
    try {
      const response = await ApiClient.createArticle(articleData)
      if (response.success) {
        this.clearCache('articles') // 清除文章列表缓存
        return response.data.article
      }
      throw new Error('Failed to create article')
    } catch (error) {
      console.error('Failed to create article:', error)
      throw error
    }
  }

  /**
   * 更新文章
   */
  async updateArticle(id: string, articleData: any): Promise<Article> {
    try {
      const response = await ApiClient.updateArticle(id, articleData)
      if (response.success) {
        this.clearCache('articles') // 清除文章列表缓存
        this.clearCache(`article:`) // 清除文章详情缓存
        return response.data.article
      }
      throw new Error('Failed to update article')
    } catch (error) {
      console.error('Failed to update article:', error)
      throw error
    }
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<void> {
    try {
      const response = await ApiClient.deleteArticle(id)
      if (response.success) {
        this.clearCache('articles') // 清除文章列表缓存
        this.clearCache(`article:`) // 清除文章详情缓存
      } else {
        throw new Error('Failed to delete article')
      }
    } catch (error) {
      console.error('Failed to delete article:', error)
      throw error
    }
  }

  // ==================== 分类相关 ====================

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories'
    const cached = this.getCache<Category[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getCategories()
      if (response.success) {
        const categories = response.data // 直接就是数组
        this.setCache(cacheKey, categories, 10 * 60 * 1000) // 10分钟缓存
        return categories
      }
      return []
    } catch (error) {
      console.error('Failed to get categories:', error)
      return []
    }
  }

  /**
   * 创建分类
   */
  async createCategory(categoryData: any): Promise<Category> {
    try {
      const response = await ApiClient.createCategory(categoryData)
      if (response.success) {
        this.clearCache('categories') // 清除分类缓存
        return response.data.category
      }
      throw new Error('Failed to create category')
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id: string, categoryData: any): Promise<Category> {
    try {
      const response = await ApiClient.updateCategory(id, categoryData)
      if (response.success) {
        this.clearCache('categories') // 清除分类缓存
        return response.data.category
      }
      throw new Error('Failed to update category')
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const response = await ApiClient.deleteCategory(id)
      if (response.success) {
        this.clearCache('categories') // 清除分类缓存
      } else {
        throw new Error('Failed to delete category')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }

  // ==================== 标签相关 ====================

  /**
   * 获取标签列表
   */
  async getTags(): Promise<Tag[]> {
    const cacheKey = 'tags'
    const cached = this.getCache<Tag[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getTags()
      if (response.success) {
        const tags: Tag[] = response.data // 直接就是标签数组
        this.setCache(cacheKey, tags, 10 * 60 * 1000)
        return tags
      }
      return []
    } catch (error) {
      console.error('获取标签失败:', error)
      return []
    }
  }

  /**
   * 创建标签
   */
  async createTag(tagData: any): Promise<Tag> {
    try {
      const response = await ApiClient.createTag(tagData)
      if (response.success) {
        this.clearCache('tags') // 清除标签缓存
        return response.data.tag
      }
      throw new Error('Failed to create tag')
    } catch (error) {
      console.error('Failed to create tag:', error)
      throw error
    }
  }

  /**
   * 更新标签
   */
  async updateTag(id: string, tagData: any): Promise<Tag> {
    try {
      const response = await ApiClient.updateTag(id, tagData)
      if (response.success) {
        this.clearCache('tags') // 清除标签缓存
        return response.data.tag
      }
      throw new Error('Failed to update tag')
    } catch (error) {
      console.error('Failed to update tag:', error)
      throw error
    }
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<void> {
    try {
      const response = await ApiClient.deleteTag(id)
      if (response.success) {
        this.clearCache('tags') // 清除标签缓存
      } else {
        throw new Error('Failed to delete tag')
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  }

  // ==================== 友情链接相关 ====================

  /**
   * 获取友情链接
   */
  async getFriendLinks(params?: {
    category?: string
    status?: "active" | "inactive" | "pending" | "all"
  }): Promise<FriendLink[]> {
    const cacheKey = `friend-links:${JSON.stringify(params)}`
    const cached = this.getCache<FriendLink[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getFriendLinks(params)
      if (response.success) {
        // 兼容 data 为数组或对象
        const links = Array.isArray(response.data)
          ? response.data
          : (response.data.links || []);
        this.setCache(cacheKey, links, 5 * 60 * 1000) // 5分钟缓存
        return links
      }
      return []
    } catch (error) {
      console.error('Failed to get friend links:', error)
      return []
    }
  }

  /**
   * 创建友情链接
   */
  async createFriendLink(linkData: any): Promise<FriendLink> {
    try {
      const response = await ApiClient.createFriendLink(linkData)
      if (response.success) {
        this.clearCache('friend-links') // 清除友情链接缓存
        return response.data.link
      }
      throw new Error('Failed to create friend link')
    } catch (error) {
      console.error('Failed to create friend link:', error)
      throw error
    }
  }

  /**
   * 更新友情链接
   */
  async updateFriendLink(id: string, linkData: any): Promise<FriendLink> {
    try {
      const response = await ApiClient.updateFriendLink(id, linkData)
      if (response.success) {
        this.clearCache('friend-links') // 清除友情链接缓存
        return response.data.link
      }
      throw new Error('Failed to update friend link')
    } catch (error) {
      console.error('Failed to update friend link:', error)
      throw error
    }
  }

  /**
   * 删除友情链接
   */
  async deleteFriendLink(id: string): Promise<void> {
    try {
      const response = await ApiClient.deleteFriendLink(id)
      if (response.success) {
        this.clearCache('friend-links') // 清除友情链接缓存
      } else {
        throw new Error('Failed to delete friend link')
      }
    } catch (error) {
      console.error('Failed to delete friend link:', error)
      throw error
    }
  }

  /**
   * 获取友情链接分类
   */
  async getFriendLinkCategories(): Promise<string[]> {
    const cacheKey = 'friend-link-categories'
    const cached = this.getCache<string[]>(cacheKey)
    if (cached) return cached

    try {
      const links = await this.getFriendLinks()
      const categories = [...new Set(links.map(link => link.category))]
      this.setCache(cacheKey, categories, 10 * 60 * 1000) // 10分钟缓存
      return categories
    } catch (error) {
      console.error('Failed to get friend link categories:', error)
      return []
    }
  }

  // ==================== 文件相关 ====================

  /**
   * 获取文件列表
   */
  async getFiles(params?: {
    page?: number
    limit?: number
    folder?: string
    type?: string
  }): Promise<{ files: any[]; pagination: any }> {
    const cacheKey = `files:${JSON.stringify(params)}`
    const cached = this.getCache<{ files: any[]; pagination: any }>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getFiles(params)
      if (response.success) {
        const result = {
          files: response.data.items,
          pagination: response.data.pagination,
        }
        this.setCache(cacheKey, result, 2 * 60 * 1000) // 2分钟缓存
        return result
      }
      throw new Error('Failed to fetch files')
    } catch (error) {
      console.error('Failed to get files:', error)
      throw error
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File, folder?: string): Promise<any> {
    try {
      const response = await ApiClient.uploadFile(file, folder)
      if (response.success) {
        this.clearCache('files') // 清除文件列表缓存
        return response.data.file
      }
      throw new Error('Failed to upload file')
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(id: string): Promise<void> {
    try {
      const response = await ApiClient.deleteFile(id)
      if (response.success) {
        this.clearCache('files') // 清除文件列表缓存
      } else {
        throw new Error('Failed to delete file')
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  // ==================== 页面相关 ====================

  /**
   * 获取页面列表
   */
  async getPages(): Promise<any[]> {
    const cacheKey = 'pages'
    const cached = this.getCache<any[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getPages()
      if (response.success) {
        const pages = response.data.pages
        this.setCache(cacheKey, pages, 5 * 60 * 1000) // 5分钟缓存
        return pages
      }
      return []
    } catch (error) {
      console.error('Failed to get pages:', error)
      return []
    }
  }

  /**
   * 根据 slug 获取页面
   */
  async getPageBySlug(slug: string): Promise<any | null> {
    const cacheKey = `page:${slug}`
    const cached = this.getCache<any>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getPageBySlug(slug)
      if (response.success) {
        const page = response.data.page
        this.setCache(cacheKey, page, 10 * 60 * 1000) // 10分钟缓存
        return page
      }
      return null
    } catch (error) {
      console.error('Failed to get page by slug:', error)
      return null
    }
  }

  /**
   * 创建页面
   */
  async createPage(pageData: any): Promise<any> {
    try {
      const response = await ApiClient.createPage(pageData)
      if (response.success) {
        this.clearCache('pages') // 清除页面列表缓存
        return response.data.page
      }
      throw new Error('Failed to create page')
    } catch (error) {
      console.error('Failed to create page:', error)
      throw error
    }
  }

  /**
   * 更新页面
   */
  async updatePage(id: string, pageData: any): Promise<any> {
    try {
      const response = await ApiClient.updatePage(id, pageData)
      if (response.success) {
        this.clearCache('pages') // 清除页面列表缓存
        this.clearCache(`page:`) // 清除页面详情缓存
        return response.data.page
      }
      throw new Error('Failed to update page')
    } catch (error) {
      console.error('Failed to update page:', error)
      throw error
    }
  }

  /**
   * 删除页面
   */
  async deletePage(id: string): Promise<void> {
    try {
      const response = await ApiClient.deletePage(id)
      if (response.success) {
        this.clearCache('pages') // 清除页面列表缓存
        this.clearCache(`page:`) // 清除页面详情缓存
      } else {
        throw new Error('Failed to delete page')
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
      throw error
    }
  }

  // ==================== 搜索相关 ====================

  /**
   * 搜索文章
   */
  async searchArticles(query: string, params?: {
    page?: number
    limit?: number
    category?: string
    tag?: string
  }): Promise<{ articles: Article[]; pagination: any }> {
    try {
      const response = await ApiClient.searchArticles(query, params)
      if (response.success) {
        return {
          articles: response.data.items,
          pagination: response.data.pagination,
        }
      }
      throw new Error('Failed to search articles')
    } catch (error) {
      console.error('Failed to search articles:', error)
      throw error
    }
  }

  // ==================== 统计相关 ====================

  /**
   * 获取仪表板统计
   */
  async getDashboardStats(): Promise<any> {
    const cacheKey = 'dashboard-stats'
    const cached = this.getCache<any>(cacheKey)
    if (cached) return cached

    try {
      const response = await ApiClient.getDashboardStats()
      if (response.success) {
        const stats = response.data
        this.setCache(cacheKey, stats, 2 * 60 * 1000) // 2分钟缓存
        return stats
      }
      throw new Error('Failed to fetch dashboard stats')
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      throw error
    }
  }

  /**
   * 记录文章浏览
   */
  async recordArticleView(articleId: string): Promise<void> {
    try {
      await ApiClient.recordArticleView(articleId)
    } catch (error) {
      console.error('Failed to record article view:', error)
      // 不抛出错误，避免影响用户体验
    }
  }

  // ==================== AI 相关 ====================

  /**
   * 生成文章摘要
   */
  async generateSummary(content: string, maxLength?: number): Promise<string> {
    try {
      const response = await ApiClient.generateSummary(content, maxLength)
      if (response.success) {
        return response.data.summary
      }
      throw new Error('Failed to generate summary')
    } catch (error) {
      console.error('Failed to generate summary:', error)
      throw error
    }
  }

  /**
   * 生成标签
   */
  async generateTags(title: string, content: string): Promise<string[]> {
    try {
      const response = await ApiClient.generateTags(title, content)
      if (response.success) {
        return response.data.tags
      }
      throw new Error('Failed to generate tags')
    } catch (error) {
      console.error('Failed to generate tags:', error)
      throw error
    }
  }

  /**
   * 分析内容
   */
  async analyzeContent(title: string, content: string): Promise<any> {
    try {
      const response = await ApiClient.analyzeContent(title, content)
      if (response.success) {
        return response.data.analysis
      }
      throw new Error('Failed to analyze content')
    } catch (error) {
      console.error('Failed to analyze content:', error)
      throw error
    }
  }

  // ==================== 最近活动相关 ====================

  /**
   * 获取最近活动
   */
  async getRecentActivity(): Promise<any[]> {
    try {
      const response = await ApiClient.getRecentActivity()
      if (response.success) {
        return response.data
      }
      return []
    } catch (error) {
      console.error('Failed to get recent activity:', error)
      return []
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// 导出单例实例
export const dataService = DataService.getInstance()

// 为了向后兼容，保留原有的函数接口
export const getArticles = dataService.getArticles.bind(dataService)
export const getArticleBySlug = dataService.getArticleBySlug.bind(dataService)
export const getUsers = dataService.getUsers.bind(dataService)
export const getFriendLinks = dataService.getFriendLinks.bind(dataService)
export const getFriendLinkCategories = dataService.getFriendLinkCategories.bind(dataService) 