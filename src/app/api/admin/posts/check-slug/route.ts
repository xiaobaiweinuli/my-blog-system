import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error';
import { createError } from '@/lib/error';
import { 
  createAuthenticatedOctokit, 
  handleGitHubError, 
  validateGitHubConfig 
} from '@/lib/github';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { Octokit } from '@octokit/rest';

// Response type
interface CheckSlugResponse {
  exists: boolean;
  message?: string;
}

/**
 * GET /api/admin/posts/check-slug
 * Check if a post with the given slug already exists in the GitHub repository
 * Only accessible by admin or collaborator roles
 */
async function GET(req: NextRequest) {
  // 1. Get and validate slug parameter
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    throw createError('VALIDATION_ERROR', {
      message: 'Slug parameter is required',
      field: 'slug'
    });
  }

  // 2. Authenticate and authorize
  const session = await requireCollaboratorOrAdmin();
  const octokit = new Octokit({ auth: session.github_access_token });
  const { owner, repo } = validateGitHubConfig();
  
  const path = `posts/${slug}.md`;

  try {
    // 3. Check if file exists
    await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    // 4. If we get here, the file exists
    const response: CheckSlugResponse = {
      exists: true,
      message: `Slug '${slug}' is already in use`
    };
    
    return response;
  } catch (error: any) {
    // 5. If file doesn't exist, GitHub API returns 404
    if (error.status === 404) {
      const response: CheckSlugResponse = {
        exists: false,
        message: `Slug '${slug}' is available`
      };
      return response;
    }
    
    // 6. Handle other GitHub API errors
    handleGitHubError(error, `check slug '${slug}'`);
  }
}

// Wrap the handler with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET as any);

// Export the handler
export { GETWithErrorHandler as GET };

// Disable caching for this route
export const dynamic = 'force-dynamic';