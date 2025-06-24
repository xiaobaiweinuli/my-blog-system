import { z } from 'zod';

// Schema for post creation/update
export const postInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase, use hyphens as separators, and not start or end with a hyphen'
  ),
  content: z.string().min(1, 'Content is required'),
  description: z.string().optional(),
  coverImageUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  language: z.string().default('zh'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  isSticky: z.boolean().default(false),
  date: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Schema for post list query parameters
export const postListQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived', 'all']).optional(),
  visibility: z.enum(['public', 'private', 'unlisted', 'all']).optional(),
  language: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['title', 'date', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PostInput = z.infer<typeof postInputSchema>;
export type PostListQuery = z.infer<typeof postListQuerySchema>;
