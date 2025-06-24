import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { remark } from 'remark';
import html from 'remark-html';

import { withErrorHandler } from '@/lib/error';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPostWithAccessCheck } from '@/lib/posts';
import { createError } from '@/lib/error';

// Define the schema for the slug parameter
const slugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

// Type definitions for the API response
type PostResponse = Awaited<ReturnType<typeof getPostWithAccessCheck>> & {
  contentHtml?: string;
};

/**
 * GET /api/posts/[slug]
 * Get a single post by its slug
 */
async function GET(_req: Request, { params }: { params: { slug: string } }) {
  // Validate the slug parameter
  const slugResult = slugSchema.safeParse(params);
  if (!slugResult.success) {
    throw createError('INVALID_INPUT', {
      details: 'Invalid slug parameter',
      validationErrors: slugResult.error.format(),
    });
  }
  
  const { slug } = slugResult.data;
  const session = await getServerSession(authOptions);
  
  // Get the post with access control
  const post = await getPostWithAccessCheck(slug, session);
  
  if (!post) {
    // Return 404 if post is not found or access is denied
    throw createError('NOT_FOUND', 'Post not found or access denied');
  }
  
  try {
    // Convert markdown content to HTML
    const processedContent = await remark()
      .use(html)
      .process(post.content);
    
    const contentHtml = processedContent.toString();
    
    // Prepare the response data including content and contentHtml
    const responseData: PostResponse = {
      ...post,
      contentHtml,
    };
    
    return responseData;
  } catch (error) {
    console.error(`Error processing markdown for post: ${slug}`, error);
    throw createError('INTERNAL_SERVER_ERROR', {
      details: 'Failed to process post content',
      isOperational: false,
    });
  }
}

// Wrap the GET handler with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET);

// Export the handlers
export { GETWithErrorHandler as GET };

// Disable caching for this route
export const dynamic = 'force-dynamic';
