import { Octokit } from '@octokit/rest';
import { createError } from './error';
import { ERROR_CODES } from './error';

interface GitHubConfig {
  owner: string;
  repo: string;
}

/**
 * Validates GitHub configuration and returns necessary parameters
 */
export function validateGitHubConfig(): GitHubConfig {
  const owner = process.env.GITHUB_BLOG_REPO_OWNER;
  const repo = process.env.GITHUB_BLOG_REPO_NAME;

  if (!owner || !repo) {
    throw createError('CONFIGURATION_ERROR', {
      details: 'GitHub repository configuration is missing',
      isOperational: false,
    });
  }

  return { owner, repo };
}

/**
 * Creates an authenticated Octokit instance
 */
export function createAuthenticatedOctokit(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('UNAUTHORIZED', 'GitHub access token is required');
  }

  const accessToken = authHeader.split(' ')[1];
  
  if (!accessToken) {
    throw createError('UNAUTHORIZED', 'Invalid GitHub access token format');
  }

  return new Octokit({ auth: accessToken });
}

/**
 * Validates user session and permissions
 */
export function validateUserSession(session: any) {
  if (!session?.user) {
    throw createError('UNAUTHENTICATED', 'You must be logged in to perform this action');
  }

  const { role } = session.user as { role?: string };
  
  if (role !== 'admin' && role !== 'collaborator') {
    throw createError('FORBIDDEN', 'Insufficient permissions');
  }
}

/**
 * Handles GitHub API errors consistently
 */
export function handleGitHubError(error: any, context: string) {
  console.error(`GitHub API Error (${context}):`, error);
  
  if (error.status === 404) {
    throw createError('NOT_FOUND', {
      details: `${context} not found in the repository`,
      githubError: error.message,
    });
  }

  if (error.status === 403) {
    throw createError('FORBIDDEN', {
      details: 'GitHub API rate limit exceeded or insufficient permissions',
      githubError: error.message,
    });
  }

  throw createError('EXTERNAL_SERVICE_ERROR', {
    details: `Failed to ${context.toLowerCase()}`,
    githubError: error.message,
    isOperational: false,
  });
}

/**
 * Extracts frontmatter and content from a markdown file
 */
export function parseMarkdownContent(content: string) {
  try {
    const { data: frontmatter, content: markdown } = require('gray-matter')(content);
    return { frontmatter, markdown };
  } catch (error) {
    throw createError('VALIDATION_ERROR', {
      details: 'Failed to parse markdown content',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
