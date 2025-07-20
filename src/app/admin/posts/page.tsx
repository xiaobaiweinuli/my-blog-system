"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { AdminSessionContext } from '../layout';
import { useEffect, useState, useCallback } from 'react';
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
import { 
  MoreHorizontal, 
  Loader2, 
  AlertCircle, 
  PlusCircle, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PostsTableSkeleton from '@/components/admin/PostsTableSkeleton';

interface Post {
  id: string;
  title: string;
  language: string;
  isSticky: boolean;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'logged-in';
  path: string;
  updatedAt: string;
}

interface ApiFile {
  name: string;
  path: string;
  download_url: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  html_url: string;
}

export default function AdminPostsPage() {
  const { session, status } = useContext(AdminSessionContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);




  const handleOpenDeleteDialog = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!postToDelete || !session) return;

    const postId = postToDelete.id;
    const originalPosts = [...posts];

    // Optimistically update UI
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    setShowDeleteConfirm(false); // Close dialog immediately
    setPostToDelete(null);
    setError(null);

    try {
      // const token = session.github_access_token;
      // if (!token) throw new Error('未在会话中找到 GitHub 访问令牌。');

      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        // 不再传 headers: { Authorization }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || '删除文章失败');
      }

      // On success, update cache
      const cachedPostsRaw = sessionStorage.getItem('cachedPosts');
      if (cachedPostsRaw) {
        const cachedPosts = JSON.parse(cachedPostsRaw);
        const updatedCache = cachedPosts.filter((p: Post) => p.id !== postId);
        sessionStorage.setItem('cachedPosts', JSON.stringify(updatedCache));
      }
      console.log(`文章 ${postId} 已成功删除。`);

    } catch (err: any) {
      console.error("删除文章时出错:", err);
      setError(err.message);
      alert(`删除文章失败: ${err.message}`);
      
      // On failure, revert UI changes
      setPosts(originalPosts);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);
    try {
      // 直接请求 API，不带 token
      const apiResponse = await fetch('/api/admin/posts', {
        cache: 'no-store',
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || '从 API 获取文章列表失败');
      }

      const response = await apiResponse.json();
      const fetchedPosts: Post[] = response.data.data;

      if (!fetchedPosts || fetchedPosts.length === 0) {
        setPosts([]);
        setFilteredPosts([]);
      } else {
        const sortedPosts = [...fetchedPosts].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setPosts(sortedPosts);
        setFilteredPosts(sortedPosts);
        sessionStorage.setItem('cachedPosts', JSON.stringify(sortedPosts));
      }
    } catch (err: any) {
      console.error("获取文章时出错:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (session && !initialFetchDone) {
      handleRefresh();
      setInitialFetchDone(true);
    }
  }, [session, initialFetchDone, handleRefresh]);

  useEffect(() => {
    let result = posts;
    if (searchTerm) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(post => post.status === statusFilter);
    }
    if (visibilityFilter !== 'all') {
      result = result.filter(post => post.visibility === visibilityFilter);
    }
    setFilteredPosts(result);
  }, [searchTerm, statusFilter, visibilityFilter, posts]);



  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <AlertCircle className="h-16 w-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">加载文章失败</h1>
        <p className="text-center">{error}</p>
        <Button onClick={() => handleRefresh()} className="mt-4">
          重试
        </Button>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你确定要删除这篇文章吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将从你的 GitHub 仓库中永久删除文章{' '}
              <span className="font-semibold text-foreground">"{postToDelete?.title}"</span>。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === postToDelete?.id}
            >
              {deletingId === postToDelete?.id ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card>
          <CardHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>文章管理</CardTitle>
                <CardDescription>在这里创建、编辑和管理您的所有文章。</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  刷新
                </Button>
                <Link href="/admin/posts/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    创建新文章
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 sm:p-6 border-b">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文章标题..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="按状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="按可见性筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有可见性</SelectItem>
                    <SelectItem value="public">公开</SelectItem>
                    <SelectItem value="logged-in">登录可见</SelectItem>
                  </SelectContent>
                </Select>

              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">固定</TableHead>
                  <TableHead className="min-w-[250px]">标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>可见性</TableHead>
                  <TableHead>最后更新</TableHead>
                  <TableHead className="w-[100px] text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              {loading ? (
                <PostsTableSkeleton />
              ) : (
                <TableBody>
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="text-center">
                          <Checkbox checked={post.isSticky} aria-label="置顶文章" />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/admin/posts/${post.id}/edit`} className="hover:underline">
                            {post.title}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-1">
                            {post.language === 'zh' ? '中文' : 'English'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              post.status === 'published' ? 'default' :
                              post.status === 'draft' ? 'secondary' : 'outline'
                            }
                            className={
                              post.status === 'published' ? 'bg-green-100 text-green-800' :
                              post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {post.status === 'published' ? '已发布' :
                            post.status === 'draft' ? '草稿' : '已归档'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={post.visibility === 'public' ? 'default' : 'outline'}
                            className={post.visibility === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                          >
                            {post.visibility === 'public' ? '公开' : '登录可见'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(post.updatedAt || new Date().toISOString())}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={deletingId === post.id}>
                                <span className="sr-only">打开菜单</span>
                                {deletingId === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>操作</DropdownMenuLabel>
                              <Link href={`/admin/posts/${post.id}/edit`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  编辑
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                预览
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onSelect={() => handleOpenDeleteDialog(post)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        没有找到文章。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              显示 <span className="font-medium">1-{filteredPosts.length}</span> /{' '}
              <span className="font-medium">{posts.length}</span> 篇文章
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={true}>
                上一页
              </Button>
              <Button variant="outline" size="sm" disabled={posts.length < 10}>
                下一页
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}