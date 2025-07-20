import { Article } from "@/types"

/**
 * SEO 分析结果接口
 */
export interface SEOAnalysis {
  score: number // 0-100 分数
  issues: SEOIssue[]
  suggestions: string[]
  strengths: string[]
}

export interface SEOIssue {
  type: "error" | "warning" | "info"
  message: string
  field: string
}

/**
 * 分析文章的 SEO 质量
 */
export function analyzeArticleSEO(article: Article): SEOAnalysis {
  const issues: SEOIssue[] = []
  const suggestions: string[] = []
  const strengths: string[] = []
  let score = 100

  // 检查标题
  if (!article.title) {
    issues.push({
      type: "error",
      message: "文章标题不能为空",
      field: "title"
    })
    score -= 20
  } else {
    if (article.title.length < 10) {
      issues.push({
        type: "warning",
        message: "标题太短，建议至少10个字符",
        field: "title"
      })
      score -= 10
    } else if (article.title.length > 60) {
      issues.push({
        type: "warning",
        message: "标题太长，建议不超过60个字符",
        field: "title"
      })
      score -= 5
    } else {
      strengths.push("标题长度适中")
    }
  }

  // 检查描述/摘要
  const description = article.summary || article.excerpt
  if (!description) {
    issues.push({
      type: "error",
      message: "缺少文章摘要或描述",
      field: "description"
    })
    score -= 15
    suggestions.push("添加文章摘要以提升搜索引擎可见性")
  } else {
    if (description.length < 50) {
      issues.push({
        type: "warning",
        message: "描述太短，建议至少50个字符",
        field: "description"
      })
      score -= 8
    } else if (description.length > 160) {
      issues.push({
        type: "warning",
        message: "描述太长，建议不超过160个字符",
        field: "description"
      })
      score -= 5
    } else {
      strengths.push("描述长度适中")
    }
  }

  // 检查 URL slug
  if (!article.slug) {
    issues.push({
      type: "error",
      message: "缺少 URL 别名",
      field: "slug"
    })
    score -= 10
  } else {
    if (article.slug.includes(" ")) {
      issues.push({
        type: "error",
        message: "URL 别名不应包含空格",
        field: "slug"
      })
      score -= 5
    }
    if (article.slug.length > 50) {
      issues.push({
        type: "warning",
        message: "URL 别名太长，建议不超过50个字符",
        field: "slug"
      })
      score -= 3
    }
    if (!/^[a-z0-9-]+$/.test(article.slug)) {
      issues.push({
        type: "warning",
        message: "URL 别名建议只使用小写字母、数字和连字符",
        field: "slug"
      })
      score -= 3
    } else {
      strengths.push("URL 别名格式正确")
    }
  }

  // 检查标签
  if (article.tags.length === 0) {
    issues.push({
      type: "warning",
      message: "没有设置标签",
      field: "tags"
    })
    score -= 5
    suggestions.push("添加相关标签以提升文章分类和搜索性")
  } else if (article.tags.length > 10) {
    issues.push({
      type: "warning",
      message: "标签过多，建议不超过10个",
      field: "tags"
    })
    score -= 3
  } else {
    strengths.push(`设置了 ${article.tags.length} 个标签`)
  }

  // 检查分类
  if (!article.category) {
    issues.push({
      type: "warning",
      message: "没有设置分类",
      field: "category"
    })
    score -= 5
  } else {
    strengths.push("已设置文章分类")
  }

  // 检查内容长度
  if (article.content.length < 300) {
    issues.push({
      type: "warning",
      message: "内容太短，建议至少300个字符",
      field: "content"
    })
    score -= 10
    suggestions.push("增加内容长度以提升搜索引擎排名")
  } else if (article.content.length > 10000) {
    issues.push({
      type: "info",
      message: "内容很长，考虑分割为多篇文章",
      field: "content"
    })
  } else {
    strengths.push("内容长度适中")
  }

  // 检查封面图片
  if (!article.coverImage) {
    issues.push({
      type: "info",
      message: "没有设置封面图片",
      field: "coverImage"
    })
    suggestions.push("添加封面图片以提升社交媒体分享效果")
  } else {
    strengths.push("已设置封面图片")
  }

  // 检查标题中是否包含关键词
  const titleWords = article.title.toLowerCase().split(/\s+/)
  const hasKeywords = article.tags.some(tag => 
    titleWords.some(word => word.includes(tag.toLowerCase()))
  )
  if (!hasKeywords) {
    suggestions.push("考虑在标题中包含主要关键词")
    score -= 3
  } else {
    strengths.push("标题包含关键词")
  }

  // 检查内容结构（标题层级）
  const headingMatches = article.content.match(/^#{1,6}\s+.+$/gm)
  if (!headingMatches || headingMatches.length < 2) {
    issues.push({
      type: "info",
      message: "内容缺少标题结构",
      field: "content"
    })
    suggestions.push("使用标题（H1-H6）来组织内容结构")
    score -= 5
  } else {
    strengths.push("内容具有良好的标题结构")
  }

  // 检查内部链接
  const internalLinks = article.content.match(/\[.*?\]\(\/.*?\)/g)
  if (!internalLinks || internalLinks.length === 0) {
    suggestions.push("添加内部链接以提升网站内容关联性")
    score -= 2
  } else {
    strengths.push("包含内部链接")
  }

  // 确保分数在 0-100 范围内
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues,
    suggestions,
    strengths
  }
}

/**
 * 获取 SEO 分数等级
 */
export function getSEOGrade(score: number): {
  grade: string
  color: string
  description: string
} {
  if (score >= 90) {
    return {
      grade: "A+",
      color: "text-green-600",
      description: "优秀"
    }
  } else if (score >= 80) {
    return {
      grade: "A",
      color: "text-green-500",
      description: "良好"
    }
  } else if (score >= 70) {
    return {
      grade: "B",
      color: "text-yellow-500",
      description: "一般"
    }
  } else if (score >= 60) {
    return {
      grade: "C",
      color: "text-orange-500",
      description: "需要改进"
    }
  } else {
    return {
      grade: "D",
      color: "text-red-500",
      description: "急需改进"
    }
  }
}

/**
 * 生成 SEO 改进建议
 */
export function generateSEORecommendations(analysis: SEOAnalysis): string[] {
  const recommendations: string[] = []

  // 基于分数给出总体建议
  if (analysis.score < 60) {
    recommendations.push("您的文章 SEO 分数较低，建议优先解决错误和警告问题")
  } else if (analysis.score < 80) {
    recommendations.push("您的文章 SEO 表现一般，可以通过优化获得更好的搜索排名")
  } else {
    recommendations.push("您的文章 SEO 表现良好，继续保持这种质量")
  }

  // 添加具体建议
  recommendations.push(...analysis.suggestions)

  // 基于问题类型给出建议
  const errorCount = analysis.issues.filter(issue => issue.type === "error").length
  const warningCount = analysis.issues.filter(issue => issue.type === "warning").length

  if (errorCount > 0) {
    recommendations.push(`发现 ${errorCount} 个严重问题，请优先解决`)
  }
  if (warningCount > 0) {
    recommendations.push(`发现 ${warningCount} 个警告，建议逐步改进`)
  }

  return recommendations
}
