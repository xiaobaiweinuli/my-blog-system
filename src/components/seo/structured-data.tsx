import { siteConfig } from "@/config/site"
import { Article, User } from "@/types"

interface StructuredDataProps {
  type: "website" | "article" | "breadcrumb" | "organization" | "person"
  data?: any
}

/**
 * 网站结构化数据
 */
export function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.twitter,
    ].filter(Boolean),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * 文章结构化数据
 */
export function ArticleStructuredData({ article }: { article: Article }) {
  const getISOString = (d: any) => {
    if (!d) return ''
    try {
      return d instanceof Date ? d.toISOString() : new Date(d).toISOString()
    } catch {
      return ''
    }
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary || article.excerpt,
    image: article.coverImage ? [article.coverImage] : [],
    datePublished: getISOString(article.publishedAt) || getISOString(article.createdAt),
    dateModified: getISOString(article.updatedAt),
    author: {
      "@type": "Person",
      name: article.author.name,
      url: `${siteConfig.url}/authors/${article.author.id}`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/articles/${article.slug}`,
    },
    keywords: article.tags.join(", "),
    articleSection: article.category,
    wordCount: article.content.length,
    commentCount: 0, // 可以根据实际评论数量更新
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ReadAction",
        userInteractionCount: article.viewCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: article.likeCount,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * 面包屑导航结构化数据
 */
export function BreadcrumbStructuredData({ items }: { 
  items: Array<{ name: string; url: string }> 
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * 组织结构化数据
 */
export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/logo.png`,
      width: 512,
      height: 512,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.author.email,
      contactType: "customer service",
    },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.twitter,
    ].filter(Boolean),
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * 作者结构化数据
 */
export function PersonStructuredData({ author }: { author: User }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    email: author.email,
    image: author.avatar,
    url: `${siteConfig.url}/authors/${author.id}`,
    jobTitle: author.role === 'admin' ? '管理员' : author.role === 'collaborator' ? '协作者' : '用户',
    worksFor: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * FAQ 结构化数据
 */
export function FAQStructuredData({ faqs }: { 
  faqs: Array<{ question: string; answer: string }> 
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * 搜索结果结构化数据
 */
export function SearchResultsStructuredData({ 
  query, 
  results 
}: { 
  query: string
  results: Article[] 
}) {
  const getISOString = (d: any) => {
    if (!d) return undefined
    try {
      const date = d instanceof Date ? d : new Date(d)
      return isNaN(date.getTime()) ? undefined : date.toISOString()
    } catch {
      return undefined
    }
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: results.length,
      itemListElement: results.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Article",
          headline: article.title,
          description: article.summary || article.excerpt,
          url: `${siteConfig.url}/articles/${article.slug}`,
          datePublished: getISOString(article.publishedAt) || getISOString(article.createdAt),
          author: {
            "@type": "Person",
            name: article.author?.name || "",
          },
        },
      })),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
