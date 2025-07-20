// src/components/admin/PostsPageClient.tsx
"use client";

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Loader2, Edit, Eye, Trash2 } from "lucide-react";
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
  CardContent,
  CardFooter,
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
import { toast } from "sonner";

// Post 类型定义
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

// 日期格式化函数
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

export default function AdminPostsPageClient({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(post =>
        statusFilter === 'all' || post.status === statusFilter
      )
      .filter(post =>
        visibilityFilter === 'all' || post.visibility === visibilityFilter
      );
  }, [posts, searchTerm, statusFilter, visibilityFilter]);

  const handleOpenDeleteDialog = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!postToDelete) return;
    setDeletingId(postToDelete.id);
    setShowDeleteConfirm(false);

    const toastId = toast.loading(`正在删除文章: ${postToDelete.title}...`);

    try {
      const response = await fetch(`/api/admin/posts/${postToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除失败');
      }

      toast.success('文章删除成功', { id: toastId });
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
    } catch (err: any) {
      toast.error(`删除失败: ${err.message}`, { id: toastId });
    } finally {
      setDeletingId(null);
      setPostToDelete(null);
    }
  };

  return (
    <>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <Input
              placeholder="搜索文章标题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
              <TableHead className="w-[40px]"><Checkbox /></TableHead>
              <TableHead className="min-w-[250px]">标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>可见性</TableHead>
              <TableHead>最后更新</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map(post => (
              <TableRow key={post.id}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{post.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{post.visibility}</Badge>
                </TableCell>
                <TableCell>{formatDate(post.updatedAt)}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={deletingId === post.id}>
                        {deletingId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <DropdownMenuItem className="cursor-pointer"><Edit className="mr-2 h-4 w-4" />编辑</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem className="cursor-pointer"><Eye className="mr-2 h-4 w-4" />预览</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onSelect={() => handleOpenDeleteDialog(post)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          显示 <span className="font-medium">{filteredPosts.length}</span> / <span className="font-medium">{posts.length}</span> 篇文章
        </div>
      </CardFooter>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除文章 "{postToDelete?.title}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}