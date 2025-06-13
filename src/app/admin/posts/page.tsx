"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import matter from 'gray-matter';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string; // filename without .md
  title: string;
  lang: string;
  isSticky: boolean;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'logged-in';
  path: string; // full path from API
}

interface ApiFile {
  name: string;
  path: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setError(null);
      try {
        const listRes = await fetch('/api/admin/posts');
        if (!listRes.ok) {
          const errorData = await listRes.json();
          throw new Error(errorData.error || `Error fetching post list: ${listRes.statusText}`);
        }
        const files: ApiFile[] = await listRes.json();

        const fetchedPosts: Post[] = [];
        for (const file of files) {
          if (file.name.endsWith('.md')) {
            const slug = file.name.replace('.md', '');
            try {
              const contentRes = await fetch(`/api/admin/posts/${slug}`);
              if (!contentRes.ok) {
                console.warn(`Failed to fetch content for ${file.name}: ${contentRes.statusText}`);
                // Optionally skip this post or add a placeholder with an error
                continue;
              }
              const { content: rawContent } = await contentRes.json();
              const { data: frontmatter } = matter(rawContent);

              fetchedPosts.push({
                id: slug,
                title: frontmatter.title || 'Untitled Post',
                lang: frontmatter.lang || 'N/A',
                isSticky: frontmatter.isSticky || false,
                status: frontmatter.status || 'draft',
                visibility: frontmatter.visibility || 'public',
                path: file.path,
              });
            } catch (contentError: any) {
              console.warn(`Error processing content for ${file.name}: ${contentError.message}`);
              // Optionally add a placeholder with an error for this specific post
            }
          }
        }
        setPosts(fetchedPosts);
      } catch (e: any) {
        console.error("Failed to load posts:", e);
        setError(e.message || 'An unknown error occurred while fetching posts.');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">文章管理</h1>
          <Button asChild>
            <Link href="/admin/posts/new">新建文章</Link>
          </Button>
        </div>
        <div className="text-red-600 bg-red-100 p-4 rounded-md">
          <p className="font-semibold">Error loading posts:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">文章管理</h1>
        <Button asChild>
          <Link href="/admin/posts/new">新建文章</Link>
        </Button>
      </div>

      <Table>
        <TableCaption>文章列表。</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">置顶</TableHead>
            <TableHead>标题</TableHead>
            <TableHead>语言</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>访问权限</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No posts found.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Checkbox checked={post.isSticky} disabled />
                </TableCell>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.lang}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800' : post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {post.status === 'published' ? '已发布' : post.status === 'draft' ? '草稿' : '已归档'}
                  </span>
                </TableCell>
                <TableCell>{post.visibility === 'public' ? '公开' : '登录用户'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">打开操作菜单</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuItem>
                        {/* <Link href={`/admin/posts/edit/${post.id}`}>编辑</Link> */}
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem>复制</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}