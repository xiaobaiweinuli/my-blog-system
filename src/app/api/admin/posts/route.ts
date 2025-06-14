import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Octokit } from '@octokit/rest';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = session.user as { role?: string };
  const { accessToken } = session as { accessToken?: string };

  if (role !== 'admin' && role !== 'collaborator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'GitHub access token not found' }, { status: 401 });
  }

  const octokit = new Octokit({ auth: accessToken });

  const owner = process.env.GITHUB_BLOG_REPO_OWNER;
  const repo = process.env.GITHUB_BLOG_REPO_NAME;

  if (!owner || !repo) {
    return NextResponse.json({ error: 'GitHub repository owner or name not configured' }, { status: 500 });
  }

  try {
    const { data: files } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'posts',
    });

    if (!Array.isArray(files)) {
        return NextResponse.json({ error: 'Could not retrieve posts directory' }, { status: 500 });
    }

    const markdownFiles = files
      .filter(file => file.type === 'file' && file.name.endsWith('.md'))
      .map(file => ({ name: file.name, path: file.path }));

    return NextResponse.json(markdownFiles);
  } catch (error: any) {
    console.error('Error fetching posts from GitHub:', error);
    if (error.status === 404) {
        return NextResponse.json({ error: 'Posts directory not found in the repository' }, { status: 404 });
    }
    // Handle rate limiting and other errors
    return NextResponse.json({ error: 'Failed to fetch posts from GitHub' }, { status: 500 });
  }
}