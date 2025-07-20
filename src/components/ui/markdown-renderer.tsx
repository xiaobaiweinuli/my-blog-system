"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import { cn } from "@/lib/utils"
import type { Components } from "react-markdown"

// 导入代码高亮样式
import "highlight.js/styles/github.css"

interface MarkdownRendererProps {
  content: string
  className?: string
}

// 代码块组件
function CodeBlock({ language, children }: { language: string; children: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative my-6 group">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {/* macOS 风格的圆点 */}
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          {language && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {language}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 折叠按钮 */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title={isCollapsed ? "展开" : "折叠"}
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 复制按钮 */}
          <button
            onClick={copyToClipboard}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="复制代码"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 代码内容 */}
      {!isCollapsed && (
        <div className="transition-all duration-300">
          <pre className="bg-gray-50 dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg p-4 overflow-x-auto m-0">
            <code className={`language-${language} text-sm`}>
              {children}
            </code>
          </pre>
        </div>
      )}

      {/* 折叠状态提示 */}
      {isCollapsed && (
        <div
          className="bg-gray-50 dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg px-4 py-2 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setIsCollapsed(false)}
          title="点击展开代码"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400">代码已折叠，点击展开查看</span>
        </div>
      )}
    </div>
  )
}

// 自定义组件映射
const components: Components = {
  // 处理 pre 标签（代码块的容器）
  pre({ children, ...props }: any) {
    // 从子元素中提取代码内容和语言
    const codeElement = children?.props
    const className = codeElement?.className || ''
    const match = /language-(\w+)/.exec(className)
    const language = match ? match[1] : ''
    const codeContent = String(codeElement?.children || '')

    return <CodeBlock language={language} children={codeContent} />
  },

  // 处理内联代码
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')

    // 如果没有语言标识，说明是内联代码
    if (!match) {
      return (
        <code
          className="px-2 py-1 mx-0.5 bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }

    // 如果有语言标识但不在 pre 标签内，也当作内联代码处理
    return (
      <code
        className="px-2 py-1 mx-0.5 bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    )
  },

  // 链接
  a({ href, children, ...props }) {
    const isExternal = href?.startsWith('http')
    return (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-600/30 hover:decoration-blue-600/60 transition-colors"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
        {isExternal && (
          <svg className="inline w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
          </svg>
        )}
      </a>
    )
  },

  // 标题
  h1: ({ children, ...props }) => {
    // 更健壮的文本提取方法
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (Array.isArray(node)) return node.map(extractText).join('')
      if (node && typeof node === 'object' && node.props && node.props.children) {
        return extractText(node.props.children)
      }
      return ''
    }

    const text = extractText(children)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // 支持中文字符
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    return (
      <h1 id={id} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8 pb-3 border-b border-gray-200 dark:border-gray-700 scroll-mt-20" {...props}>
        {children}
      </h1>
    )
  },
  h2: ({ children, ...props }) => {
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (Array.isArray(node)) return node.map(extractText).join('')
      if (node && typeof node === 'object' && node.props && node.props.children) {
        return extractText(node.props.children)
      }
      return ''
    }

    const text = extractText(children)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    return (
      <h2 id={id} className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-8 scroll-mt-20" {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }) => {
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (Array.isArray(node)) return node.map(extractText).join('')
      if (node && typeof node === 'object' && node.props && node.props.children) {
        return extractText(node.props.children)
      }
      return ''
    }

    const text = extractText(children)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    return (
      <h3 id={id} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6 scroll-mt-20" {...props}>
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }) => {
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (Array.isArray(node)) return node.map(extractText).join('')
      if (node && typeof node === 'object' && node.props && node.props.children) {
        return extractText(node.props.children)
      }
      return ''
    }

    const text = extractText(children)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    return (
      <h4 id={id} className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4 scroll-mt-20" {...props}>
        {children}
      </h4>
    )
  },
  h5: ({ children, ...props }) => {
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (Array.isArray(node)) return node.map(extractText).join('')
      if (node && typeof node === 'object' && node.props && node.props.children) {
        return extractText(node.props.children)
      }
      return ''
    }

    const text = extractText(children)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    return (
      <h5 id={id} className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4 scroll-mt-20" {...props}>
        {children}
      </h5>
    )
  },
  h6: ({ children, ...props }) => {
    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (Array.isArray(node)) return node.map(extractText).join('')
      if (node && typeof node === 'object' && node.props && node.props.children) {
        return extractText(node.props.children)
      }
      return ''
    }

    const text = extractText(children)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    return (
      <h6 id={id} className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4 scroll-mt-20" {...props}>
        {children}
      </h6>
    )
  },

  // 段落
  p: ({ children, ...props }) => (
    <p className="text-gray-700 dark:text-gray-300 leading-7 mb-4 text-base" {...props}>
      {children}
    </p>
  ),

  // 列表
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside space-y-2 mb-6 text-gray-700 dark:text-gray-300 pl-6 ml-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside space-y-2 mb-6 text-gray-700 dark:text-gray-300 pl-6 ml-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-7 pl-2" {...props}>
      {children}
    </li>
  ),

  // 引用
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-6 bg-blue-50/50 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300 italic rounded-r-md" {...props}>
      {children}
    </blockquote>
  ),

  // 表格
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </td>
  ),

  // 分割线
  hr: ({ ...props }) => (
    <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />
  ),

  // 强调
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </em>
  ),
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    )
  }

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  )
}
