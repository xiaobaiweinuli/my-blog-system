import { createError } from './error';
import { Readable } from 'stream';

// Types for R2 objects
export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  version: string;
  uploaded: string;
  httpMetadata: {
    contentType?: string;
    contentEncoding?: string | null;
    contentDisposition?: string | null;
    contentLanguage?: string | null;
    cacheControl?: string | null;
    cacheExpiry?: Date | null;
  };
  customMetadata?: Record<string, string>;
}

// Type for R2 list response
export type R2ListResponse = R2Object[];

// Type for R2 upload response
export interface R2UploadResponse {
  key: string;
  size: number;
  uploaded: string;
  httpMetadata: {
    contentType: string;
  };
}

// Type for R2 error response
export interface R2ErrorResponse {
  error: string;
  message?: string;
}

// Type for R2 upload response
export interface R2UploadResponse {
  key: string;
  size: number;
  uploaded: string;
  httpMetadata: {
    contentType: string;
  };
}

// Type for R2 delete response
export interface R2DeleteResponse {
  success: boolean;
  message: string;
  key?: string;
}

// Type for R2 check response
export interface R2CheckResponse {
  exists: boolean;
  key?: string;
  size?: number;
  lastModified?: string;
  httpMetadata?: {
    contentType?: string;
  };
}

/**
 * Validates the R2 configuration
 * @throws {Error} If configuration is invalid
 */
export function validateR2Config() {
  const workerListUrl = process.env.CLOUDFLARE_WORKER_R2_LIST_URL;
  const workerUploadUrl = process.env.CLOUDFLARE_WORKER_R2_UPLOAD_URL;
  const workerDeleteUrl = process.env.CLOUDFLARE_WORKER_R2_DELETE_URL;
  const workerCheckUrl = process.env.CLOUDFLARE_WORKER_R2_CHECK_URL;
  
  if (!workerListUrl || !workerUploadUrl || !workerDeleteUrl || !workerCheckUrl) {
    throw createError('CONFIGURATION_ERROR', {
      message: 'R2 worker URLs are not set in environment variables',
      details: {
        reason: 'MISSING_R2_CONFIG',
        hasListUrl: !!workerListUrl,
        hasUploadUrl: !!workerUploadUrl,
        hasDeleteUrl: !!workerDeleteUrl,
        hasCheckUrl: !!workerCheckUrl,
      },
    });
  }

  try {
    new URL(workerListUrl);
    new URL(workerUploadUrl);
  } catch (error) {
    throw createError('CONFIGURATION_ERROR', {
      message: 'Invalid R2 worker URL format',
      details: {
        reason: 'INVALID_R2_CONFIG',
        listUrl: workerListUrl,
        uploadUrl: workerUploadUrl,
      },
    });
  }

  try {
    new URL(workerDeleteUrl);
    new URL(workerCheckUrl);
  } catch (error) {
    throw createError('CONFIGURATION_ERROR', {
      message: 'Invalid R2 worker URL format',
      details: {
        reason: 'INVALID_R2_CONFIG',
        deleteUrl: workerDeleteUrl,
        checkUrl: workerCheckUrl,
      },
    });
  }

  return { 
    workerListUrl,
    workerUploadUrl,
    workerDeleteUrl,
    workerCheckUrl,
  };
}

/**
 * Fetches a list of files from R2 with retry logic
 */
export async function fetchR2FileList({
  workerApiUrl,
  workerToken,
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 30000,
}: {
  workerApiUrl: string;
  workerToken: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}): Promise<R2ListResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(workerApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${workerToken}`,
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        // @ts-ignore - undici types are not fully compatible with fetch
        dispatcher: process.env.NODE_ENV === 'development' && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          ? new (require('undici').ProxyAgent)(process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          : undefined,
      });

      if (!response.ok) {
        const errorData: R2ErrorResponse = await response.json().catch(() => ({}));
        
        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw createError('API_ERROR', {
            message: errorData.message || 'Failed to fetch file list',
            status: response.status,
            code: errorData.error || 'R2_API_ERROR',
          });
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: R2ListResponse = await response.json();
      clearTimeout(timeoutId);
      return data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort or client errors
      if (error.name === 'AbortError' || (error.status && error.status >= 400 && error.status < 500)) {
        break;
      }
      
      // Wait before retrying if not the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  clearTimeout(timeoutId);
  
  if (lastError?.name === 'AbortError') {
    throw createError('TIMEOUT_ERROR', {
      message: 'Request to R2 storage timed out',
      code: 'R2_REQUEST_TIMEOUT',
      details: { maxRetries, timeout },
    });
  }
  
  throw lastError || new Error('Failed to fetch file list after multiple attempts');
}

/**
 * Uploads a file to R2 storage
 */
export async function uploadFileToR2({
  workerApiUrl,
  workerToken,
  fileStream,
  filename,
  contentType,
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 60000, // 60 seconds for uploads
}: {
  workerApiUrl: string;
  workerToken: string;
  fileStream: ReadableStream<Uint8Array> | null | undefined;
  filename: string;
  contentType: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}): Promise<R2UploadResponse> {
  if (!fileStream) {
    throw createError('VALIDATION_ERROR', {
      message: 'File stream is required',
      code: 'MISSING_FILE_STREAM',
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Convert ReadableStream to Node.js Readable if needed
      let body: any = fileStream;
      
      // @ts-ignore - Node.js specific check
      if (typeof Readable !== 'undefined' && fileStream instanceof Readable) {
        // Already a Node.js Readable stream, use as is
      } else if ('getReader' in fileStream) {
        // Convert Web ReadableStream to Node.js Readable
        const reader = fileStream.getReader();
        body = new Readable({
          async read() {
            try {
              const { done, value } = await reader.read();
              if (done) {
                this.push(null);
              } else {
                this.push(Buffer.from(value));
              }
            } catch (error) {
              this.destroy(error as Error);
            }
          },
        });
      }

      const formData = new FormData();
      // @ts-ignore - We need to append the file with the correct type
      formData.append('file', new Blob([body], { type: contentType }), filename);

      const response = await fetch(workerApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workerToken}`,
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal,
        // @ts-ignore - undici types are not fully compatible with fetch
        duplex: 'half',
        dispatcher: process.env.NODE_ENV === 'development' && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          ? new (require('undici').ProxyAgent)(process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          : undefined,
      });

      if (!response.ok) {
        const errorData: R2ErrorResponse = await response.json().catch(() => ({}));
        
        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw createError('API_ERROR', {
            message: errorData.message || 'Failed to upload file',
            status: response.status,
            code: errorData.error || 'R2_UPLOAD_ERROR',
          });
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: R2UploadResponse = await response.json();
      clearTimeout(timeoutId);
      return data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort or client errors
      if (error.name === 'AbortError' || (error.status && error.status >= 400 && error.status < 500)) {
        break;
      }
      
      // Wait before retrying if not the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  clearTimeout(timeoutId);
  
  if (lastError?.name === 'AbortError') {
    throw createError('TIMEOUT_ERROR', {
      message: 'File upload timed out',
      code: 'UPLOAD_TIMEOUT',
      details: { maxRetries, timeout },
    });
  }
  
  throw lastError || new Error('Failed to upload file after multiple attempts');
}

