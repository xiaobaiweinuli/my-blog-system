'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  GitBranch, 
  GitCommit, 
  GitMerge,
  Clock, 
  User, 
  Eye, 
  RotateCcw,
  GitCompare as Compare,
  Save,
  Tag,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Diff
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ArticleVersion {
  id: string
  version: number
  title: string
  content: string
  summary?: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  wordCount: number
  changeType: 'create' | 'update' | 'publish' | 'archive'
  parentVersion?: string
  isAutoSave?: boolean
}

interface VersionDiff {
  type: 'added' | 'removed' | 'modified'
  line: number
  content: string
  oldContent?: string
}

interface VersionControlProps {
  articleId: string
  currentContent: string
  onVersionRestore: (version: ArticleVersion) => void
  onVersionCompare: (version1: ArticleVersion, version2: ArticleVersion) => void
  className?: string
}

export function VersionControl({
  articleId,
  currentContent,
  onVersionRestore,
  onVersionCompare,
  className
}: VersionControlProps) {
  // 中文静态文本
  const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
      versionControl: '版本管理',
      versionHistory: '版本历史',
      versions: '个版本',
      compare: '比较',
      createVersion: '新建版本',
      createNewVersion: '新建新版本',
      versionCreated: '版本已创建',
      createVersionFailed: '创建版本失败',
      versionRestored: '已恢复到该版本',
      restoreVersionFailed: '恢复失败',
      compareVersions: '版本对比',
      compareVersionsFailed: '对比失败',
      loadVersionsFailed: '加载版本失败',
      noVersions: '暂无版本',
      noVersionsDescription: '还没有历史版本',
      status: '状态',
      all: '全部',
      draft: '草稿',
      published: '已发布',
      archived: '已归档',
      allAuthors: '全部作者',
      author: '作者',
      title: '标题',
      contentPreview: '内容预览',
      words: '字数',
      justNow: '刚刚',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      autoSave: '自动保存',
      restore: '恢复',
      preview: '预览',
      contentDifferences: '内容差异',
      noChanges: '无变化',
      optional: '可选',
      versionSummary: '版本说明',
      versionSummaryPlaceholder: '请输入版本说明（可选）',
    }
    if (key === 'minutesAgo' && params?.count) return `${params.count} 分钟前`
    if (key === 'hoursAgo' && params?.count) return `${params.count} 小时前`
    if (key === 'daysAgo' && params?.count) return `${params.count} 天前`
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false)
  const [compareVersions, setCompareVersions] = useState<[ArticleVersion, ArticleVersion] | null>(null)
  const [versionDiff, setVersionDiff] = useState<VersionDiff[]>([])
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAuthor, setFilterAuthor] = useState<string>('all')

  // 加载版本历史
  useEffect(() => {
    loadVersionHistory()
  }, [articleId])

  const loadVersionHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/versions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVersions(data.data.versions || [])
        }
      }
    } catch (error) {
      console.error('Failed to load version history:', error)
      showToast.error(t('loadVersionsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 创建新版本
  const createVersion = async (summary?: string, isAutoSave = false) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentContent,
          summary,
          isAutoSave,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await loadVersionHistory()
          showToast.success(t('versionCreated'))
          return data.data.version
        }
      }
      throw new Error('Failed to create version')
    } catch (error) {
      console.error('Failed to create version:', error)
      showToast.error(t('createVersionFailed'))
      return null
    }
  }

  // 恢复版本
  const restoreVersion = async (version: ArticleVersion) => {
    try {
      onVersionRestore(version)
      showToast.success(t('versionRestored'))
    } catch (error) {
      console.error('Failed to restore version:', error)
      showToast.error(t('restoreVersionFailed'))
    }
  }

  // 比较版本
  const compareVersionsHandler = async (version1: ArticleVersion, version2: ArticleVersion) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/versions/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version1Id: version1.id,
          version2Id: version2.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVersionDiff(data.data.diff || [])
          setCompareVersions([version1, version2])
          setIsCompareDialogOpen(true)
          onVersionCompare(version1, version2)
        }
      }
    } catch (error) {
      console.error('Failed to compare versions:', error)
      showToast.error(t('compareVersionsFailed'))
    }
  }

  // 切换版本展开状态
  const toggleVersionExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId)
    } else {
      newExpanded.add(versionId)
    }
    setExpandedVersions(newExpanded)
  }

  // 处理版本选择
  const handleVersionSelect = (versionId: string) => {
    const newSelected = [...selectedVersions]
    const index = newSelected.indexOf(versionId)
    
    if (index > -1) {
      newSelected.splice(index, 1)
    } else if (newSelected.length < 2) {
      newSelected.push(versionId)
    } else {
      newSelected[1] = versionId
    }
    
    setSelectedVersions(newSelected)
  }

  // 过滤版本
  const filteredVersions = versions.filter(version => {
    if (filterStatus !== 'all' && version.status !== filterStatus) {
      return false
    }
    if (filterAuthor !== 'all' && version.author.id !== filterAuthor) {
      return false
    }
    return true
  })

  // 获取唯一作者列表
  const uniqueAuthors = Array.from(
    new Set(versions.map(v => v.author.id))
  ).map(id => versions.find(v => v.author.id === id)?.author).filter(Boolean)

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo', { count: minutes })
    if (hours < 24) return t('hoursAgo', { count: hours })
    if (days < 7) return t('daysAgo', { count: days })
    return date.toLocaleDateString()
  }

  // 获取变更类型图标
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return <GitCommit className="h-4 w-4 text-green-500" />
      case 'update':
        return <GitBranch className="h-4 w-4 text-blue-500" />
      case 'publish':
        return <GitMerge className="h-4 w-4 text-purple-500" />
      case 'archive':
        return <History className="h-4 w-4 text-gray-500" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('versionHistory')}</h3>
          <Badge variant="secondary">{versions.length} {t('versions')}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedVersions.length === 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const version1 = versions.find(v => v.id === selectedVersions[0])
                const version2 = versions.find(v => v.id === selectedVersions[1])
                if (version1 && version2) {
                  compareVersionsHandler(version1, version2)
                }
              }}
            >
              <Compare className="h-4 w-4 mr-2" />
              {t('compare')}
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                {t('createVersion')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewVersion')}</DialogTitle>
              </DialogHeader>
              <CreateVersionForm onSubmit={createVersion} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">{t('status')}:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="draft">{t('draft')}</SelectItem>
              <SelectItem value="published">{t('published')}</SelectItem>
              <SelectItem value="archived">{t('archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-sm">{t('author')}:</Label>
          <Select value={filterAuthor} onValueChange={setFilterAuthor}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allAuthors')}</SelectItem>
              {uniqueAuthors.map((author) => (
                <SelectItem key={author?.id} value={author?.id || ''}>
                  {author?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 版本列表 */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredVersions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('noVersions')}</p>
                <p className="text-sm text-muted-foreground">{t('noVersionsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredVersions.map((version, index) => (
              <Card
                key={version.id}
                className={cn(
                  "transition-colors cursor-pointer",
                  selectedVersions.includes(version.id) && "ring-2 ring-primary"
                )}
                onClick={() => handleVersionSelect(version.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* 版本图标和信息 */}
                      <div className="flex flex-col items-center">
                        {getChangeTypeIcon(version.changeType)}
                        {index < filteredVersions.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {t('version')} {version.version}
                          </h4>
                          <Badge variant={
                            version.status === 'published' ? 'default' :
                            version.status === 'draft' ? 'secondary' : 'outline'
                          }>
                            {t(version.status)}
                          </Badge>
                          {version.isAutoSave && (
                            <Badge variant="outline" className="text-xs">
                              {t('autoSave')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.author.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(version.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {version.wordCount} {t('words')}
                          </div>
                        </div>
                        
                        {version.summary && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {version.summary}
                          </p>
                        )}
                        
                        {version.tags.length > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <div className="flex gap-1">
                              {version.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {version.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{version.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVersionExpanded(version.id)
                        }}
                      >
                        {expandedVersions.has(version.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          restoreVersion(version)
                        }}
                        title={t('restore')}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // 预览版本内容
                        }}
                        title={t('preview')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 展开的版本详情 */}
                  <AnimatePresence>
                    {expandedVersions.has(version.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs font-medium">{t('title')}</Label>
                            <p className="text-sm">{version.title}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium">{t('contentPreview')}</Label>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {version.content.substring(0, 200)}...
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* 版本比较对话框 */}
      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('compareVersions')}</DialogTitle>
          </DialogHeader>
          {compareVersions && (
            <VersionCompareView
              version1={compareVersions[0]}
              version2={compareVersions[1]}
              diff={versionDiff}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 创建版本表单组件
function CreateVersionForm({ onSubmit }: { onSubmit: (summary?: string) => void }) {
  // 中文静态文本
  const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
      versionControl: '版本管理',
      versionHistory: '版本历史',
      versions: '个版本',
      compare: '比较',
      createVersion: '新建版本',
      createNewVersion: '新建新版本',
      versionCreated: '版本已创建',
      createVersionFailed: '创建版本失败',
      versionRestored: '已恢复到该版本',
      restoreVersionFailed: '恢复失败',
      compareVersions: '版本对比',
      compareVersionsFailed: '对比失败',
      loadVersionsFailed: '加载版本失败',
      noVersions: '暂无版本',
      noVersionsDescription: '还没有历史版本',
      status: '状态',
      all: '全部',
      draft: '草稿',
      published: '已发布',
      archived: '已归档',
      allAuthors: '全部作者',
      author: '作者',
      title: '标题',
      contentPreview: '内容预览',
      words: '字数',
      justNow: '刚刚',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      autoSave: '自动保存',
      restore: '恢复',
      preview: '预览',
      contentDifferences: '内容差异',
      noChanges: '无变化',
      optional: '可选',
      versionSummary: '版本说明',
      versionSummaryPlaceholder: '请输入版本说明（可选）',
    }
    if (key === 'minutesAgo' && params?.count) return `${params.count} 分钟前`
    if (key === 'hoursAgo' && params?.count) return `${params.count} 小时前`
    if (key === 'daysAgo' && params?.count) return `${params.count} 天前`
    return translations[key] || key
  }
  const [summary, setSummary] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(summary || undefined)
    setSummary('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="summary">{t('versionSummary')} ({t('optional')})</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t('versionSummaryPlaceholder')}
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {t('createVersion')}
        </Button>
      </div>
    </form>
  )
}

// 版本比较视图组件
function VersionCompareView({
  version1,
  version2,
  diff
}: {
  version1: ArticleVersion
  version2: ArticleVersion
  diff: VersionDiff[]
}) {
  // 中文静态文本
  const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
      versionControl: '版本管理',
      versionHistory: '版本历史',
      versions: '个版本',
      compare: '比较',
      createVersion: '新建版本',
      createNewVersion: '新建新版本',
      versionCreated: '版本已创建',
      createVersionFailed: '创建版本失败',
      versionRestored: '已恢复到该版本',
      restoreVersionFailed: '恢复失败',
      compareVersions: '版本对比',
      compareVersionsFailed: '对比失败',
      loadVersionsFailed: '加载版本失败',
      noVersions: '暂无版本',
      noVersionsDescription: '还没有历史版本',
      status: '状态',
      all: '全部',
      draft: '草稿',
      published: '已发布',
      archived: '已归档',
      allAuthors: '全部作者',
      author: '作者',
      title: '标题',
      contentPreview: '内容预览',
      words: '字数',
      justNow: '刚刚',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      autoSave: '自动保存',
      restore: '恢复',
      preview: '预览',
      contentDifferences: '内容差异',
      noChanges: '无变化',
      optional: '可选',
      versionSummary: '版本说明',
      versionSummaryPlaceholder: '请输入版本说明（可选）',
    }
    if (key === 'minutesAgo' && params?.count) return `${params.count} 分钟前`
    if (key === 'hoursAgo' && params?.count) return `${params.count} 小时前`
    if (key === 'daysAgo' && params?.count) return `${params.count} 天前`
    return translations[key] || key
  }

  return (
    <div className="space-y-4">
      {/* 版本信息对比 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {t('version')} {version1.version}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>{t('author')}:</strong> {version1.author.name}</p>
            <p><strong>{t('date')}:</strong> {new Date(version1.createdAt).toLocaleString()}</p>
            <p><strong>{t('words')}:</strong> {version1.wordCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {t('version')} {version2.version}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>{t('author')}:</strong> {version2.author.name}</p>
            <p><strong>{t('date')}:</strong> {new Date(version2.createdAt).toLocaleString()}</p>
            <p><strong>{t('words')}:</strong> {version2.wordCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* 差异对比 */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Diff className="h-4 w-4" />
          {t('contentDifferences')}
        </h4>
        <ScrollArea className="h-96 border rounded-lg">
          <div className="p-4 font-mono text-sm">
            {diff.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('noChanges')}
              </p>
            ) : (
              diff.map((change, index) => (
                <div
                  key={index}
                  className={cn(
                    "py-1 px-2 rounded",
                    change.type === 'added' && "bg-green-100 dark:bg-green-900/20",
                    change.type === 'removed' && "bg-red-100 dark:bg-red-900/20",
                    change.type === 'modified' && "bg-yellow-100 dark:bg-yellow-900/20"
                  )}
                >
                  <span className="text-muted-foreground mr-4">
                    {change.line}
                  </span>
                  <span className={cn(
                    change.type === 'added' && "text-green-700 dark:text-green-300",
                    change.type === 'removed' && "text-red-700 dark:text-red-300",
                    change.type === 'modified' && "text-yellow-700 dark:text-yellow-300"
                  )}>
                    {change.type === 'added' && '+ '}
                    {change.type === 'removed' && '- '}
                    {change.type === 'modified' && '~ '}
                    {change.content}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
