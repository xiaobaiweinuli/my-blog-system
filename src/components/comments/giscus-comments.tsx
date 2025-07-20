"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle } from "lucide-react"

interface GiscusCommentsProps {
  repo: string
  repoId: string
  category: string
  categoryId: string
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific" | "number"
  term?: string
  reactionsEnabled?: boolean
  emitMetadata?: boolean
  inputPosition?: "top" | "bottom"
  lang?: string
  loading?: "lazy" | "eager"
}

export function GiscusComments({
  repo,
  repoId,
  category,
  categoryId,
  mapping = "pathname",
  term,
  reactionsEnabled = true,
  emitMetadata = false,
  inputPosition = "bottom",
  lang,
  loading = "lazy",
}: GiscusCommentsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  
  // 中文静态文本
  const t = (key: string) => {
    const fallback: Record<string, string> = {
      title: '评论',
      configRequired: '评论区配置缺失',
      configInstructions: '请在 .env 文件中配置 Giscus 评论相关环境变量',
    }
    return fallback[key] || key
  }

  // Giscus 支持的语言映射
  const giscusLocaleMap: Record<string, string> = {
    zh: 'zh-CN',
    en: 'en',
    ja: 'ja',
  }

  const giscusLang = lang || giscusLocaleMap['zh'] || 'en'

  useEffect(() => {
    if (!ref.current || !repo || !repoId || !category || !categoryId) return

    // 清除之前的 Giscus 实例
    const existingScript = ref.current.querySelector("script")
    if (existingScript) {
      existingScript.remove()
    }

    // 创建新的 Giscus 脚本
    const script = document.createElement("script")
    script.src = "https://giscus.app/client.js"
    script.setAttribute("data-repo", repo)
    script.setAttribute("data-repo-id", repoId)
    script.setAttribute("data-category", category)
    script.setAttribute("data-category-id", categoryId)
    script.setAttribute("data-mapping", mapping)
    if (term) script.setAttribute("data-term", term)
    script.setAttribute("data-strict", "0")
    script.setAttribute("data-reactions-enabled", reactionsEnabled ? "1" : "0")
    script.setAttribute("data-emit-metadata", emitMetadata ? "1" : "0")
    script.setAttribute("data-input-position", inputPosition)
    script.setAttribute("data-theme", resolvedTheme === "dark" ? "dark" : "light")
    script.setAttribute("data-lang", giscusLang)
    script.setAttribute("data-loading", loading)
    script.crossOrigin = "anonymous"
    script.async = true

    ref.current.appendChild(script)
  }, [
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    term,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    giscusLang,
    loading,
    resolvedTheme,
  ])

  // 当主题变化时更新 Giscus 主题
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame")
    if (iframe) {
      iframe.contentWindow?.postMessage(
        {
          giscus: {
            setConfig: {
              theme: resolvedTheme === "dark" ? "dark" : "light",
            },
          },
        },
        "https://giscus.app"
      )
    }
  }, [resolvedTheme])

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={ref} />
      </CardContent>
    </Card>
  )
}

/**
 * 简化的 Giscus 评论组件
 * 使用环境变量配置
 */
export function SimpleGiscusComments({
  mapping = "pathname",
  term,
}: {
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific" | "number"
  term?: string
}) {
  let t: any = null
  try {
    t = (key: string) => {
      const fallback: Record<string, string> = {
        title: '评论',
        configRequired: '评论区配置缺失',
        configInstructions: '请在 .env 文件中配置 Giscus 评论相关环境变量',
      }
      return fallback[key] || key
    }
  } catch {
    t = (key: string) => {
      const fallback: Record<string, string> = {
        title: '评论',
        configRequired: '评论区配置缺失',
        configInstructions: '请在 .env 文件中配置 Giscus 评论相关环境变量',
      }
      return fallback[key] || key
    }
  }

  // 从环境变量获取配置
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID

  if (!repo || !repoId || !category || !categoryId) {
    if (process.env.NODE_ENV === "development") {
      return (
        <Card className="mt-8">
          <CardContent className="py-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t('configRequired')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('configInstructions')}
              <br />
              NEXT_PUBLIC_GISCUS_REPO
              <br />
              NEXT_PUBLIC_GISCUS_REPO_ID
              <br />
              NEXT_PUBLIC_GISCUS_CATEGORY
              <br />
              NEXT_PUBLIC_GISCUS_CATEGORY_ID
            </p>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <GiscusComments
      repo={repo}
      repoId={repoId}
      category={category}
      categoryId={categoryId}
      mapping={mapping}
      term={term}
    />
  )
}

export default SimpleGiscusComments;
