/**
 * Cloudflare Workers 基础类型定义和工具函数
 */

// 基础 Cloudflare Workers 类型定义
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
  withSession<T>(callback: (session: D1Database) => Promise<T>): Promise<T>
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  error?: string
  meta: {
    duration: number
    size_after: number
    rows_read: number
    rows_written: number
    last_row_id?: number
    changed_db?: boolean
  }
}

export interface D1ExecResult {
  count: number
  duration: number
}

export interface R2Bucket {
  head(key: string): Promise<R2Object | null>
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>
  delete(key: string): Promise<void>
  list(options?: R2ListOptions): Promise<R2Objects>
  createMultipartUpload(key: string, options?: R2MultipartOptions): Promise<R2MultipartUpload>
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload
}

export interface R2Object {
  key: string
  version: string
  size: number
  etag: string
  httpEtag: string
  uploaded: Date
  checksums: R2Checksums
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
  range?: R2Range
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream
  bodyUsed: boolean
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
  blob(): Promise<Blob>
}

export interface R2GetOptions {
  onlyIf?: R2Conditional
  range?: R2Range
}

export interface R2PutOptions {
  onlyIf?: R2Conditional
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
  md5?: ArrayBuffer | string
  sha1?: ArrayBuffer | string
  sha256?: ArrayBuffer | string
  sha384?: ArrayBuffer | string
  sha512?: ArrayBuffer | string
}

export interface R2ListOptions {
  limit?: number
  prefix?: string
  cursor?: string
  delimiter?: string
  startAfter?: string
  include?: ('httpMetadata' | 'customMetadata')[]
}

export interface R2Objects {
  objects: R2Object[]
  truncated: boolean
  cursor?: string
  delimitedPrefixes: string[]
}

export interface R2Conditional {
  etagMatches?: string
  etagDoesNotMatch?: string
  uploadedBefore?: Date
  uploadedAfter?: Date
}

export interface R2Range {
  offset?: number
  length?: number
  suffix?: number
}

export interface R2HTTPMetadata {
  contentType?: string
  contentLanguage?: string
  contentDisposition?: string
  contentEncoding?: string
  cacheControl?: string
  cacheExpiry?: Date
}

export interface R2Checksums {
  md5?: ArrayBuffer
  sha1?: ArrayBuffer
  sha256?: ArrayBuffer
  sha384?: ArrayBuffer
  sha512?: ArrayBuffer
}

export interface R2MultipartUpload {
  key: string
  uploadId: string
  abort(): Promise<void>
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | string): Promise<R2UploadedPart>
}

export interface R2MultipartOptions {
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
}

export interface R2UploadedPart {
  partNumber: number
  etag: string
}

export interface KVNamespace {
  get(key: string, options?: KVGetOptions): Promise<string | null>
  get(key: string, type: 'text'): Promise<string | null>
  get(key: string, type: 'json'): Promise<any>
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>
  get(key: string, type: 'stream'): Promise<ReadableStream | null>
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>
  delete(key: string): Promise<void>
  list(options?: KVListOptions): Promise<KVListResult>
}

export interface KVGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream'
  cacheTtl?: number
}

export interface KVPutOptions {
  expiration?: number
  expirationTtl?: number
  metadata?: any
}

export interface KVListOptions {
  limit?: number
  prefix?: string
  cursor?: string
}

export interface KVListResult {
  keys: KVKey[]
  list_complete: boolean
  cursor?: string
}

export interface KVKey {
  name: string
  expiration?: number
  metadata?: any
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void
  passThroughOnException(): void
}

export interface Ai {
  run(model: string, options: AiOptions): Promise<AiResponse>
}

export interface AiOptions {
  prompt?: string
  messages?: AiMessage[]
  stream?: boolean
  max_tokens?: number
  temperature?: number
  [key: string]: any
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiResponse {
  response?: string
  [key: string]: any
}

// 环境变量接口
export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  CACHE: KVNamespace
  SESSIONS: KVNamespace
  AI: Ai
  
  // 环境变量
  JWT_SECRET: string
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string
  
  // 可选的环境变量
  ADMIN_EMAILS?: string
  COLLABORATOR_EMAILS?: string
  OPENAI_API_KEY?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_API_TOKEN?: string
}

// 请求上下文接口
export interface RequestContext {
  env: Env
  ctx: ExecutionContext
  request: Request
}

/**
 * 获取请求上下文（模拟实现）
 * 在实际的 Cloudflare Workers 环境中，这个函数会从运行时获取真实的上下文
 */
export function getRequestContext(): RequestContext {
  // 这是一个模拟实现，在实际的 Workers 环境中会被替换
  throw new Error('getRequestContext should only be called in Cloudflare Workers environment')
}

/**
 * 检查是否在 Cloudflare Workers 环境中运行
 */
export function isCloudflareWorkers(): boolean {
  return typeof globalThis !== 'undefined' && 
         'caches' in globalThis && 
         'CloudflareWorkersGlobalScope' in globalThis
}

/**
 * 获取环境变量（类型安全）
 */
export function getEnv(): Env {
  if (!isCloudflareWorkers()) {
    throw new Error('Environment variables are only available in Cloudflare Workers')
  }
  
  // 在实际环境中，这里会返回真实的环境变量
  return {} as Env
}

/**
 * 创建响应对象的工具函数
 */
export function createResponse(data: any, status: number = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  })
}

/**
 * 创建错误响应
 */
export function createErrorResponse(message: string, status: number = 500): Response {
  return createResponse({
    success: false,
    error: message,
  }, status)
}

/**
 * 创建成功响应
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return createResponse({
    success: true,
    data,
  }, status)
}
