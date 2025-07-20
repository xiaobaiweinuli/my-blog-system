import { siteConfig } from '@/config/site'

/**
 * 网站基础结构化数据
 */
export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
  }
}

/**
 * 组织结构化数据
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: siteConfig.links ? Object.values(siteConfig.links) : [],
  }
}

/**
 * 文章结构化数据
 */
export function generateArticleStructuredData({
  title,
  description,
  content,
  slug,
  publishedAt,
  updatedAt,
  author,
  category,
  tags = [],
  image,
}: {
  title: string
  description: string
  content: string
  slug: string
  publishedAt: string
  updatedAt?: string
  author: {
    name: string
    url?: string
    image?: string
  }
  category?: string
  tags?: string[]
  image?: string
}) {
  const articleUrl = `${siteConfig.url}/articles/${slug}`
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200) // 假设每分钟200字

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: articleUrl,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    wordCount,
    timeRequired: `PT${readingTime}M`,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
      image: author.image,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
        width: 1200,
        height: 630,
      },
    }),
    ...(category && {
      articleSection: category,
    }),
    ...(tags.length > 0 && {
      keywords: tags.join(', '),
    }),
  }
}

/**
 * 博客结构化数据
 */
export function generateBlogStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: siteConfig.name,
    description: siteConfig.description,
    url: `${siteConfig.url}/articles`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
  }
}

/**
 * 面包屑结构化数据
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  }
}

/**
 * 人员结构化数据
 */
export function generatePersonStructuredData({
  name,
  description,
  url,
  image,
  jobTitle,
  worksFor,
  sameAs = [],
}: {
  name: string
  description?: string
  url?: string
  image?: string
  jobTitle?: string
  worksFor?: string
  sameAs?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description,
    url,
    image,
    jobTitle,
    worksFor,
    sameAs,
  }
}

/**
 * FAQ 结构化数据
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * 搜索结果结构化数据
 */
export function generateSearchResultsStructuredData({
  query,
  totalResults,
  results,
}: {
  query: string
  totalResults: number
  results: Array<{
    title: string
    url: string
    description: string
  }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalResults,
      itemListElement: results.map((result, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: result.url,
        name: result.title,
        description: result.description,
      })),
    },
  }
}

/**
 * 软件应用结构化数据
 */
export function generateSoftwareApplicationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }
}

/**
 * 合并多个结构化数据
 */
export function combineStructuredData(...data: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': data,
  }
}

/**
 * 生成页面的完整结构化数据
 */
export function generatePageStructuredData({
  type = 'website',
  title,
  description,
  url,
  image,
  breadcrumbs = [],
  article,
  person,
  faqs,
}: {
  type?: 'website' | 'article' | 'blog' | 'profile'
  title: string
  description: string
  url: string
  image?: string
  breadcrumbs?: Array<{ name: string; url?: string }>
  article?: Parameters<typeof generateArticleStructuredData>[0]
  person?: Parameters<typeof generatePersonStructuredData>[0]
  faqs?: Array<{ question: string; answer: string }>
}) {
  const structuredDataItems: object[] = []

  // 基础网站数据
  structuredDataItems.push(generateWebsiteStructuredData())

  // 面包屑
  if (breadcrumbs.length > 0) {
    structuredDataItems.push(generateBreadcrumbStructuredData(breadcrumbs))
  }

  // 根据类型添加特定数据
  switch (type) {
    case 'article':
      if (article) {
        structuredDataItems.push(generateArticleStructuredData(article))
      }
      break
    case 'blog':
      structuredDataItems.push(generateBlogStructuredData())
      break
    case 'profile':
      if (person) {
        structuredDataItems.push(generatePersonStructuredData(person))
      }
      break
  }

  // FAQ 数据
  if (faqs && faqs.length > 0) {
    structuredDataItems.push(generateFAQStructuredData(faqs))
  }

  return combineStructuredData(...structuredDataItems)
}
