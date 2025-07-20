'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Image,
  Link,
  Globe,
  Zap,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Download
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { secureFetch } from '@/lib/utils/secure-fetch';
import { getCurrentTimestamp } from '@/lib/utils'

interface SEOAnalysis {
  score: number
  issues: SEOIssue[]
  suggestions: SEOSuggestion[]
  keywords: KeywordAnalysis[]
  metadata: MetadataAnalysis
  performance: PerformanceMetrics
  structuredData: StructuredDataAnalysis
}

interface SEOIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  category: 'content' | 'technical' | 'metadata' | 'performance'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  fix: string
  url?: string
}

interface SEOSuggestion {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
  implementation: string
  estimatedImpact: number
}

interface KeywordAnalysis {
  keyword: string
  density: number
  position: number
  difficulty: number
  volume: number
  trend: 'up' | 'down' | 'stable'
  suggestions: string[]
}

interface MetadataAnalysis {
  title: {
    content: string
    length: number
    isOptimal: boolean
    suggestions: string[]
  }
  description: {
    content: string
    length: number
    isOptimal: boolean
    suggestions: string[]
  }
  keywords: string[]
  openGraph: {
    isComplete: boolean
    missing: string[]
  }
  schema: {
    isPresent: boolean
    types: string[]
    errors: string[]
  }
}

interface PerformanceMetrics {
  loadTime: number
  coreWebVitals: {
    lcp: number
    fid: number
    cls: number
  }
  mobileScore: number
  desktopScore: number
}

interface StructuredDataAnalysis {
  isPresent: boolean
  types: string[]
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

interface SEOOptimizerProps {
  url?: string
  content?: string
  className?: string
}

export function SEOOptimizer({ url, content, className }: SEOOptimizerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'priority.high': '高',
      'priority.medium': '中',
      'priority.low': '低',
      implementation: '实施方法',
      estimatedImpact: '预估影响',
      apply: '应用',
    }
    
