import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/error';
import { createError } from '@/lib/error';
import { 
  createAuthenticatedOctokit, 
  handleGitHubError, 
  validateGitHubConfig 
} from '@/lib/github';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { parseMarkdown } from '@/lib/markdown-utils';
import { Octokit } from '@octokit/rest';

// Response type
interface CheckTitleResponse {
  exists: boolean;
  message?: string;
}

/**
 * GET /api/admin/posts/check-title
 * Check if a post with the given title already exists in the GitHub repository
 * Only accessible by admin or collaborator roles
 */
async function GET(req: NextRequest) {
  // 1. Get and validate title parameter
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  
  if (!title) {
    throw createError('VALIDATION_ERROR', {
      message: 'Title parameter is required',
      field: 'title'
    });
  }

  // 2. Authenticate and authorize
  const session = await requireCollaboratorOrAdmin();
  const octokit = new Octokit({ auth: session.github_access_token });
  const { owner, repo } = validateGitHubConfig();
  
  const postsDir = 'posts';

  try {
    // 3. Get all files in the posts directory
    const { data: dirContents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: postsDir,
    });

    // 4. Ensure we got an array of directory contents
    if (!Array.isArray(dirContents)) {
      throw createError('NOT_FOUND', 'Posts directory not found or is not a directory');
    }

    // 5. Check each markdown file for the title
    for (const item of dirContents) {
      if (item.type !== 'file' || !item.name.endsWith('.md')) {
        continue;
      }

      try {
        // Get file content
        const { data: fileContent } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path,
        });

        // Skip if not a file with content
        if (Array.isArray(fileContent) || !('content' in fileContent)) {
          continue;
        }

        // Parse markdown and check title
        const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');
        const { frontmatter } = parseMarkdown<{ title?: string }>(content);

        // Compare titles case-insensitively
        if (frontmatter.title?.toLowerCase() === title.toLowerCase()) {
          const response: CheckTitleResponse = {
            exists: true,
            message: `Title '${title}' is already in use`
          };
          return response;
        }
      } catch (fileError) {
        // Skip files that can't be processed
        continue;
      }
    }

    // 6. If we get here, the title is available
    const response: CheckTitleResponse = {
      exists: false,
      message: `Title '${title}' is available`
    };
    return response;
  } catch (error: any) {
    // If posts directory doesn't exist, the title is available
    if (error.status === 404) {
      const response: CheckTitleResponse = {
        exists: false,
        message: `Title '${title}' is available (no posts directory found)`
      };
      return response;
    }
    
    // Handle other GitHub API errors
    handleGitHubError(error, `check title '${title}'`);
  }
}

// Wrap the handler with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET as any);

// Export the handler
export { GETWithErrorHandler as GET };

// Disable caching for this route
export const dynamic = 'force-dynamic';