/**
 * Deletes a file from R2 storage
 */
export async function deleteFileFromR2({
  workerApiUrl,
  workerToken,
  filename,
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 30000,
}: {
  workerApiUrl: string;
  workerToken: string;
  filename: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}): Promise<R2DeleteResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(workerApiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workerToken}`,
        },
        body: JSON.stringify({ filename }),
        signal: controller.signal,
        // @ts-ignore - undici types are not fully compatible with fetch
        dispatcher: process.env.NODE_ENV === 'development' && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          ? new (require('undici').ProxyAgent)(process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          : undefined,
      });

      const data: R2DeleteResponse = await response.json();

      if (!response.ok) {
        // Don't retry client errors (4xx) except 404 (not found)
        if (response.status >= 400 && response.status < 500 && response.status !== 404) {
          throw createError('API_ERROR', {
            message: data.message || 'Failed to delete file',
            status: response.status,
            code: 'R2_DELETE_ERROR',
            details: { filename },
          });
        }
        
        // For 404, return success: false but don't throw
        if (response.status === 404) {
          return {
            success: false,
            message: `File not found: ${filename}`,
            key: filename,
          };
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      clearTimeout(timeoutId);
      return {
        ...data,
        success: true,
        message: `Successfully deleted file: ${filename}`,
        key: filename,
      };
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort or client errors (except 404 which we handle above)
      if (error.name === 'AbortError' || (error.status && error.status >= 400 && error.status < 500)) {
        break;
      }
      
      // Wait before retrying if not the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  clearTimeout(timeoutId);
  
  if (lastError?.name === 'AbortError') {
    throw createError('TIMEOUT_ERROR', {
      message: 'File deletion timed out',
      code: 'DELETE_TIMEOUT',
      details: { filename, maxRetries, timeout },
    });
  }
  
  throw lastError || new Error(`Failed to delete file '${filename}' after multiple attempts`);
}

/**
 * Checks if a file exists in R2 storage
 */
export async function checkFileInR2({
  workerApiUrl,
  workerToken,
  filename,
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 30000,
}: {
  workerApiUrl: string;
  workerToken: string;
  filename: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}): Promise<R2CheckResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let lastError: Error | null = null;

  // Encode the filename for URL safety
  const encodedFilename = encodeURIComponent(filename);
  const url = `${workerApiUrl}?filename=${encodedFilename}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${workerToken}`,
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        // @ts-ignore - undici types are not fully compatible with fetch
        dispatcher: process.env.NODE_ENV === 'development' && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          ? new (require('undici').ProxyAgent)(process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
          : undefined,
      });

      // If the file exists, return its details
      if (response.ok) {
        const data: R2CheckResponse = await response.json();
        clearTimeout(timeoutId);
        return { ...data, exists: true };
      }

      // If the file doesn't exist, return exists: false
      if (response.status === 404) {
        clearTimeout(timeoutId);
        return { exists: false, key: filename };
      }

      // For other errors, throw an appropriate error
      const errorData = await response.json().catch(() => ({}));
      throw createError('API_ERROR', {
        message: errorData.message || 'Failed to check file existence',
        status: response.status,
        code: 'R2_CHECK_ERROR',
        details: { filename },
      });
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort or client errors (4xx)
      if (error.name === 'AbortError' || (error.status && error.status >= 400 && error.status < 500)) {
        break;
      }
      
      // Wait before retrying if not the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  clearTimeout(timeoutId);
  
  if (lastError?.name === 'AbortError') {
    throw createError('TIMEOUT_ERROR', {
      message: 'File existence check timed out',
      code: 'CHECK_TIMEOUT',
      details: { filename, maxRetries, timeout },
    });
  }
  
  throw lastError || new Error(`Failed to check file '${filename}' existence after multiple attempts`);
}
