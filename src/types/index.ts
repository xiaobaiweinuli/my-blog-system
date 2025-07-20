// 用户类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  image?: string; // 兼容next-auth的image字段
  role: 'admin' | 'collaborator' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// 文章类型定义
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  summary?: string; // AI 生成的摘要
  coverImage?: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled' | 'auto-saved' | 'manual-saved';
  authorId: string;
  author: User;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
}

// 文件类型定义
export interface FileItem {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
}

// 评论类型定义
export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  articleId?: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// 分类类型定义
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articleCount: number;
}

// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  articleCount: number;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 搜索结果类型
export interface SearchResult {
  articles: Article[];
  pagination: Pagination;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 导航项类型
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

// 友情链接类型定义
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar?: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  order: number;
}
