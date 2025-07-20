'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PostMetadata } from '@/lib/posts';
import { motion, AnimatePresence } from 'framer-motion';

interface PostListProps {
  initialPosts: PostMetadata[];
  initialTotal: number;
  isAdmin?: boolean;
}

export default function PostList({ initialPosts, initialTotal, isAdmin = false }: PostListProps) {
  const [posts, setPosts] = useState<PostMetadata[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;
  const router = useRouter();

  useEffect(() => {
    setPosts(initialPosts);
    setTotal(initialTotal);
  }, [initialPosts, initialTotal]);

  const fetchPosts = async (newPage: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${newPage}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data.data);
      setTotal(data.meta?.total || 0);
      setPage(newPage);
    } catch (error) {
      console.error(error);
      // Optionally, show a toast notification
    } finally {
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {posts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer"
                onClick={() => router.push(`/blog/${post.slug}`)}
              >
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 shadow-inner">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <span className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 drop-shadow-lg animate-pulse select-none text-center px-4"
                        style={{ textShadow: '0 2px 16px rgba(120, 80, 255, 0.25), 0 1px 0 #fff' }}>
                        {post.title}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <CardTitle className="text-xl font-bold leading-tight mb-2 flex items-center gap-2">
                    {post.title}
                    {isAdmin && (
                      <>
                        {post.status === 'published' && (
                          <Badge className="bg-green-100 text-green-800 border border-green-300" variant="secondary">已发布</Badge>
                        )}
                        {post.status === 'draft' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300" variant="secondary">草稿</Badge>
                        )}
                        {post.status === 'archived' && (
                          <Badge className="bg-gray-200 text-gray-600 border border-gray-300" variant="secondary">已归档</Badge>
                        )}
                        {post.visibility === 'logged_in' && (
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-300" variant="secondary">仅登录可见</Badge>
                        )}
                        {(post.isSticky || post.sticky) && (
                          <Badge className="bg-pink-100 text-pink-700 border border-pink-300" variant="secondary">置顶</Badge>
                        )}
                      </>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mb-4">
                    {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <CardDescription>{post.description}</CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/blog/tag/${encodeURIComponent(tag)}`}
                        onClick={e => e.stopPropagation()}
                      >
                        <Badge variant="secondary" className="cursor-pointer hover:bg-blue-200 transition">{tag}</Badge>
                      </Link>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center items-center gap-4 mt-12">
        <Button onClick={() => fetchPosts(page - 1)} disabled={page <= 1 || isLoading}>
          {isLoading ? '加载中...' : '上一页'}
        </Button>
        <span className="text-lg font-medium">{page} / {totalPages}</span>
        <Button onClick={() => fetchPosts(page + 1)} disabled={page >= totalPages || isLoading}>
          {isLoading ? '加载中...' : '下一页'}
        </Button>
      </div>
    </div>
  );
}
