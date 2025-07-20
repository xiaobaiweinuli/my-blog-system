"use client"

import Head from "next/head"
import { usePathname } from "next/navigation"
import { siteConfig } from "@/config/site"

interface MetaTagsProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  type?: "website" | "article" | "profile"
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  noIndex?: boolean
  alternateLanguages?: Record<string, string>
  jsonLd?: object
}

export function MetaTags({
  title,
  description,
  keywords = [],
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags = [],
  noIndex = false,
  alternateLanguages = {},
  jsonLd,
}: MetaTagsProps) {
  const pathname = usePathname()
  
  const metaTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.seo.defaultTitle

  const metaDescription = description || siteConfig.seo.description
  const metaImage = image || siteConfig.ogImage
  const url = `${siteConfig.url}${pathname}`

  // 语言映射
  const localeMap: Record<string, string> = {
    zh: 'zh_CN',
    en: 'en_US',
    ja: 'ja_JP',
  }

  const ogLocale = localeMap['zh'] || 'zh_CN'
  
  return (
    <Head>
      {/* 基础元数据 */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* 规范链接 */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={ogLocale} />

      {/* 多语言链接 */}
      {Object.entries(alternateLanguages).map(([lang, href]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.author.twitter} />
      <meta name="twitter:creator" content={siteConfig.author.twitter} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      
      {/* 文章特定元数据 */}
      {type === "article" && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {author && <meta property="article:author" content={author} />}
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* 其他元数据 */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="color-scheme" content="light dark" />
      <meta name="author" content={siteConfig.author.name} />
      
      {/* 图标 */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* JSON-LD 结构化数据 */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  )
}