    return translations[key] || key
  }
  
  const { showToast } = useToast()
  
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [targetUrl, setTargetUrl] = useState(url || '')
  const [targetKeywords, setTargetKeywords] = useState('')

  // 执行SEO分析
  const analyzeSEO = async () => {
    if (!targetUrl.trim()) {
      showToast.error('请输入目标URL')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await secureFetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          content,
          keywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalysis(data.data.analysis)
          showToast.success('SEO分析完成')
        }
      }
    } catch (error) {
      console.error('SEO analysis failed:', error)
      showToast.error('SEO分析失败')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 应用SEO建议
  const applySuggestion = async (suggestionId: string) => {
    try {
      const response = await secureFetch('/api/seo/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, url: targetUrl })
      })

      if (response.ok) {
        showToast.success('优化建议已应用')
        // 重新分析
        await analyzeSEO()
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
      showToast.error('应用优化建议失败')
    }
  }

  // 导出SEO报告
  const exportReport = async () => {
    if (!analysis) return

    try {
      const response = await secureFetch('/api/seo/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, url: targetUrl })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `seo-report-${new Date(getCurrentTimestamp()).toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast.success('SEO报告已导出')
      }
    } catch (error) {
      console.error('Failed to export report:', error)
      showToast.error('导出报告失败')
    }
  }

  // 获取问题图标
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 获取SEO分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 分析输入 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索引擎优化分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seo-url-input">目标URL</Label>
              <Input
                id="seo-url-input"
                aria-label="目标URL"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/page"
              />
            </div>
            <div>
              <Label htmlFor="seo-keywords-input">目标关键词</Label>
              <Input
                id="seo-keywords-input"
                aria-label="目标关键词"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="关键词1, 关键词2"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={analyzeSEO}
              disabled={isAnalyzing || !targetUrl.trim()}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isAnalyzing ? '分析中...' : '开始SEO分析'}
            </Button>
            
            {analysis && (
              <Button
                variant="outline"
                onClick={exportReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                导出报告
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* SEO分数概览 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">SEO分数</h3>
                  <p className="text-sm text-muted-foreground">整体表现</p>
                </div>
                <div className="text-right">
                  <div className={cn("text-4xl font-bold", getScoreColor(analysis.score))}>
                    {analysis.score}
                  </div>
                  <div className="text-sm text-muted-foreground">满分100</div>
                </div>
              </div>
              
              <Progress value={analysis.score} className="mb-4" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {analysis.issues.filter(i => i.type === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">错误</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {analysis.issues.filter(i => i.type === 'warning').length}
                  </div>
                  <div className="text-sm text-muted-foreground">警告</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {analysis.suggestions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">建议</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细分析 */}
          <Tabs defaultValue="issues" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="issues">问题</TabsTrigger>
              <TabsTrigger value="keywords">关键词</TabsTrigger>
              <TabsTrigger value="metadata">元数据</TabsTrigger>
              <TabsTrigger value="performance">性能</TabsTrigger>
              <TabsTrigger value="suggestions">建议</TabsTrigger>
            </TabsList>

            {/* 问题列表 */}
            <TabsContent value="issues">
              <div className="space-y-4">
                {analysis.issues.map((issue) => (
                  <Alert key={issue.id} className={cn(
                    issue.type === 'error' && "border-red-200 bg-red-50",
                    issue.type === 'warning' && "border-yellow-200 bg-yellow-50",
                    issue.type === 'info' && "border-blue-200 bg-blue-50"
                  )}>
                    <div className="flex items-start gap-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          {issue.title}
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            issue.impact === 'high' && "border-red-500 text-red-700",
                            issue.impact === 'medium' && "border-yellow-500 text-yellow-700",
                            issue.impact === 'low' && "border-green-500 text-green-700"
                          )}>
                            {issue.impact === 'high' ? '高' : issue.impact === 'medium' ? '中' : '低'}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="mb-2">{issue.description}</p>
                          <div className="bg-muted p-3 rounded text-sm">
                            <strong>如何修复:</strong> {issue.fix}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </TabsContent>

            {/* 关键词分析 */}
            <TabsContent value="keywords">
              <div className="space-y-4">
                {analysis.keywords.map((keyword, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{keyword.keyword}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">密度: {keyword.density}%</Badge>
                          <Badge variant="outline">排名: #{keyword.position}</Badge>
                          {keyword.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground">难度</div>
                          <Progress value={keyword.difficulty} className="mt-1" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">搜索量</div>
                          <div className="font-medium">{keyword.volume.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">趋势</div>
                          <div className="font-medium">{keyword.trend === 'up' ? '上升' : keyword.trend === 'down' ? '下降' : '稳定'}</div>
                        </div>
                      </div>
                      
                      {keyword.suggestions.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">关键词建议:</div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {keyword.suggestions.map((suggestion, i) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 元数据分析 */}
            <TabsContent value="metadata">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      标题标签
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground">当前标题</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded">
                          {analysis.metadata.title.content}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">长度: </span>
                          <span className={cn(
                            "font-medium",
                            analysis.metadata.title.isOptimal ? "text-green-500" : "text-red-500"
                          )}>
                            {analysis.metadata.title.length} 字符
                          </span>
                        </div>
                        <Badge variant={analysis.metadata.title.isOptimal ? "default" : "destructive"}>
                          {analysis.metadata.title.isOptimal ? '最佳' : '需要改进'}
                        </Badge>
                      </div>
                      
                      {analysis.metadata.title.suggestions.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">建议:</div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {analysis.metadata.title.suggestions.map((suggestion, i) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      元描述
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground">当前描述</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded">
                          {analysis.metadata.description.content}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">长度: </span>
                          <span className={cn(
                            "font-medium",
                            analysis.metadata.description.isOptimal ? "text-green-500" : "text-red-500"
                          )}>
                            {analysis.metadata.description.length} 字符
                          </span>
                        </div>
                        <Badge variant={analysis.metadata.description.isOptimal ? "default" : "destructive"}>
                          {analysis.metadata.description.isOptimal ? '最佳' : '需要改进'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 性能指标 */}
            <TabsContent value="performance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>核心网页指标</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">LCP</span>
                        <span className="text-sm font-medium">{analysis.performance.coreWebVitals.lcp}s</span>
                      </div>
                      <Progress value={(4 - analysis.performance.coreWebVitals.lcp) / 4 * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">FID</span>
                        <span className="text-sm font-medium">{analysis.performance.coreWebVitals.fid}ms</span>
                      </div>
                      <Progress value={(300 - analysis.performance.coreWebVitals.fid) / 300 * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">CLS</span>
                        <span className="text-sm font-medium">{analysis.performance.coreWebVitals.cls}</span>
                      </div>
                      <Progress value={(0.25 - analysis.performance.coreWebVitals.cls) / 0.25 * 100} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>页面速度分数</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">移动分数</span>
                        <span className="text-sm font-medium">{analysis.performance.mobileScore}/100</span>
                      </div>
                      <Progress value={analysis.performance.mobileScore} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">桌面分数</span>
                        <span className="text-sm font-medium">{analysis.performance.desktopScore}/100</span>
                      </div>
                      <Progress value={analysis.performance.desktopScore} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 优化建议 */}
            <TabsContent value="suggestions">
              <div className="space-y-4">
                {analysis.suggestions.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <div className={cn("w-2 h-2 rounded-full", getPriorityColor(suggestion.priority))} />
                            <Badge variant="outline">{t(`priority.${suggestion.priority}`)}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {suggestion.description}
                          </p>
                          
                          <div className="bg-muted p-3 rounded text-sm">
                            <strong>{t('implementation')}:</strong> {suggestion.implementation}
                          </div>
                          
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">{t('estimatedImpact')}: </span>
                            <span className="font-medium text-green-500">+{suggestion.estimatedImpact}%</span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion.id)}
                          className="ml-4"
                        >
                          {t('apply')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  )
}
