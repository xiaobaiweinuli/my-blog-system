import { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { Article } from "@/types"

/**
 * 生成基础元数据
 */
export function generateBaseMetadata({
  title,
  description,
  keywords,
  image,
  noIndex = false,
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
}): Metadata {
  const metaTitle = title 
    ? `${title} | ${siteConfig.name}` 
    : siteConfig.seo.defaultTitle
  
  const metaDescription = description || siteConfig.seo.description
  const metaImage = image || siteConfig.ogImage

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords || [],
    authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
    creator: siteConfig.author.name,
    publisher: siteConfig.name,
    robots: noIndex ? "noindex, nofollow" : "index, follow",
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: siteConfig.url,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      creator: siteConfig.author.twitter,
      site: siteConfig.author.twitter,
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
  }
}

/**
 * 生成文章页面元数据
 */
export function generateArticleMetadata(article: Article): Metadata {
  const { title, excerpt, summary, tags, coverImage, author, publishedAt, updatedAt } = article
  
  const description = summary || excerpt || ""
  const image = coverImage || siteConfig.ogImage
  const publishDate = publishedAt?.toISOString() || updatedAt.toISOString()
  const modifiedDate = updatedAt.toISOString()

  // 基础元数据
  const baseMetadata = generateBaseMetadata({
    title,
    description,
    keywords: tags,
    image,
  })

  // 文章特定的 OpenGraph 数据
  const openGraph = {
    ...baseMetadata.openGraph,
    type: "article",
    authors: [author.name],
    publishedTime: publishDate,
    modifiedTime: modifiedDate,
    tags,
  }

  // 结构化数据 (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: coverImage ? [coverImage] : [],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: author.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/articles/${article.slug}`,
    },
  }

  return {
    ...baseMetadata,
    openGraph: openGraph as any,
    twitter: {
      ...baseMetadata.twitter,
      title,
      description,
      images: [image],
    },
    other: {
      "article:published_time": publishDate,
      "article:modified_time": modifiedDate,
      "article:author": author.name,
      "article:tag": tags.join(","),
    },
    // 添加结构化数据
    alternates: {
      ...baseMetadata.alternates,
      canonical: `/articles/${article.slug}`,
    },
    // 结构化数据作为字符串添加到 script 标签中
    // 在实际应用中，需要在页面中手动添加这个脚本标签
    // 这里只是生成数据
    // structuredData: JSON.stringify(structuredData), // 移除不支持的属性
  }
}

/**
 * 生成分类页面元数据
 */
export function generateCategoryMetadata(category: string): Metadata {
  return generateBaseMetadata({
    title: `${category} 分类文章`,
    description: `查看 ${category} 分类下的所有文章`,
    keywords: [category, "分类", "文章"],
  })
}

/**
 * 生成标签页面元数据
 */
export function generateTagMetadata(tag: string): Metadata {
  return generateBaseMetadata({
    title: `${tag} 标签文章`,
    description: `查看包含 ${tag} 标签的所有文章`,
    keywords: [tag, "标签", "文章"],
  })
}

/**
 * 生成作者页面元数据
 */
export function generateAuthorMetadata(authorName: string): Metadata {
  return generateBaseMetadata({
    title: `${authorName} 的文章`,
    description: `查看 ${authorName} 发布的所有文章`,
    keywords: [authorName, "作者", "文章"],
  })
}

/**
 * 生成搜索页面元数据
 */
export function generateSearchMetadata(query?: string): Metadata {
  return generateBaseMetadata({
    title: query ? `搜索: ${query}` : "搜索",
    description: query 
      ? `搜索 "${query}" 的结果` 
      : "搜索网站内容",
    keywords: ["搜索", "查找", query].filter(Boolean) as string[],
    noIndex: true, // 搜索页面通常不需要被索引
  })
}

/**
 * 生成归档页面元数据
 */
export function generateArchiveMetadata(): Metadata {
  return generateBaseMetadata({
    title: "文章归档",
    description: "按时间浏览所有文章",
    keywords: ["归档", "时间线", "历史文章"],
  })
}

/**
 * 生成 JSON-LD 结构化数据脚本
 */
export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
