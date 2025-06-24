import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/error';
import { createError } from '@/lib/error';
import { 
  createAuthenticatedOctokit, 
  handleGitHubError, 
  validateGitHubConfig 
} from '@/lib/github';
import { parseMarkdown, stringifyMarkdown } from '@/lib/markdown-utils';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { v4 as uuidv4 } from 'uuid';

// Response type
interface CopyPostResponse {
  success: boolean;
  slug: string;
  message?: string;
}

/**
 * POST /api/admin/posts/[slug]/copy
 * Create a copy of an existing post with a new slug
 * Only accessible by admin or collaborator roles
 */
async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Authenticate and authorize
  const session = await requireCollaboratorOrAdmin();
  const authHeader = req.headers.get('authorization');
  const octokit = createAuthenticatedOctokit(authHeader);
  const { owner, repo } = validateGitHubConfig();
  
  const originalFilePath = `posts/${slug}.md`;

  try {
    // 1. Get the original post content
    const { data: fileContent } = await octokit.repos.getContent({
      owner,
      repo,
      path: originalFilePath,
    });

    if (Array.isArray(fileContent) || !('content' in fileContent)) {
      throw createError('NOT_FOUND', `Original post '${slug}' not found`);
    }

    const originalContent = Buffer.from(fileContent.content, 'base64').toString('utf-8');
    
    // 2. Parse and modify frontmatter
    const { frontmatter, content } = parseMarkdown<Record<string, any>>(originalContent);
    const newSlug = `${slug}-copy-${uuidv4().substring(0, 8)}`;
    const newTitle = `Copy: ${frontmatter.title || 'Untitled Post'}`;

    const newFrontmatter = {
      ...frontmatter,
      title: newTitle,
      slug: newSlug,
      status: 'draft', // Copied posts are drafts by default
      isSticky: false, // Don't sticky copied posts by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Generate new markdown content
    const newMarkdownContent = stringifyMarkdown(newFrontmatter, content);
    const newFilePath = `posts/${newSlug}.md`;

    // 4. Create the new file in GitHub
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: newFilePath,
      message: `feat: Copy post ${slug} to ${newSlug}`,
      content: Buffer.from(newMarkdownContent).toString('base64'),
      committer: {
        name: 'Blog Admin',
        email: 'admin@blog.com',
      },
      author: {
        name: session.user?.name || 'Blog Admin',
        email: session.user?.email || 'admin@blog.com',
      },
    });

    const response: CopyPostResponse = {
      success: true,
      slug: newSlug,
      message: 'Post copied successfully'
    };

    return response;
  } catch (error) {
    // Re-throw if it's already an AppError
    if ('code' in (error as any) && (error as any).code) {
      throw error;
    }
    
    handleGitHubError(error, `copy post '${slug}'`);
  }
}

// Wrap the handler with error handling middleware
const POSTWithErrorHandler = withErrorHandler(POST as any);

// Export the handler
export { POSTWithErrorHandler as POST };

// Disable caching for this route
export const dynamic = 'force-dynamic';