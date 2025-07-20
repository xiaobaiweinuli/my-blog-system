"use client"

import { useState } from "react"
import { Sparkles, Tag, FileText, BarChart3, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface AIAssistantProps {
  title: string
  content: string
  onSummaryGenerated: (summary: string) => void
  onTagsRecommended: (tags: string[]) => void
}

export function AIAssistant({
  title,
  content,
  onSummaryGenerated,
  onTagsRecommended,
}: AIAssistantProps) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isRecommendingTags, setIsRecommendingTags] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  
  const [generatedSummary, setGeneratedSummary] = useState<string>("")
  const [recommendedTags, setRecommendedTags] = useState<string[]>([])
  const [contentAnalysis, setContentAnalysis] = useState<any>(null)

  // 生成摘要
  const handleGenerateSummary = async () => {
    if (!content.trim()) return
    let token = ''
      const cacheStr = localStorage.getItem('global_session_cache')
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }
    
    setIsGeneratingSummary(true)
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
        const response = await fetch(`${apiBase}/api/ai/tags`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content,
          options: {
            maxLength: 150,
            language: "zh",
            style: "formal",
          },
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedSummary(data.data)
        onSummaryGenerated(data.data)
      } else {
        console.error("摘要生成失败:", data.error)
      }
    } catch (error) {
      console.error("摘要生成错误:", error)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // 推荐标签
  const handleRecommendTags = async () => {
    if (!title.trim() || !content.trim()) return
    setIsRecommendingTags(true)
    try {
      // 获取 token
      let token = ''
      const cacheStr = localStorage.getItem('global_session_cache')
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
      const response = await fetch(`${apiBase}/api/ai/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          content
        }),
      })
      const data = await response.json()
      if (data.success) {
        setRecommendedTags(Array.isArray(data.data?.data) ? data.data.data : [])
        onTagsRecommended(Array.isArray(data.data?.data) ? data.data.data : [])
      } else {
        console.error("标签推荐失败:", data.error)
      }
    } catch (error) {
      console.error("标签推荐错误:", error)
    } finally {
      setIsRecommendingTags(false)
    }
  }

  // 分析内容质量
  const handleAnalyzeContent = async () => {
    if (!title.trim() || !content.trim()) return
    setIsAnalyzing(true)
    try {
      // 获取 token
      let token = ''
      const cacheStr = localStorage.getItem('global_session_cache')
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          token = cache?.user?.token || ''
        } catch {}
      }
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
      const response = await fetch(`${apiBase}/api/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          content
        }),
      })
      const data = await response.json()
      if (data.success) {
        setContentAnalysis(data.data?.data || null)
      } else {
        console.error("内容分析失败:", data.error)
      }
    } catch (error) {
      console.error("内容分析错误:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 复制摘要
  const handleCopySummary = async () => {
    if (!generatedSummary) return
    
    try {
      await navigator.clipboard.writeText(generatedSummary)
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2000)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const canUseAI = title.trim() && content.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI 助手
        </CardTitle>
        <CardDescription>
          使用 AI 分析内容质量
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="analysis">内容分析</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis" className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleAnalyzeContent}
                disabled={!title.trim() || !content.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    分析内容质量
                  </>
                )}
              </Button>
              {contentAnalysis && (
                <div className="space-y-4">
                  {/* 总体分数 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">内容质量分数</span>
                      <span className="text-lg font-bold text-primary">
                        {contentAnalysis.score}/100
                      </span>
                    </div>
                    <Progress value={contentAnalysis.score} className="h-2" />
                  </div>
                  <Separator />
                  {/* 详细分析 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">可读性:</span>
                      <span className="ml-2">{contentAnalysis.readabilityScore}/100</span>
                    </div>
                    <div>
                      <span className="font-medium">情感分数:</span>
                      <span className="ml-2">{contentAnalysis.sentimentScore}/100</span>
                    </div>
                  </div>
                  {/* 优势 */}
                  {contentAnalysis.strengths.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-green-600">优势:</span>
                      <ul className="text-sm space-y-1">
                        {contentAnalysis.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* 建议 */}
                  {contentAnalysis.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-orange-600">改进建议:</span>
                      <ul className="text-sm space-y-1">
                        {contentAnalysis.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        {(!title.trim() || !content.trim()) && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            请先输入标题和内容以使用 AI 功能
          </div>
        )}
      </CardContent>
    </Card>
  )
}
