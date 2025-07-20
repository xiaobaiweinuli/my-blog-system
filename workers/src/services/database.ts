import { User, Article, FileRecord, FriendLink, QueryOptions, PaginatedResponse, WorkersD1Database } from '../types';
import { generateId, calculatePagination } from '../utils';
import { getBeijingTimeISOString } from '../utils/time';

/**
 * 数据库服务类
 */
export class DatabaseService {
  private db: any;
  private cache: KVNamespace;

  constructor(db: any, cache: KVNamespace) {
    this.db = db;
    this.cache = cache;
  }

  // ==================== 用户相关 ====================

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const user = await this.cache.get<User>(`user:${username}`, 'json');
    return user && user.username ? user : null;
  }

  /**
   * 创建新用户
   */
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>): Promise<User> {
    const id = generateId();
    const now = getBeijingTimeISOString();
    const user: User = {
      id,
      ...userData,
      created_at: now,
      updated_at: now,
      last_login_at: undefined, // 修复类型
      is_active: true,
    };
    await this.cache.put(`user:${id}`, JSON.stringify(user));
    return user;
  }

  /**
   * 更新用户（主键为 username）
   */
  async updateUser(username: string, userData: Partial<User>): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const updated = { ...user, ...userData, updated_at: getBeijingTimeISOString() };
    await this.cache.put(`user:${username}`, JSON.stringify(updated));
    return updated;
  }

  /**
   * upsert 用户（主键为 username）
   */
  async upsertUser(userData: Partial<User> & { username: string }): Promise<User> {
    let user = await this.getUserByUsername(userData.username);
    if (user) {
      // 更新
      const updated = { ...user, ...userData, updated_at: getBeijingTimeISOString() };
      await this.cache.put(`user:${userData.username}`, JSON.stringify(updated));
      return updated as User;
    } else {
      // 创建
      const now = getBeijingTimeISOString();
      const newUser: User = {
        id: userData.id || generateId(),
        username: userData.username,
        email: userData.email || '',
        name: userData.name || '',
        password: userData.password || '',
        avatar_url: userData.avatar_url,
        role: userData.role as any || 'user',
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        created_at: now,
        updated_at: now,
        last_login_at: undefined,
        is_active: true,
      };
      await this.cache.put(`user:${userData.username}`, JSON.stringify(newUser));
      return newUser;
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<boolean> {
    await this.cache.delete(`user:${id}`);
    return true;
  }

  /**
   * 获取所有用户
   */
  async getUsers(): Promise<User[]> {
    const users: User[] = [];
    let cursor: string | undefined;
    do {
      const list = await this.cache.list({ cursor });
      cursor = (list as any).cursor;
      for (const key of list.keys) {
        if (key.name.startsWith('user:')) {
          const user = await this.cache.get<User>(key.name, 'json');
          if (user && user.id && user.username) users.push(user);
        }
      }
    } while (cursor);
    return users;
  }

  // ==================== 文章相关 ====================

  /**
   * 创建文章
   */
  async createArticle(articleData: Omit<Article, 'id' | 'created_at' | 'updated_at'> & { tags?: string | string[] }): Promise<Article> {
    const safe = (v: any) => v === undefined ? null : v;
    // 兼容字符串和数组两种 tags
    let tagsArr: string[] = [];
    if (Array.isArray(articleData.tags)) {
      tagsArr = articleData.tags;
    } else if (typeof articleData.tags === 'string') {
      tagsArr = (articleData.tags as string).split(',').map(t => t.trim()).filter(Boolean);
    }
    const article: Article = {
      id: generateId(),
      ...articleData,
      tags: tagsArr,
      created_at: getBeijingTimeISOString(),
      updated_at: getBeijingTimeISOString(),
    };

    await this.db.prepare(`
      INSERT INTO articles (
        id, title, slug, content, excerpt, summary, cover_image, status,
        category, tags, author_username, published_at, created_at, updated_at,
        view_count, like_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      safe(article.id),
      safe(article.title),
      safe(article.slug),
      safe(article.content),
      safe(article.excerpt),
      safe(article.summary),
      safe(article.cover_image),
      safe(article.status),
      safe(article.category),
      safe(JSON.stringify(tagsArr)), // 这里必须 stringify
      safe(article.author_username),
      safe(article.published_at),
      safe(article.created_at),
      safe(article.updated_at),
      safe(article.view_count),
      safe(article.like_count)
    ).run();

    return article;
  }

  /**
   * 根据 slug 获取文章
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    const result = await this.db.prepare(
      'SELECT * FROM articles WHERE slug = ?'
    ).bind(slug).first();

    return result ? this.mapArticle(result) : null;
  }

  /**
   * 获取文章列表
   */
  async getArticles(options: QueryOptions & { status?: string; author_username?: string } = {}): Promise<PaginatedResponse<Article>> {
    const { limit = 20, offset = 0, orderBy = 'created_at DESC', status, author_username } = options;
    
    let whereClause = '';
    const bindings: any[] = [];
    
    if (status) {
      whereClause += ' WHERE status = ?';
      bindings.push(status);
    }
    
    if (author_username) {
      whereClause += whereClause ? ' AND author_username = ?' : ' WHERE author_username = ?';
      bindings.push(author_username);
    }

    // 获取总数
    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as count FROM articles${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.count as number || 0;
    
    // 获取文章列表
    const results = await this.db.prepare(`
      SELECT * FROM articles${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    const articles = results.results.map(this.mapArticle);
    const pagination = calculatePagination(Math.floor(offset / limit) + 1, limit, total);

    return { items: articles, pagination };
  }

  // ==================== 文件相关 ====================

  /**
   * 创建文件记录
   */
  async createFile(fileData: Omit<FileRecord, 'id' | 'uploaded_at'>): Promise<FileRecord> {
    const file: FileRecord = {
      id: generateId(),
      ...fileData,
      uploaded_at: getBeijingTimeISOString(),
    };

    await this.db.prepare(`
      INSERT INTO files (
        id, name, original_name, size, type, url, r2_key,
        uploaded_by_username, uploaded_at, is_public, folder, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      file.id,
      file.name,
      file.original_name,
      file.size,
      file.type,
      file.url,
      file.r2_key,
      file.uploaded_by_username,
      file.uploaded_at,
      file.is_public,
      file.folder,
      JSON.stringify(file.metadata || {})
    ).run();

    return file;
  }

  /**
   * 获取文件列表
   */
  async getFiles(options: QueryOptions & { uploaded_by_username?: string; folder?: string } = {}): Promise<PaginatedResponse<FileRecord>> {
    const { limit = 20, offset = 0, orderBy = 'uploaded_at DESC', uploaded_by_username, folder } = options;
    
    let whereClause = '';
    const bindings: any[] = [];
    
    if (uploaded_by_username) {
      whereClause += ' WHERE uploaded_by_username = ?';
      bindings.push(uploaded_by_username);
    }
    
    if (folder) {
      whereClause += whereClause ? ' AND folder = ?' : ' WHERE folder = ?';
      bindings.push(folder);
    }

    // 获取总数
    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as count FROM files${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.count as number || 0;
    
    // 获取文件列表
    const results = await this.db.prepare(`
      SELECT * FROM files${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    const files = results.results.map(this.mapFile);
    const pagination = calculatePagination(Math.floor(offset / limit) + 1, limit, total);

    return { items: files, pagination };
  }

  // ==================== 友情链接相关 ====================

  /**
   * 创建友情链接
   */
  async createFriendLink(linkData: Omit<FriendLink, 'id' | 'created_at' | 'updated_at'>): Promise<FriendLink> {
    const link: FriendLink = {
      id: generateId(),
      ...linkData,
      created_at: getBeijingTimeISOString(),
      updated_at: getBeijingTimeISOString(),
    };

    await this.db.prepare(`
      INSERT INTO friend_links (
        id, name, url, description, avatar, category, status,
        order_index, created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      link.id,
      link.name,
      link.url,
      link.description,
      link.avatar,
      link.category,
      link.status,
      link.order_index,
      link.created_at,
      link.updated_at,
      link.created_by
    ).run();

    return link;
  }

  /**
   * 获取友情链接列表
   */
  async getFriendLinks(options: QueryOptions & { status?: string; category?: string } = {}): Promise<FriendLink[]> {
    const { orderBy = 'order_index ASC', status, category } = options;
    
    let whereClause = '';
    const bindings: any[] = [];
    
    if (status) {
      whereClause += ' WHERE status = ?';
      bindings.push(status);
    }
    
    if (category) {
      whereClause += whereClause ? ' AND category = ?' : ' WHERE category = ?';
      bindings.push(category);
    }

    const results = await this.db.prepare(`
      SELECT * FROM friend_links${whereClause} ORDER BY ${orderBy}
    `).bind(...bindings).all();

    return results.results.map(this.mapFriendLink);
  }

  // ==================== 映射函数 ====================

  private mapUser(row: any): User {
    return {
      ...row,
      is_active: Boolean(row.is_active),
    };
  }

  private mapArticle(row: any): Article {
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      view_count: Number(row.view_count),
      like_count: Number(row.like_count),
    };
  }

  private mapFile(row: any): FileRecord {
    return {
      ...row,
      size: Number(row.size),
      is_public: Boolean(row.is_public),
      metadata: JSON.parse(row.metadata || '{}'),
    };
  }

  private mapFriendLink(row: any): FriendLink {
    return {
      ...row,
      order_index: Number(row.order_index),
    };
  }
}
