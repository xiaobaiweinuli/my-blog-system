import matter from 'gray-matter';
import { Octokit } from '@octokit/rest';
import type { Session } from 'next-auth';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_BLOG_REPO_OWNER || '';
const repo = process.env.GITHUB_BLOG_REPO_NAME || '';

export interface PostMetadata {
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  tags: string[];
  language: string;
  date: string;
  [key: string]: any;
}

export interface Post extends PostMetadata {
  content: string;
}

// Function to get content of a file from GitHub
async function getFileContent(path: string): Promise<string | null> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      mediaType: {
        format: 'raw',
      },
      cache: 'no-store', // Disable caching
    });
    // The response.data is expected to be a string for raw format
    return response.data as unknown as string;
  } catch (error: any) {
    // 只在 404 时静默处理
    if (error.status === 404) {
      // 静默返回 null
      return null;
    }
    // 其他错误才输出 error
    console.error(`Failed to fetch file ${path}:`, error, { owner, repo, path });
    return null;
  }
}

/**
 * Fetches slugs of all public posts for static generation
 * @returns Array of post slugs
 */
export async function getPublicPostSlugs(): Promise<Array<{ slug: string }>> {
  if (!owner || !repo) {
    throw new Error('GitHub repository owner or name is not configured in environment variables.');
  }

  try {
    const { data: files } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'posts',
      cache: 'no-store',
    });

    if (!Array.isArray(files)) {
      return [];
    }

    // Only process markdown and mdx files
    const mdFiles = files.filter(file => file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.mdx')));

    // For static generation, we only need the slugs, not the full content
    const slugs = mdFiles.map(file => ({
      slug: file.name.replace(/\.(md|mdx)$/, '')
    }));

    return slugs;
  } catch (error) {
    console.error('Error fetching post slugs:', error);
    return [];
  }
}

export async function getPublicPosts(options: { page?: number; limit?: number } = {}): Promise<{ posts: PostMetadata[]; total: number }> {
  if (!owner || !repo) {
    throw new Error('GitHub repository owner or name is not configured in environment variables.');
  }

  try {
    const { data: files } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'posts', // Read from the 'posts' directory
      cache: 'no-store', // Disable caching
    });

    if (!Array.isArray(files)) {
      return { posts: [], total: 0 };
    }

    const mdFiles = files.filter(file => (file.path.endsWith('.md') || file.path.endsWith('.mdx')) && file.type === 'file');

    const allPostsPromises = mdFiles.map(async (file) => {
      const fileContent = await getFileContent(file.path);
      if (!fileContent) return null;

      const { data: frontmatter } = matter(fileContent);

      if (frontmatter.status === 'published' && frontmatter.visibility === 'public') {
        return {
          slug: file.name.replace(/\.(md|mdx)$/, ''),
          title: frontmatter.title || 'No Title',
          description: frontmatter.description || '',
          coverImageUrl: frontmatter.coverImageUrl || '',
          tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : frontmatter.tags.split(',').map((t: string) => t.trim())) : [],
          language: frontmatter.language || 'zh',
          date: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
          ...frontmatter,
        };
      }
      return null;
    });

    const allPosts = (await Promise.all(allPostsPromises))
      .filter((post): post is PostMetadata => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = allPosts.length;

    // Apply pagination
    const { page = 1, limit = 10 } = options;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    return { posts: paginatedPosts, total };

  } catch (error) {
    console.error('Failed to fetch posts from GitHub:', error);
    return { posts: [], total: 0 };
  }
}

export async function getPublicPostBySlug(slug: string): Promise<Post | null> {
  if (!owner || !repo) {
    throw new Error('GitHub repository owner or name is not configured in environment variables.');
  }

  // 支持 .md 和 .mdx
  const exts = ['.md', '.mdx'];
  let fileContent: string | null = null;
  let ext = '';
  for (const e of exts) {
    const path = `posts/${slug}${e}`;
    fileContent = await getFileContent(path);
    if (fileContent) {
      ext = e;
      break;
    }
  }
  if (!fileContent) {
    return null;
  }

  const { data: frontmatter, content } = matter(fileContent);

  if (frontmatter.status !== 'published' || frontmatter.visibility !== 'public') {
    return null;
  }

  return {
    slug: slug,
    title: frontmatter.title || 'No Title',
    description: frontmatter.description || '',
    coverImageUrl: frontmatter.coverImageUrl || '',
    tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : frontmatter.tags.split(',').map((t: string) => t.trim())) : [],
    language: frontmatter.language || 'zh',
    date: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
    content: content,
    ext,
    ...frontmatter,
  };
}

/**
 * Fetches a single post by its slug and performs access control checks based on the user's session.
 * @param slug The slug of the post to fetch.
 * @param session The user's NextAuth session object, or null if not authenticated.
 * @returns A Post object if found and accessible, otherwise null.
 */
export async function getPostWithAccessCheck(slug: string, session: Session | null): Promise<Post | null> {
  if (!owner || !repo) {
    throw new Error('GitHub repository owner or name is not configured in environment variables.');
  }

  // 支持 .md 和 .mdx
  const exts = ['.md', '.mdx'];
  let fileContent: string | null = null;
  let ext = '';
  for (const e of exts) {
    const path = `posts/${slug}${e}`;
    fileContent = await getFileContent(path);
    if (fileContent) {
      ext = e;
      break;
    }
  }
  if (!fileContent) {
    return null; // Post not found
  }

  const { data: frontmatter, content } = matter(fileContent);

  // Access Control Logic
  const isDraftOrArchived = frontmatter.status === 'draft' || frontmatter.status === 'archived';
  const isLoggedInOnly = frontmatter.visibility === 'logged_in';
  const userRole = session?.user?.role;

  if (isDraftOrArchived) {
    // Drafts and archived posts require admin or collaborator role
    if (!session || (userRole !== 'admin' && userRole !== 'collaborator')) {
      return null; // Access denied, treat as not found
    }
  }

  if (isLoggedInOnly) {
    // "Logged in only" posts require any valid session
    if (!session) {
      return null; // Access denied, treat as not found
    }
  }

  // If a post is public (e.g., status: 'published', visibility: 'public'),
  // it will pass through the checks above and be returned.

  return {
    slug: slug,
    title: frontmatter.title || 'No Title',
    description: frontmatter.description || '',
    coverImageUrl: frontmatter.coverImageUrl || '',
    tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : frontmatter.tags.split(',').map((t: string) => t.trim())) : [],
    language: frontmatter.language || 'zh',
    date: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
    content: content,
    ext,
    ...frontmatter,
  };
}
