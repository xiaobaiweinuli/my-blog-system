"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { analyzeArticleSEO, getSEOGrade, generateSEORecommendations } from "@/lib/seo-analyzer"
import type { Article } from "@/types"

interface SEOAnalyzerProps {
  article: Partial<Article>
}

export function SEOAnalyzer({ article }: SEOAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeArticleSEO> | null>(null)
  
  // 当文章内容变化时重新分析
  useEffect(() => {
    if (!article.title || !article.content) return
    
    // 创建一个完整的文章对象用于分析
    const fullArticle: Article = {
      id: article.id || "draft",
      title: article.title || "",
      slug: article.slug || "",
      content: article.content || "",
      excerpt: article.excerpt || "",
      summary: article.summary || "",
      coverImage: article.coverImage || "",
      tags: article.tags || [],
      category: article.category || "",
      status: article.status || "draft",
      authorId: article.authorId || "",
      author: article.author || {
        id: "current-user",
        name: "当前用户",
        email: "",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      publishedAt: article.publishedAt,
      createdAt: article.createdAt || new Date(),
      updatedAt: article.updatedAt || new Date(),
      viewCount: article.viewCount || 0,
      likeCount: article.likeCount || 0,
    }
    
    const result = analyzeArticleSEO(fullArticle)
    setAnalysis(result)
  }, [article])
  
  if (!analysis) return null
  
  const { score, issues, suggestions, strengths } = analysis
  const { grade, color, description } = getSEOGrade(score)
  const recommendations = generateSEORecommendations(analysis)
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">SEO 分析</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "收起" : "展开"}
          </Button>
        </div>
        <CardDescription>
          文章 SEO 质量评分
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 分数展示 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${color}`}>
                {grade}
              </div>
              <div className="text-sm text-muted-foreground">
                ({score}/100) - {description}
              </div>
            </div>
          </div>
          
          {/* 进度条 */}
          <Progress value={score} className="h-2" />
          
          {isOpen && (
            <div className="space-y-4 pt-2">
              {/* 问题列表 */}
              {issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">需要改进的地方</h4>
                  <div className="space-y-1">
                    {issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        {issue.type === "error" ? (
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        ) : issue.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        )}
                        <div>
                          <span className="font-medium">{issue.field}: </span>
                          {issue.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* 优势列表 */}
              {strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">SEO 优势</h4>
                  <div className="space-y-1">
                    {strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>{strength}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* 建议列表 */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">改进建议</h4>
                  <div className="space-y-1">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>{recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* SEO 标签 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">SEO 关键因素</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={article.title ? "default" : "outline"}>
                    标题
                  </Badge>
                  <Badge variant={article.excerpt || article.summary ? "default" : "outline"}>
                    描述
                  </Badge>
                  <Badge variant={article.slug ? "default" : "outline"}>
                    URL
                  </Badge>
                  <Badge variant={article.tags && article.tags.length > 0 ? "default" : "outline"}>
                    标签
                  </Badge>
                  <Badge variant={article.category ? "default" : "outline"}>
                    分类
                  </Badge>
                  <Badge variant={article.coverImage ? "default" : "outline"}>
                    图片
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
