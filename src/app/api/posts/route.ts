import { NextResponse } from 'next/server';
import { getPublicPosts, getAllPosts } from '@/lib/posts';
import { withErrorHandler } from '@/lib/error';
import { paginationQuerySchema, validateQuery } from '@/lib/validators';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Type definitions for the API response
type PostListResponse = {
  data: Awaited<ReturnType<typeof getPublicPosts>>['posts'];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

/**
 * GET /api/posts
 * Get a paginated list of public posts
 */
async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());
  
  // Validate query parameters
  const { page, limit, ...filters } = validateQuery(paginationQuerySchema, query);
  
  // 获取当前用户 session
  const session = await getServerSession(authOptions);
  let posts, total;
  if (session?.user?.role === 'admin' || session?.user?.role === 'collaborator') {
    // 管理员/协作者返回所有文章
    ({ posts, total } = await getAllPosts({ page, limit, ...filters }));
  } else {
    // 普通用户只返回已发布+公开
    ({ posts, total } = await getPublicPosts({ page, limit, ...filters }));
  }
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  
  // Return the response
  return NextResponse.json({
    data: posts,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  } as PostListResponse);
}

// Wrap the GET handler with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET);

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS method for CORS preflight
function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Export the handlers
export { GETWithErrorHandler as GET, OPTIONS };

// Disable caching for this route
export const dynamic = 'force-dynamic';
