import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Octokit } from '@octokit/rest';

interface Context {
  params: {
    slug: string;
  };
}

export async function GET(req: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  const { slug } = context.params;

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, accessToken } = session.user as { role?: string; accessToken?: string };

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
    const { data: fileContent } = await octokit.repos.getContent({
      owner,
      repo,
      path: `posts/${slug}.md`,
    });

    if (Array.isArray(fileContent) || !('content' in fileContent)) {
      return NextResponse.json({ error: 'Invalid file content received from GitHub' }, { status: 500 });
    }

    const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');
    return NextResponse.json({ content });

  } catch (error: any) {
    console.error(`Error fetching post '${slug}' from GitHub:`, error);
    if (error.status === 404) {
      return NextResponse.json({ error: `Post '${slug}.md' not found` }, { status: 404 });
    }
    // Handle rate limiting and other errors
    return NextResponse.json({ error: `Failed to fetch post '${slug}' from GitHub` }, { status: 500 });
  }
}