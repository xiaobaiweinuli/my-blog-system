'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { PostFormData } from '@/components/admin/PostForm';
import { Post } from '@/types/post';
import nextDynamic from 'next/dynamic';
import matter from 'gray-matter';

const PostForm = nextDynamic(() => import('@/components/admin/PostForm'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-screen">加载编辑器...</div>,
});

interface PostInfo {
  title: string;
  slug: string;
}

export const dynamic = 'force-dynamic';

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

export default function EditPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [post, setPost] = useState<PostFormData | null>(null);
  const [originalTitle, setOriginalTitle] = useState<string>('');
  const [allPosts, setAllPosts] = useState<PostInfo[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'unauthenticated') {
        toast.error('请先登录');
        router.push('/api/auth/signin');
        return;
      }

      if (status === 'authenticated' && session) {
        setIsLoading(true);
        try {
          // Step 1: Fetch all posts meta for validation, using a multi-level cache
          let allPostsMeta: PostInfo[] = [];
          const cachedPostsMetaRaw = sessionStorage.getItem('cachedPostsMeta');
          const cachedPostsFullRaw = sessionStorage.getItem('cachedPosts');

          if (cachedPostsMetaRaw) {
            allPostsMeta = JSON.parse(cachedPostsMetaRaw);
          } else if (cachedPostsFullRaw) {
            const cachedPostsFull: Post[] = JSON.parse(cachedPostsFullRaw);
            allPostsMeta = cachedPostsFull.map(p => ({ title: p.title, slug: p.id }));
            sessionStorage.setItem('cachedPostsMeta', JSON.stringify(allPostsMeta));
          } else {
            const allPostsResponse = await fetch('/api/admin/posts?meta=true', {
              headers: { 'Authorization': `Bearer ${session.github_access_token}` },
            });
            if (allPostsResponse.ok) {
              allPostsMeta = await allPostsResponse.json();
              sessionStorage.setItem('cachedPostsMeta', JSON.stringify(allPostsMeta));
            }
          }
          setAllPosts(allPostsMeta);

          // Step 2: Fetch the specific post to edit (from cache if possible)
          const cachedPostRaw = sessionStorage.getItem(`post-edit-cache-${slug}`);
          if (cachedPostRaw) {
            const cachedPost = JSON.parse(cachedPostRaw);
            setPost(cachedPost);
            setOriginalTitle(cachedPost.title);
          } else {
            const postResponse = await fetch(`/api/admin/posts/${slug}`, {
              headers: { 'Authorization': `Bearer ${session.github_access_token}` },
            });
            if (!postResponse.ok) throw new Error('文章加载失败');
            const responseData = await postResponse.json();
            
            // 检查响应数据结构
            if (!responseData.data || !responseData.data.content) {
              throw new Error('无效的响应数据格式');
            }

            const { content, frontmatter } = responseData.data;

            const loadedData: PostFormData = {
              title: frontmatter.title || '',
              slug: slug,
              description: frontmatter.description || '',
              tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.join(',') : frontmatter.tags || '',
              coverImageUrl: frontmatter.coverImageUrl || '',
              language: frontmatter.language || 'zh',
              sticky: frontmatter.isSticky || false,
              status: frontmatter.status || 'draft',
              visibility: frontmatter.visibility || 'public',
              content: content.trim(),
            };
            
            setPost(loadedData);
            setOriginalTitle(loadedData.title);
            sessionStorage.setItem(`post-edit-cache-${slug}`, JSON.stringify(loadedData));
          }
        } catch (error) {
          console.error('加载数据失败:', error);
          toast.error(error instanceof Error ? error.message : '加载数据时发生未知错误');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [slug, session, status, router]);

  const checkTitleUniqueness = useCallback((title: string) => {
    if (typeof originalTitle !== 'string') {
      // Safeguard to prevent crash if originalTitle is not ready
      return;
    }
    if (title.toLowerCase() === originalTitle.toLowerCase()) {
      setTitleError(null);
      return;
    }
    // Exclude the current post from the uniqueness check
    if (allPosts.filter(p => p.slug !== slug).some(p => p.title.toLowerCase() === title.toLowerCase())) {
      setTitleError('此标题已存在，请使用其他标题。');
    } else {
      setTitleError(null);
    }
  }, [allPosts, originalTitle, slug]);

  const debouncedTitleCheck = useCallback(debounce(checkTitleUniqueness, 500), [checkTitleUniqueness]);

  const debouncedSave = useCallback(
    debounce((data: PostFormData) => {
      sessionStorage.setItem(`post-edit-cache-${slug}`, JSON.stringify(data));
    }, 1000),
    [slug]
  );

  const handleSubmit = async (formData: PostFormData) => {
    if (!formData.title.trim()) {
      toast.error('标题为必填项');
      return;
    }
    
    // Final check before submitting
    if (formData.title.toLowerCase() !== originalTitle.toLowerCase() && allPosts.filter(p => p.slug !== slug).some(p => p.title.toLowerCase() === formData.title.toLowerCase())) {
      setTitleError('此标题已存在，请使用其他标题。');
      return;
    }

    if (titleError) {
      toast.error('请先解决错误再提交。');
      return;
    }

    setIsSubmitting(true);
    try {
      // 直接使用 Markdown 内容，不再用 turndown 转换
      const response = await fetch(`/api/admin/posts/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.github_access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          content: formData.content,
          tags:
            typeof formData.tags === 'string'
              ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
              : Array.isArray(formData.tags)
                ? formData.tags
                : [],
        }),
      });

      if (response.ok) {
        toast.success('文章更新成功');
        sessionStorage.removeItem('cachedPosts');
        sessionStorage.removeItem('cachedPostsMeta');
        sessionStorage.removeItem(`post-edit-cache-${slug}`);
        router.push('/admin/posts');
      } else {
        const errorData = await response.json();
        toast.error(`更新失败: ${errorData.message}`);
      }
    } catch (error) {
      console.error('更新文章失败:', error);
      toast.error('更新文章失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/posts');
  };

  if (isLoading || !post) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  return (
    <PostForm
      title="编辑文章"
      initialData={post}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      submitButtonText="更新文章"
      isEditMode={true}
      onTitleChange={debouncedTitleCheck}
      titleError={titleError}
      onDataChange={debouncedSave}
    />
  );
}