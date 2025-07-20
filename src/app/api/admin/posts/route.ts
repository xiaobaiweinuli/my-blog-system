import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { withErrorHandler } from '@/lib/error';
import { postListQuerySchema } from '@/lib/validators/admin';
import { 
  createAuthenticatedOctokit, 
  validateGitHubConfig, 
  validateUserSession,
  handleGitHubError,
  parseMarkdownContent
} from '@/lib/github';
import { createError } from '@/lib/error';
import { postInputSchema, PostInput } from '@/lib/validators/admin';
import { z } from 'zod';
import yaml from 'js-yaml';
import { Octokit } from '@octokit/rest';
import { getToken } from 'next-auth/jwt';

// Type definitions for the API response
type PostListItem = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  updatedAt: string;
  isSticky: boolean;
  language: string;
  path: string;
  description?: string;
  [key: string]: any; // For dynamic frontmatter properties
};

type PostListResponse = {
  data: PostListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type CreatePostResponse = {
  message: string;
  path?: string;
  sha?: string;
};

/**
 * GET /api/admin/posts
 * Get a paginated list of posts with filtering and sorting
 */
async function GET(req: NextRequest) {
  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  const { 
    page = 1, 
    limit = 10, 
    status, 
    visibility, 
    language, 
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = postListQuerySchema.parse(query);

  // Authenticate and authorize
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw createError('AUTHENTICATION_REQUIRED', 'Authentication required');
  }
  validateUserSession(token);
  // 用 token 里的 github_access_token 创建 octokit
  const octokit = new Octokit({ auth: token.github_access_token });
  const { owner, repo } = validateGitHubConfig();

  try {
    // Get all markdown files from the posts directory
    const { data: files } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'posts',
      cache: 'no-store',
    });

    if (!Array.isArray(files)) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Filter for markdown files and fetch their content
    const markdownFiles = files.filter(file => 
      file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))
    );

    const postsDataPromises = markdownFiles.map(async (file) => {
      try {
        const fileContentResponse = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
          cache: 'no-store',
        });

        if ('content' in fileContentResponse.data) {
          const content = Buffer.from(fileContentResponse.data.content, 'base64').toString('utf-8');
          const { frontmatter } = parseMarkdownContent(content);
          
          return {
            id: file.name.replace(/\.(md|mdx)$/, ''),
            title: frontmatter.title || 'No Title',
            status: frontmatter.status || 'draft',
            visibility: frontmatter.visibility || 'public',
            updatedAt: frontmatter.updatedAt || frontmatter.date || new Date().toISOString(),
            isSticky: Boolean(frontmatter.isSticky),
            language: frontmatter.language || 'zh',
            path: file.path,
            ...frontmatter
          };
        }
      } catch (error) {
        console.error(`Failed to fetch or parse metadata for ${file.name}:`, error);
        return null;
      }
      return null;
    });

    // Process all posts
    let posts = (await Promise.all(postsDataPromises)).filter(Boolean) as PostListItem[];

    // Apply filters
    if (status && status !== 'all') {
      posts = posts.filter(post => post.status === status);
    }
    
    if (visibility && visibility !== 'all') {
      posts = posts.filter(post => post.visibility === visibility);
    }
    
    if (language) {
      posts = posts.filter(post => post.language === language);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        (post.description && post.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    posts.sort((a, b) => {
      const aValue = a[sortBy as keyof PostListItem] || '';
      const bValue = b[sortBy as keyof PostListItem] || '';
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);

    const response: PostListResponse = {
      data: paginatedPosts,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    return response;
  } catch (error: any) {
    // 如果是 404，说明 posts 目录不存在，返回空列表
    if (error.status === 404) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
    handleGitHubError(error, 'fetch posts');
    throw error; // 其它错误照常抛出
  }
}

/**
 * POST /api/admin/posts
 * Create a new blog post
 */
async function POST(req: NextRequest) {
  // Authenticate and authorize
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw createError('AUTHENTICATION_REQUIRED', 'Authentication required');
  }
  validateUserSession(token);
  // 用 token 里的 github_access_token 创建 octokit
  const octokit = new Octokit({ auth: token.github_access_token });
  const { owner, repo } = validateGitHubConfig();

  try {
    // 兼容 application/json 和 formData 两种请求体
    let rawData: any;
    if (req.headers.get('content-type')?.includes('application/json')) {
      rawData = await req.json();
    } else {
      const formData = await req.formData();
      rawData = Object.fromEntries(formData.entries());
    }
    // Parse tags if present
    if (rawData.tags && typeof rawData.tags === 'string') {
      try {
        rawData.tags = JSON.parse(rawData.tags);
      } catch (e) {
        throw createError('VALIDATION_ERROR', {
          details: 'Invalid tags format. Must be a JSON array of strings.',
          field: 'tags',
        });
      }
    }
    
    // Handle isSticky conversion safely
    if ('isSticky' in rawData) {
      rawData.isSticky = String(rawData.isSticky) === 'true' ? 'true' : 'false';
    }
    
    // Validate input using Zod schema
    const postData = postInputSchema.parse(rawData) as PostInput;
    const { title, slug, content, ...frontmatter } = postData;

    // Check if post with the same slug already exists
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: `posts/${slug}.mdx`,
      });
      
      throw createError('CONFLICT', {
        message: 'A post with this slug already exists',
        field: 'slug',
      });
    } catch (error: any) {
      // 404 means the file doesn't exist, which is what we want
      if (error.status !== 404) {
        handleGitHubError(error, 'check post existence');
      }
    }

    // Prepare frontmatter with timestamps
    const now = new Date().toISOString();
    const frontmatterWithTimestamps = {
      ...frontmatter,
      title,
      date: frontmatter.date || now,
      updatedAt: now,
    };

    // Convert frontmatter to YAML and combine with content
    const frontmatterYaml = yaml.dump(frontmatterWithTimestamps, {
      skipInvalid: true,
      noRefs: true,
      sortKeys: true,
    });
    
    const fileContent = `---\n${frontmatterYaml}---\n\n${content}`;

    // Create the file in GitHub
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `posts/${slug}.mdx`,
      message: `Create new post: ${title}`,
      content: Buffer.from(fileContent).toString('base64'),
      committer: {
        name: 'Blog Admin',
        email: 'admin@blog.com',
      },
      author: {
        name: 'Blog Admin',
        email: 'admin@blog.com',
      },
    });

    const response: CreatePostResponse = {
      message: 'Post created successfully',
      path: data.content?.path,
      sha: data.content?.sha,
    };

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError('VALIDATION_ERROR', {
        details: 'Invalid input data',
        validationErrors: error.format(),
      });
    }
    
    // Re-throw if it's already an AppError
    if ('code' in (error as any) && (error as any).code) {
      throw error;
    }
    
    // Handle GitHub errors and re-throw
    handleGitHubError(error, 'create post');
    throw error; // Re-throw after handling
  }
  
  // This line is a fallback that should never be reached
  // but is needed to satisfy TypeScript's control flow analysis
  throw new Error('Unexpected error: Control reached end of POST handler');
}

// Wrap handlers with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET as any);
const POSTWithErrorHandler = withErrorHandler(POST as any);

// Export the handlers
export { GETWithErrorHandler as GET, POSTWithErrorHandler as POST };

// Disable caching for this route
export const dynamic = 'force-dynamic';