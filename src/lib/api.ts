import { ApiResponse, PaginatedResponse, Post, User } from '@/types';
import { createError, handleClientError, isAppError } from './error';

declare global {
  interface Window {
    env: {
      NEXT_PUBLIC_API_BASE_URL?: string;
    };
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions<T = any> {
  method?: HttpMethod;
  body?: T;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Base API client with TypeScript support and error handling
 */
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set default headers for all requests
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Make a request with proper typing and error handling
   */
  /**
   * Make a request with proper typing and error handling
   */
  async request<T = any, R = any>(
    endpoint: string,
    options: ApiRequestOptions<T> = { method: 'GET' }
  ): Promise<ApiResponse<R>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    // Prepare headers
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Handle authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Prepare request config
    const config: RequestInit = {
      method,
      headers,
      cache: options.cache,
      next: options.next,
    };

    // Add body if present
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 204 No Content responses
      if (response.status === 204) {
        return { success: true } as unknown as ApiResponse<R>;
      }
      
      return await this.handleResponse<R>(response);
    } catch (error) {
      // If it's already an AppError, just rethrow it
      if (isAppError(error)) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError) {
        throw createError('SERVICE_UNAVAILABLE', 'Network error. Please check your connection.');
      }
      
      // For other errors, use the client error handler
      throw handleClientError(error);
    }
  }

  /**
   * Handle API response with proper error handling
   */
  /**
   * Handle API response with proper error handling
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: ApiResponse<T>;
    
    try {
      data = await response.json();
    } catch (error) {
      // Handle JSON parse error
      throw createError('INTERNAL_SERVER_ERROR', 'Invalid JSON response from server');
    }

    if (!response.ok) {
      // Handle API errors with proper error codes
      const errorMessage = data?.error || 'API request failed';
      
      switch (response.status) {
        case 400:
          throw createError('VALIDATION_ERROR', errorMessage);
        case 401:
          throw createError('UNAUTHORIZED', 'Please log in to continue');
        case 403:
          throw createError('INSUFFICIENT_PERMISSIONS', 'You do not have permission to perform this action');
        case 404:
          throw createError('NOT_FOUND', 'The requested resource was not found');
        case 409:
          throw createError('ALREADY_EXISTS', errorMessage);
        case 429:
          throw createError('TOO_MANY_REQUESTS', 'Too many requests, please try again later');
        case 500:
          throw createError('INTERNAL_SERVER_ERROR', 'An internal server error occurred');
        default:
          throw createError('SERVICE_UNAVAILABLE', 'Service is currently unavailable');
      }
    }

    return data;
  }

  // Convenience methods for common HTTP methods
  async get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<never, T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any, R = any>(
    endpoint: string,
    body: T,
    options?: Omit<ApiRequestOptions<T>, 'method' | 'body'>
  ) {
    return this.request<T, R>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any, R = any>(
    endpoint: string,
    body: T,
    options?: Omit<ApiRequestOptions<T>, 'method' | 'body'>
  ) {
    return this.request<T, R>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = any, R = any>(
    endpoint: string,
    body: Partial<T>,
    options?: Omit<ApiRequestOptions<Partial<T>>, 'method' | 'body'>
  ) {
    return this.request<Partial<T>, R>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<never, T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Blog post specific methods
  async getPosts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    tag?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tag) searchParams.set('tag', params.tag);

    const queryString = searchParams.toString();
    const endpoint = `/api/posts${queryString ? `?${queryString}` : ''}`;
    
    return this.get<PaginatedResponse<Post>>(endpoint);
  }

  async getPost(slug: string) {
    return this.get<Post>(`/api/posts/${slug}`);
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.post<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>, Post>('/api/posts', post);
  }

  async updatePost(slug: string, post: Partial<Post>) {
    return this.patch<Partial<Post>, Post>(`/api/posts/${slug}`, post);
  }

  async deletePost(slug: string) {
    return this.delete<{ success: boolean }>(`/api/posts/${slug}`);
  }

  // User authentication methods
  async login(credentials: { username: string; password: string }) {
    return this.post<{ username: string; password: string }, { user: User; token: string }>(
      '/api/auth/login',
      credentials
    );
  }

  async getCurrentUser() {
    return this.get<User>('/api/auth/me');
  }
}

// Get API base URL with fallbacks
const getApiBaseUrl = (): string => {
  // Check for environment variable (Next.js)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Check for window.env (client-side)
  if (typeof window !== 'undefined' && window.env?.NEXT_PUBLIC_API_BASE_URL) {
    return window.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Default to relative path if no base URL is set
  return '';
};

// Create a singleton instance
export const api = new ApiClient(getApiBaseUrl());

/**
 * Hook for making API requests in React components
 */
export function useApi() {
  return api;
}
