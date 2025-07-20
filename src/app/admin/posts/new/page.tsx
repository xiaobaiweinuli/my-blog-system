'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import dynamic from 'next/dynamic';
import { AdminSessionContext } from '@/app/admin/layout';
import type { PostFormData } from '@/components/admin/PostForm';

const PostForm = dynamic(() => import('@/components/admin/PostForm'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-screen">加载编辑器...</div>,
});

interface PostInfo {
  title: string;
  slug: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const { session, status }: { session: any, status: string } = useContext(AdminSessionContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allPosts, setAllPosts] = useState<PostInfo[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fetchAllPosts = async () => {
      try {
        const cachedPostsRaw = sessionStorage.getItem('cachedPosts');
        if (cachedPostsRaw) {
          const cachedPosts = JSON.parse(cachedPostsRaw);
          const postsInfo = cachedPosts.map((p: any) => ({ title: p.title, slug: p.id }));
          setAllPosts(postsInfo);
          return;
        }

        if (session?.github_access_token) {
          const response = await fetch('/api/admin/posts?meta=true', {
            headers: { 'Authorization': `Bearer ${session.github_access_token}` },
          });
          if (response.ok) {
            const posts = await response.json();
            setAllPosts(posts);
          }
        }
      } catch (error) {
        console.error('获取所有文章元数据失败:', error);
        toast.error('无法加载现有文章列表以进行验证。');
      }
    };

    if (session) {
      fetchAllPosts();
    }
  }, [session]);

  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise(resolve => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => resolve(func(...args)), waitFor);
      });
  };

  const checkTitleUniqueness = useCallback((title: string) => {
    if (allPosts.some(post => post.title.toLowerCase() === title.toLowerCase())) {
      setTitleError('此标题已存在，请使用其他标题。');
    } else {
      setTitleError(null);
    }
  }, [allPosts]);

  const checkSlugUniqueness = useCallback((slug: string) => {
    if (allPosts.some(post => post.slug.toLowerCase() === slug.toLowerCase())) {
      setSlugError('此 Slug 已被使用，请更换一个。');
    } else {
      setSlugError(null);
    }
  }, [allPosts]);

  const debouncedTitleCheck = useCallback(debounce(checkTitleUniqueness, 500), [checkTitleUniqueness]);
  const debouncedSlugCheck = useCallback(debounce(checkSlugUniqueness, 500), [checkSlugUniqueness]);

  const handleSubmit = async (formData: PostFormData) => {
    setIsSubmitting(true);
    try {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(formData.slug)) {
        toast.error('Slug格式无效，只能包含小写字母、数字和连字符(-)');
        setIsSubmitting(false);
        return;
      }

      if (!formData.title.trim() || !formData.slug.trim()) {
        toast.error('标题和Slug为必填项');
        setIsSubmitting(false);
        return;
      }

      // Final check before submitting
      if (allPosts.some(p => p.title.toLowerCase() === formData.title.toLowerCase())) {
        setTitleError('此标题已存在，请使用其他标题。');
        setIsSubmitting(false);
        return;
      }
      if (allPosts.some(p => p.slug.toLowerCase() === formData.slug.toLowerCase())) {
        setSlugError('此 Slug 已被使用，请更换一个。');
        setIsSubmitting(false);
        return;
      }
      if (titleError || slugError) {
        toast.error('请先解决错误再提交。');
        setIsSubmitting(false);
        return;
      }

      const postData = {
        ...formData,
        content: formData.content,
        tags:
          typeof formData.tags === 'string'
            ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : Array.isArray(formData.tags)
              ? formData.tags
              : [],
      };

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || '创建文章失败');
      }

      toast.success('文章创建成功!');
      sessionStorage.removeItem('posts-cache');
      router.push('/admin/posts');
    } catch (error) {
      console.error('创建文章失败:', error);
      toast.error(error instanceof Error ? error.message : '创建文章时发生未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/posts');
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  return (
    <PostForm
      title="创建新文章"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      submitButtonText="创建文章"
      onTitleChange={debouncedTitleCheck}
      onSlugChange={debouncedSlugCheck}
      titleError={titleError}
      slugError={slugError}
    />
  );
}