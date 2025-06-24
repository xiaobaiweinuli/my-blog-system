import { z } from 'zod';
import { createError } from './error';

// Pagination query parameters
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  tag: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// Post creation/update schema
export const postSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase, use hyphens to separate words, and contain no spaces or special characters'
  ),
  content: z.string().min(10),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
});

export type PostInput = z.infer<typeof postSchema>;

// Validate request query parameters
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: Record<string, unknown>
): z.infer<T> {
  const result = schema.safeParse(query);
  
  if (!result.success) {
    throw createError('VALIDATION_ERROR', {
      details: 'Invalid query parameters',
      validationErrors: result.error.format()
    });
  }
  
  return result.data;
}

// Validate request body
export async function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  request: Request
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      throw createError('VALIDATION_ERROR', {
        details: 'Invalid request body',
        validationErrors: result.error.format()
      });
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createError('INVALID_INPUT', 'Invalid JSON in request body');
    }
    throw error;
  }
}
