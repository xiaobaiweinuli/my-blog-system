import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { withErrorHandler, createError } from '@/lib/error';
import { 
  createAuthenticatedOctokit, 
  handleGitHubError, 
  validateGitHubConfig
} from '@/lib/github';
import { parseMarkdown, stringifyMarkdown } from '@/lib/markdown-utils';
import { validateUserSession } from '@/lib/auth-utils';
import { z } from 'zod';
import { postInputSchema } from '@/lib/validators/admin';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getToken } from 'next-auth/jwt';

type PostFrontmatter = {
  title: string;
  slug: string;
  date: string;
  description: string;
  tags?: string[];
  published?: boolean;
  image?: string;
  author?: string;
};

// Response types
interface GetPostResponse {
  content: string;
  frontmatter: PostFrontmatter;
}

interface UpdatePostResponse {
  message: string;
  path: string;
  commit: {
    sha: string;
    html_url: string;
  };
}

interface DeletePostResponse {
  message: string;
}

// Type guard for GitHub file content
function isFileContent(
  content: any
): content is { path: string; sha: string; html_url: string } {
  return content && 
         typeof content === 'object' && 
         'path' in content && 
         'sha' in content;
}

interface GitHubFileContent {
  type: string;
  content?: string;
  sha: string;
  path: string;
}

/**
 * GET /api/admin/posts/[slug]
 * Get a single post by slug
 */
async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Authenticate and authorize
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  validateUserSession(token);
  
  const octokit = new Octokit({ auth: token.github_access_token });
  const { owner, repo } = validateGitHubConfig();

  try {
    // 尝试 .mdx，如果不存在再尝试 .md
    let filePath = `posts/${slug}.mdx`;
    let fileContent;

    try {
      fileContent = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
    } catch (error: any) {
      if (error.status === 404) {
        // 如果 .mdx 不存在，尝试 .md
        filePath = `posts/${slug}.md`;
        fileContent = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
        });
      } else {
        throw error;
      }
    }

    const { data } = fileContent;
    if (Array.isArray(data) || !('content' in data)) {
      throw createError('NOT_FOUND', `Post '${slug}' not found`);
    }

    const fileData = data as GitHubFileContent;
    if (!fileData.content) {
      throw createError('NOT_FOUND', `Post '${slug}' content not found`);
    }

    const markdownText = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const { frontmatter, content: markdownContent } = parseMarkdown<PostFrontmatter>(markdownText);

    const response: GetPostResponse = {
      content: markdownContent,
      frontmatter: frontmatter as PostFrontmatter
    };

    return response;
  } catch (error) {
    handleGitHubError(error, `fetch post '${slug}'`);
    throw error; // Re-throw after handling
  }
  
  // This line is a fallback that should never be reached
  // but is needed to satisfy TypeScript's control flow analysis
  return { content: '', frontmatter: {} as PostFrontmatter };
}

/**
 * PUT /api/admin/posts/[slug]
 * Update an existing post or create a new one if it doesn't exist
 */
