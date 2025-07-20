'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import PostList from '@/app/blog/PostList';
import { useSession } from 'next-auth/react';
import { useSettings } from '@/components/layout/SettingsProvider';

export const dynamic = 'force-dynamic';

export default function BlogPage() {
  const site = useSettings();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    fetch('/api/posts?page=1&limit=10')
      .then(res => res.json())
      .then(data => {
        setPosts(data.data);
        setTotal(data.meta?.total || 0);
      });
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
      <PostList initialPosts={posts} initialTotal={total} isAdmin={!!session?.user?.role && (session.user.role === 'admin' || session.user.role === 'collaborator')} />
    </div>
  );
}
