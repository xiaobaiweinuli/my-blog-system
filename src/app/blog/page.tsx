'use client';
import { useEffect, useState } from 'react';
import { getPublicPosts, PostMetadata } from '@/lib/posts';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import PostList from '@/app/blog/PostList';
import { getCurrentUserSession, isAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

async function getAllPosts() {
  // 直接读取所有md/mdx文件并返回全部frontmatter，不做status/visibility过滤
  const { Octokit } = await import('@octokit/rest');
  const matter = (await import('gray-matter')).default;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_BLOG_REPO_OWNER || '';
  const repo = process.env.GITHUB_BLOG_REPO_NAME || '';
  const { data: files } = await octokit.repos.getContent({ owner, repo, path: 'posts', cache: 'no-store' });
  const mdFiles = Array.isArray(files) ? files.filter(file => (file.path.endsWith('.md') || file.path.endsWith('.mdx')) && file.type === 'file') : [];
  const allPostsPromises = mdFiles.map(async (file) => {
    const { data: fileContent } = await octokit.repos.getContent({ owner, repo, path: file.path, mediaType: { format: 'raw' }, cache: 'no-store' });
    if (!fileContent || typeof fileContent !== 'string') return null;
    const { data: frontmatter } = matter(fileContent);
    return {
      slug: file.name.replace(/\.(md|mdx)$/, ''),
      title: frontmatter.title || 'No Title',
      description: frontmatter.description || '',
      coverImageUrl: frontmatter.coverImageUrl || '',
      tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags.split(',').map((t: string) => t.trim()))) : [],
      language: frontmatter.language || 'zh',
      date: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
      ...frontmatter,
    };
  });
  const allPosts = (await Promise.all(allPostsPromises))
    .filter((p): p is PostMetadata => !!p && typeof p === 'object' && 'slug' in p)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { posts: allPosts, total: allPosts.length };
}

export default function BlogPage() {
  const [site, setSite] = useState({
    siteTitle: '',
    siteDescription: '',
    avatarUrl: '',
    footerText: '',
  });
  const [posts, setPosts] = useState<PostMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [session, setSession] = useState(null);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => setSite(data));
    // 获取公开文章
    getPublicPosts({ page: 1, limit: 10 }).then(pub => {
      setPosts(pub.posts);
      setTotal(pub.total);
    });
    getCurrentUserSession().then(setSession);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        {site.avatarUrl && (
          <Image src={site.avatarUrl} alt="网站头像" width={64} height={64} className="rounded-full mx-auto mb-2" />
        )}
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">{site.siteTitle || '我们的博客'}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{site.siteDescription || '探索我们的最新文章、见解和故事。'}</p>
      </header>
      <PostList initialPosts={posts} initialTotal={total} isAdmin={isAdmin(session)} />
      <footer className="mt-12 text-gray-400 text-sm text-center">
        {site.footerText || `© ${new Date().getFullYear()} 我的博客系统 | 由 Next.js & Tailwind CSS 强力驱动`}
      </footer>
    </div>
  );
}
