'use client';

import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';
import { Post } from '@/lib/posts';
import MarkdownContent from './MarkdownContent';
import dynamic from 'next/dynamic';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import TocSidebar, { TocHeading } from '@/components/TocSidebar';
import { extractTocHeadings } from '@/lib/toc-utils';
import { useEffect, useRef } from 'react';
import React from 'react';
import Link from 'next/link';
import { NextSeo, ArticleJsonLd } from 'next-seo';

// Lazy load部分重组件
const CommentsSection = dynamic(
  () => import('@/components/GiscusComments'),
  { 
    ssr: false,
    loading: () => <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
  }
);

const OptimizedImage = dynamic(
  () => import('@/components/ui/OptimizedImage'),
  {
    ssr: true,
    loading: () => <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
  }
);

// Client-side only components
const MarkdownImageEnhancer = dynamic(
  () => import('@/components/markdown/MarkdownImageEnhancer').then(mod => mod.MarkdownImageEnhancer),
  { ssr: false }
);

interface PostPageClientProps {
  post: Post;
  isAuthor: boolean;
  mdxSource?: MDXRemoteSerializeResult;
  seoProps?: any;
}

export default function PostPageClient({ post, isAuthor, mdxSource, seoProps }: PostPageClientProps) {
  // 目录数据
  const tocHeadings: TocHeading[] = extractTocHeadings(post.content);
  // 当前高亮 heading id
  const [activeId, setActiveId] = React.useState('');
  // 移动端目录抽屉
  const [showToc, setShowToc] = React.useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // 滚动监听高亮
  useEffect(() => {
    if (tocHeadings.length === 0) return;
    const headingIds: string[] = [];
    function collectIds(list: TocHeading[]) {
      for (const h of list) {
        headingIds.push(h.id);
        if (h.children) collectIds(h.children);
      }
    }
    collectIds(tocHeadings);

    function onScroll() {
      let cur = '';
      for (let i = headingIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(headingIds[i]);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top < 180) { // 阈值可调
            cur = headingIds[i];
            break;
          }
        }
      }
      setActiveId(cur);
    }
    window.addEventListener('scroll', onScroll);
    setTimeout(onScroll, 100); // 挂载和 tocHeadings 变化时立即执行一次
    return () => window.removeEventListener('scroll', onScroll);
  }, [tocHeadings]);

  // 锚点跳转
  const handleHeadingClick = (id: string) => {
    setShowToc(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // 返回顶部
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowToc(false);
  };

  return (
    <div className="relative">
      {/* SEO 相关组件 */}
      {seoProps && (
        <>
          <NextSeo {...seoProps} />
          <ArticleJsonLd {...seoProps.articleJsonLd} />
        </>
      )}
      {/* 主内容区，始终居中 */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            <time dateTime={new Date(post.date).toISOString()}>
              {new Date(post.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {isAuthor && (
              <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded dark:bg-blue-900 dark:text-blue-200">
                作者
              </span>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-blue-200 transition">{tag}</Badge>
                </Link>
              ))}
            </div>
          )}
          {post.coverImageUrl && (
            <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden mb-8" style={{ aspectRatio: '16/5' }}>
              <OptimizedImage
                src={post.coverImageUrl}
                alt={post.title}
                width={1600}
                height={500}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          )}
        </header>
        {/* Client-side markdown rendering with lazy loading */}
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading content...</div>}>
          <MarkdownContent content={post.content} ext={post.ext} mdxSource={mdxSource} />
        </Suspense>
        {/* Client-side image enhancement */}
        <MarkdownImageEnhancer />
        <div className="mt-8 border-t pt-8">
          <Suspense fallback={<div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
            <CommentsSection />
          </Suspense>
        </div>
      </article>
      {/* 右侧目录，仅大屏显示 */}
      {tocHeadings.length > 0 && (
        <div className="hidden lg:block">
          <div className="fixed top-24 right-8 w-[300px] z-40">
            <TocSidebar
              headings={tocHeadings}
              activeId={activeId}
              onHeadingClick={handleHeadingClick}
              onBackToTop={handleBackToTop}
              isMobile={false}
              show={true}
            />
          </div>
        </div>
      )}
      {/* 移动端目录按钮和抽屉 */}
      {tocHeadings.length > 0 && (
        <>
          <button
            className="fixed bottom-6 right-6 z-50 lg:hidden bg-blue-500 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl"
            onClick={() => setShowToc(true)}
            aria-label="打开目录"
          >
            目
          </button>
          <TocSidebar
            headings={tocHeadings}
            activeId={activeId}
            onHeadingClick={handleHeadingClick}
            onBackToTop={handleBackToTop}
            isMobile={true}
            show={showToc}
            onClose={() => setShowToc(false)}
          />
        </>
      )}
    </div>
  );
}
