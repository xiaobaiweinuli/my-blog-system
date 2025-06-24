// Application-specific types that don't depend on NextAuth
// NextAuth types are defined in next-auth.d.ts

// Blog post related types
export interface PostMetadata {
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  tags: string[];
  language: string;
  date: string;
  status?: 'draft' | 'published' | 'archived';
  isSticky?: boolean;
  [key: string]: any;
}

export interface Post extends PostMetadata {
  content: string;
  updatedAt?: string;
  path?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string | number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  [key: string]: any; // Allow additional properties
}

// Extended error response type
export interface ApiErrorResponse extends Omit<ApiResponse, 'data'> {
  error: string;
  code: string | number;
  details?: Record<string, unknown>;
}

// Error handling
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// File related types
export interface FileInfo {
  name: string;
  path: string;
  download_url: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  html_url: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tag?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form related types
export interface FormField<T = any> {
  value: T;
  error?: string;
  required?: boolean;
  validate?: (value: T) => string | undefined;
}

export interface FormState {
  [key: string]: FormField<any>;
}

// Export the UserRole type for use in the application
export type { UserRole } from './next-auth';

// Re-export NextAuth types for convenience
export type { User, Session } from 'next-auth';
