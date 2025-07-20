'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  Lightbulb,
  Star,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  Users,
  DollarSign
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { getCurrentTimestamp, getRandomNumber } from '@/lib/utils'

interface Keyword {
  keyword: string
  volume: number
  difficulty: number
  cpc: number
  competition: number
  trend: 'up' | 'down' | 'stable'
  trendData: number[]
  relatedKeywords: string[]
  questions: string[]
  intent: 'informational' | 'navigational' | 'transactional' | 'commercial'
  seasonality: {
    month: string
    volume: number
  }[]
}

interface KeywordGroup {
  id: string
  name: string
  keywords: string[]
  totalVolume: number
  avgDifficulty: number
  color: string
}

interface CompetitorAnalysis {
  domain: string
  keywords: number
  traffic: number
  topKeywords: {
    keyword: string
    position: number
    volume: number
  }[]
}

interface KeywordResearchProps {
  className?: string
}

export function KeywordResearch({ className }: KeywordResearchProps) {
  // 检查是否有国际化上下文
  const t = (key: string) => {
    const fallback = {
      title: '关键词研究',
      description: '分析和优化您的关键词策略',
      searchPlaceholder: '输入关键词或主题...',
      searchButton: '搜索',
      loading: '分析中...',
      noResults: '暂无结果',
      error: '搜索失败，请重试',
      keyword: '关键词',
      volume: '搜索量',
      difficulty: '难度',
      cpc: 'CPC',
      competition: '竞争度',
      suggestions: '相关建议',
      trends: '趋势分析',
      export: '导出数据',
      save: '保存到关键词库'
    }
    return (fallback as any)[key] || key
  }
  
  const { showToast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([])
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState({
    minVolume: 0,
    maxVolume: 100000,
    minDifficulty: 0,
    maxDifficulty: 100,
    intent: 'all',
    language: 'zh'
  })
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])

  // 搜索关键词
  const searchKeywords = async () => {
    if (!searchQuery.trim()) {
      showToast.error(t('enterKeyword'))
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          language: 'zh', // 固定为中文
          filters
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setKeywords(data.data.keywords)
          showToast.success(t('searchComplete'))
        }
      }
    } catch (error) {
      console.error('Keyword search failed:', error)
      showToast.error(t('searchFailed'))
    } finally {
      setIsSearching(false)
    }
  }

  // 分析竞争对手
  const analyzeCompetitors = async (domain: string) => {
    try {
      const response = await fetch('/api/keywords/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCompetitors(prev => [...prev, data.data.analysis])
        }
      }
    } catch (error) {
      console.error('Competitor analysis failed:', error)
      showToast.error(t('competitorAnalysisFailed'))
    }
  }

  // 创建关键词组
  const createKeywordGroup = () => {
    if (selectedKeywords.length === 0) {
      showToast.error(t('selectKeywordsFirst'))
      return
    }

    const newGroup: KeywordGroup = {
      id: getCurrentTimestamp().toString(),
      name: `${t('group')} ${keywordGroups.length + 1}`,
      keywords: [...selectedKeywords],
      totalVolume: selectedKeywords.reduce((sum, kw) => {
        const keyword = keywords.find(k => k.keyword === kw)
        return sum + (keyword?.volume || 0)
      }, 0),
      avgDifficulty: selectedKeywords.reduce((sum, kw) => {
        const keyword = keywords.find(k => k.keyword === kw)
        return sum + (keyword?.difficulty || 0)
      }, 0) / selectedKeywords.length,
      color: `hsl(${getRandomNumber(0, 360)}, 70%, 50%)`
    }

    setKeywordGroups(prev => [...prev, newGroup])
    setSelectedKeywords([])
    showToast.success(t('groupCreated'))
  }

  // 导出关键词
  const exportKeywords = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch('/api/keywords/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: selectedKeywords.length > 0 ? selectedKeywords : keywords.map(k => k.keyword),
          format
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `keywords-${new Date(getCurrentTimestamp()).toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast.success(t('exportSuccess'))
      }
    } catch (error) {
      console.error('Export failed:', error)
      showToast.error(t('exportFailed'))
    }
  }

  // 切换关键词选择
  const toggleKeywordSelection = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  // 过滤关键词
  const filteredKeywords = keywords.filter(keyword => {
    if (keyword.volume < filters.minVolume || keyword.volume > filters.maxVolume) return false
    if (keyword.difficulty < filters.minDifficulty || keyword.difficulty > filters.maxDifficulty) return false
    if (filters.intent !== 'all' && keyword.intent !== filters.intent) return false
    return true
  })

  // 获取趋势图标
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取意图颜色
  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'informational':
        return 'bg-blue-500'
      case 'navigational':
        return 'bg-green-500'
      case 'transactional':
        return 'bg-red-500'
      case 'commercial':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 搜索区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('keywordResearch')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <label htmlFor="keyword-search-input" className="sr-only">关键词搜索</label>
            <Input
              id="keyword-search-input"
              aria-label={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && searchKeywords()}
              className="flex-1"
            />
            <Button
              onClick={searchKeywords}
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? t('searching') : t('search')}
            </Button>
          </div>

          {/* 过滤器 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>{t('searchVolume')}</Label>
              <div className="px-3">
                <Slider
                  value={[filters.minVolume, filters.maxVolume]}
                  onValueChange={([min, max]: number[]) => setFilters(prev => ({
                    ...prev, 
                    minVolume: min, 
                    maxVolume: max 
                  }))}
                  max={100000}
                  step={1000}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatNumber(filters.minVolume)}</span>
                  <span>{formatNumber(filters.maxVolume)}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>{t('difficulty')}</Label>
              <div className="px-3">
                <Slider
                  value={[filters.minDifficulty, filters.maxDifficulty]}
                  onValueChange={([min, max]: number[]) => setFilters(prev => ({
                    ...prev, 
                    minDifficulty: min, 
                    maxDifficulty: max 
                  }))}
                  max={100}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{filters.minDifficulty}</span>
                  <span>{filters.maxDifficulty}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>{t('searchIntent')}</Label>
              <Select
                value={filters.intent}
                onValueChange={(value) => setFilters(prev => ({ ...prev, intent: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allIntents')}</SelectItem>
                  <SelectItem value="informational">{t('informational')}</SelectItem>
                  <SelectItem value="navigational">{t('navigational')}</SelectItem>
                  <SelectItem value="transactional">{t('transactional')}</SelectItem>
                  <SelectItem value="commercial">{t('commercial')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              {selectedKeywords.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={createKeywordGroup}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('createGroup')}
                  </Button>
                  
                  <Select onValueChange={(format) => exportKeywords(format as 'csv' | 'xlsx')}>
                    <SelectTrigger className="w-32">
                      <Download className="h-4 w-4 mr-2" />
                      {t('export')}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果区域 */}
      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords">
            {t('keywords')} ({filteredKeywords.length})
          </TabsTrigger>
          <TabsTrigger value="groups">
            {t('groups')} ({keywordGroups.length})
          </TabsTrigger>
          <TabsTrigger value="competitors">
            {t('competitors')} ({competitors.length})
          </TabsTrigger>
        </TabsList>

        {/* 关键词列表 */}
        <TabsContent value="keywords">
          <div className="space-y-4">
            {filteredKeywords.map((keyword, index) => (
              <motion.div
                key={keyword.keyword}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "cursor-pointer transition-colors",
                  selectedKeywords.includes(keyword.keyword) && "border-primary bg-primary/5"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeywordSelection(keyword.keyword)}
                        >
                          {selectedKeywords.includes(keyword.keyword) ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div>
                          <h4 className="font-medium">{keyword.keyword}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(keyword.volume)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {keyword.difficulty}/100
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${keyword.cpc.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {keyword.competition}/100
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTrendIcon(keyword.trend)}
                        <div className={cn("w-2 h-2 rounded-full", getIntentColor(keyword.intent))} />
                        <Badge variant="outline">{t(`intent.${keyword.intent}`)}</Badge>
                      </div>
                    </div>
                    
                    {/* 相关关键词 */}
                    {keyword.relatedKeywords.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">{t('relatedKeywords')}:</div>
                        <div className="flex flex-wrap gap-1">
                          {keyword.relatedKeywords.slice(0, 5).map((related) => (
                            <Badge key={related} variant="secondary" className="text-xs">
                              {related}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 问题建议 */}
                    {keyword.questions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">{t('questionSuggestions')}:</div>
                        <div className="space-y-1">
                          {keyword.questions.slice(0, 3).map((question, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              • {question}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {filteredKeywords.length === 0 && !isSearching && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('noKeywords')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('noKeywordsDescription')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 关键词组 */}
        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keywordGroups.map((group) => (
              <Card key={group.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <h4 className="font-medium">{group.name}</h4>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('keywords')}:</span>
                      <span className="font-medium">{group.keywords.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('totalVolume')}:</span>
                      <span className="font-medium">{formatNumber(group.totalVolume)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('avgDifficulty')}:</span>
                      <span className="font-medium">{group.avgDifficulty.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {group.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {group.keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{group.keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {keywordGroups.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('noGroups')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('noGroupsDescription')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 竞争对手分析 */}
        <TabsContent value="competitors">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('addCompetitor')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    id="competitor-domain-input"
                    aria-label="竞争对手域名"
                    placeholder="example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        analyzeCompetitors(target.value)
                        target.value = ''
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      analyzeCompetitors(input.value)
                      input.value = ''
                    }}
                  >
                    {t('analyze')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {competitors.map((competitor, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{competitor.domain}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{competitor.keywords} {t('keywords')}</span>
                      <span>{formatNumber(competitor.traffic)} {t('traffic')}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">{t('topKeywords')}:</div>
                    <div className="space-y-2">
                      {competitor.topKeywords.map((kw, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{kw.keyword}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{kw.position}</Badge>
                            <span className="text-muted-foreground">
                              {formatNumber(kw.volume)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {competitors.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('noCompetitors')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('noCompetitorsDescription')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
