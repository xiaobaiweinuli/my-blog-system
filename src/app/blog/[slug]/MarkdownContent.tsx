'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { useMemo } from 'react';
import rehypeSlug from 'rehype-slug';

interface MarkdownContentProps {
  content: string;
  ext?: string;
  mdxSource?: MDXRemoteSerializeResult;
}

export default function MarkdownContent({ content, ext, mdxSource }: MarkdownContentProps) {
  // 使用 useMemo 缓存组件，避免不必要的重渲染
  const components = useMemo(() => ({
    // 这里可以添加自定义组件
    h1: (props: any) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
    h3: (props: any) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
    p: (props: any) => <p className="my-4" {...props} />,
    ul: (props: any) => <ul className="list-disc list-inside my-4" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-inside my-4" {...props} />,
    code: (props: any) => (
      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props} />
    ),
    pre: (props: any) => (
      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-4 my-4 overflow-x-auto" {...props} />
    ),
  }), []);

  if (ext === '.mdx' && mdxSource) {
    try {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote {...mdxSource} components={components} />
        </div>
      );
    } catch (error) {
      console.error('Error rendering MDX content:', error);
      return (
        <div className="prose dark:prose-invert max-w-none">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded p-4 my-4">
            <h3 className="text-red-800 dark:text-red-200 font-bold">渲染错误</h3>
            <p className="text-red-700 dark:text-red-300">
              抱歉，渲染内容时出现错误。请稍后再试或联系管理员。
            </p>
          </div>
        </div>
      );
    }
  }

  // 默认 markdown 渲染
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
