import { createErrorResponse } from '../utils';
import { getLogger } from './logger';
export function withCorsHeaders(response: Response, corsHeaders: (req: Request) => Headers, request: Request) {
  const responseHeaders = new Headers(response.headers);
  const cors = corsHeaders(request);
  cors.forEach((v, k) => responseHeaders.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

export function handleApiError(error: any, corsHeaders: (req: Request) => Headers, request: Request) {
  const logger = getLogger((request as any).env || {});
  logger.error('[API ERROR]', error instanceof Error ? error : new Error(String(error)));
  return withCorsHeaders(
    createErrorResponse(
      error instanceof Error ? error.message : '服务器错误',
      500
    ),
    corsHeaders,
    request
  );
}

export function parsePaginationParams(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  return { page, limit };
} 