async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Authenticate and authorize
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw createError('AUTHENTICATION_REQUIRED', 'Authentication required');
  }

  let rawData;
  if (req.headers.get('content-type')?.includes('application/json')) {
    rawData = await req.json();
  } else {
    const formData = await req.formData();
    rawData = Object.fromEntries(formData.entries());
  }

  const octokit = new Octokit({ auth: token.github_access_token });
  const { owner, repo } = validateGitHubConfig();

  try {
    // Convert isSticky to string if it exists
    if ('isSticky' in rawData) {
      rawData.isSticky = String(rawData.isSticky) === 'true' ? 'true' : 'false';
    }
    
    // Parse tags if present
    if ('tags' in rawData && typeof rawData.tags === 'string') {
      try {
        rawData.tags = JSON.parse(rawData.tags);
      } catch (e) {
        throw createError('VALIDATION_ERROR', {
          details: 'Invalid tags format. Must be a JSON array of strings.',
          field: 'tags',
        });
      }
    }
    
    // Validate input using Zod schema
    const postData = postInputSchema.parse(rawData);
    const { content, ...frontmatter } = postData;
    
    // Prepare frontmatter with timestamps
    const now = new Date().toISOString();
    const frontmatterWithTimestamps = {
      ...frontmatter,
      updatedAt: now,
    };

    // Convert to markdown content
    const markdownContent = stringifyMarkdown(frontmatterWithTimestamps, content);
    // 保持原有文件后缀，如果是新文件则使用 .mdx
    let filePath = `posts/${slug}.mdx`;
    let existingFile;

    try {
      existingFile = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
    } catch (error: any) {
      if (error.status === 404) {
        // 如果 .mdx 不存在，尝试 .md
        filePath = `posts/${slug}.md`;
        try {
          existingFile = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
          });
        } catch (e: any) {
          if (e.status !== 404) {
            throw e;
          }
          // 如果两种后缀都不存在，默认使用 .mdx
          filePath = `posts/${slug}.mdx`;
        }
      } else {
        throw error;
      }
    }

    // 获取现有文件的 SHA
    let sha: string | undefined;
    if (existingFile && !Array.isArray(existingFile.data) && 'sha' in existingFile.data) {
      sha = existingFile.data.sha;
    }

    // Create or update the file in GitHub
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Update post: ${frontmatter.title || slug}`,
      content: Buffer.from(markdownContent).toString('base64'),
      sha, // Will be undefined for new files
      committer: {
        name: 'Blog Admin',
        email: 'admin@blog.com',
      },
      author: {
        name: 'Blog Admin',
        email: 'admin@blog.com',
      },
    });

    const response: UpdatePostResponse = {
      message: 'Post updated successfully',
      path: isFileContent(data.content) ? data.content.path : filePath,
      commit: {
        sha: isFileContent(data.content) ? data.content.sha : '',
        html_url: isFileContent(data.content) ? data.content.html_url : '',
      },
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
    
    handleGitHubError(error, 'update post');
  }
}

/**
 * DELETE /api/admin/posts/[slug]
 * Delete a post by slug
 */
async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  // Authenticate and authorize
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  validateUserSession(token);
  const octokit = new Octokit({ auth: token.github_access_token });
  const { owner, repo } = validateGitHubConfig();

  // 支持 .md 和 .mdx 文件删除
  const filePaths = [`posts/${slug}.md`, `posts/${slug}.mdx`];
  let deleted = false;
  let lastError = null;

  for (const filePath of filePaths) {
    try {
      console.log('尝试删除文件:', { owner, repo, filePath });
      // 获取文件 SHA
      const { data: fileContent } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
      if (Array.isArray(fileContent) || !('sha' in fileContent)) {
        console.log('未找到文件或文件内容异常:', { filePath, fileContent });
        continue;
      }
      // 删除文件
      await octokit.repos.deleteFile({
        owner,
        repo,
        path: filePath,
        message: `feat: Delete blog post - ${slug}`,
        sha: fileContent.sha,
      });
      console.log('文件删除成功:', { filePath });
      deleted = true;
    } catch (error: any) {
      console.error('删除文件出错:', { filePath, error });
      // 只在 404 时跳过，其他错误抛出
      if (error.status === 404) {
        lastError = error;
        continue;
      } else {
        // 其它错误直接抛出
        throw createError('DELETE_FAILED', error.message || '删除文章失败');
      }
    }
  }

  if (!deleted) {
    throw createError('NOT_FOUND', `Post '${slug}' not found (.md/.mdx)`);
  }

  const response: DeletePostResponse = {
    message: `Post '${slug}' deleted successfully (.md/.mdx)`
  };
  return response;
}

// Wrap handlers with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET as any);
const PUTWithErrorHandler = withErrorHandler(PUT as any);
const DELETEWithErrorHandler = withErrorHandler(DELETE as any);

// Export the handlers
export { 
  GETWithErrorHandler as GET, 
  PUTWithErrorHandler as PUT, 
  DELETEWithErrorHandler as DELETE 
};

// Disable caching for this route
export const dynamic = 'force-dynamic';