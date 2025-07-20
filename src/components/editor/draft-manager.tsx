'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Clock, 
  Save, 
  Trash2, 
  Eye, 
  Edit,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { getCurrentTimestamp } from '@/lib/utils'

interface Draft {
  id: string
  title: string
  content: string
  excerpt?: string
  lastSaved: string
  autoSaved: boolean
  wordCount: number
  status: 'draft' | 'auto-saved' | 'manual-saved'
  tags: string[]
  category?: string
  isRecoverable?: boolean
  originalArticleId?: string
}

interface DraftManagerProps {
  currentDraft?: Draft
  onDraftLoad: (draft: Draft) => void
  onDraftSave: (draft: Partial<Draft>) => Promise<Draft>
  onDraftDelete: (draftId: string) => Promise<void>
  onDraftRestore: (draft: Draft) => void
  className?: string
}

export function DraftManager({
  currentDraft,
  onDraftLoad,
  onDraftSave,
  onDraftDelete,
  onDraftRestore,
  className
}: DraftManagerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '草稿管理',
      subtitle: '管理文章草稿和自动保存',
      loading: '加载中...',
      loadDraftsFailed: '加载草稿失败',
      draftSaved: '草稿已保存',
      saveDraftFailed: '保存草稿失败',
      draftDeleted: '草稿已删除',
      deleteDraftFailed: '删除草稿失败',
      draftsDeleted: '草稿已删除',
      deleteDraftsFailed: '删除草稿失败',
      draftRestored: '草稿已恢复',
      autoSave: '自动保存',
      manualSave: '手动保存',
      draft: '草稿',
      autoSaved: '自动保存',
      manualSaved: '手动保存',
      lastSaved: '最后保存',
      wordCount: '字数',
      draftTitle: '标题',
      content: '内容',
      excerpt: '摘要',
      tags: '标签',
      category: '分类',
      status: '状态',
      actions: '操作',
      load: '加载',
      save: '保存',
      delete: '删除',
      restore: '恢复',
      edit: '编辑',
      preview: '预览',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      refresh: '刷新',
      selectAll: '全选',
      batchDelete: '批量删除',
      confirmDelete: '确定要删除这个草稿吗？',
      confirmBatchDelete: '确定要删除选中的草稿吗？',
      noDrafts: '暂无草稿',
      noDraftsFound: '未找到草稿',
      autoSaveEnabled: '自动保存已启用',
      autoSaveDisabled: '自动保存已禁用',
      autoSaveInterval: '自动保存间隔',
      seconds: '秒',
      minutes: '分钟',
      drafts: '草稿',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'lastSaved' | 'title' | 'wordCount'>('lastSaved')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([])
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState(30000) // 30秒

  // 自动保存定时器
  useEffect(() => {
    if (!isAutoSaveEnabled || !currentDraft) return

    const timer = setInterval(() => {
      handleAutoSave()
    }, autoSaveInterval)

    return () => clearInterval(timer)
  }, [isAutoSaveEnabled, autoSaveInterval, currentDraft])

  // 加载草稿列表
  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/drafts')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDrafts(data.data.drafts || [])
        }
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
      showToast.error(t('loadDraftsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 自动保存
  const handleAutoSave = useCallback(async () => {
    if (!currentDraft) return

    try {
      const savedDraft = await onDraftSave({
        ...currentDraft,
        autoSaved: true,
        status: 'auto-saved',
        lastSaved: new Date(getCurrentTimestamp()).toISOString()
      })
      
      // 更新草稿列表
      setDrafts(prev => {
        const index = prev.findIndex(d => d.id === savedDraft.id)
        if (index >= 0) {
          const newDrafts = [...prev]
          newDrafts[index] = savedDraft
          return newDrafts
        } else {
          return [savedDraft, ...prev]
        }
      })
    } catch (error) {
      console.error('Auto save failed:', error)
    }
  }, [currentDraft, onDraftSave])

  // 手动保存
  const handleManualSave = async () => {
    if (!currentDraft) return

    try {
      const savedDraft = await onDraftSave({
        ...currentDraft,
        autoSaved: false,
        status: 'manual-saved',
        lastSaved: new Date(getCurrentTimestamp()).toISOString()
      })
      
      setDrafts(prev => {
        const index = prev.findIndex(d => d.id === savedDraft.id)
        if (index >= 0) {
          const newDrafts = [...prev]
          newDrafts[index] = savedDraft
          return newDrafts
        } else {
          return [savedDraft, ...prev]
        }
      })
      
      showToast.success(t('draftSaved'))
    } catch (error) {
      console.error('Manual save failed:', error)
      showToast.error(t('saveDraftFailed'))
    }
  }

  // 删除草稿
  const handleDeleteDraft = async (draftId: string) => {
    try {
      await onDraftDelete(draftId)
      setDrafts(prev => prev.filter(d => d.id !== draftId))
      setSelectedDrafts(prev => prev.filter(id => id !== draftId))
      showToast.success(t('draftDeleted'))
    } catch (error) {
      console.error('Failed to delete draft:', error)
      showToast.error(t('deleteDraftFailed'))
    }
  }

  // 批量删除草稿
  const handleBatchDelete = async () => {
    try {
      await Promise.all(selectedDrafts.map(id => onDraftDelete(id)))
      setDrafts(prev => prev.filter(d => !selectedDrafts.includes(d.id)))
      setSelectedDrafts([])
      showToast.success(t('draftsDeleted'))
    } catch (error) {
      console.error('Failed to delete drafts:', error)
      showToast.error(t('deleteDraftsFailed'))
    }
  }

  // 恢复草稿
  const handleRestoreDraft = (draft: Draft) => {
    onDraftRestore(draft)
    showToast.success(t('draftRestored'))
  }

  // 过滤和排序草稿
  const filteredAndSortedDrafts = drafts
    .filter(draft => {
      if (searchQuery && !draft.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !draft.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterStatus !== 'all' && draft.status !== filterStatus) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'lastSaved':
          comparison = new Date(a.lastSaved).getTime() - new Date(b.lastSaved).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'wordCount':
          comparison = a.wordCount - b.wordCount
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date(getCurrentTimestamp())
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo')
    if (hours < 24) return t('hoursAgo')
    if (days < 7) return t('daysAgo')
    return date.toLocaleDateString()
  }

  // 获取状态图标
  const getStatusIcon = (status: string, autoSaved: boolean) => {
    if (status === 'auto-saved' || autoSaved) {
      return <RefreshCw className="h-4 w-4 text-blue-500" />
    }
    if (status === 'manual-saved') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('title')}</h3>
          <Badge variant="secondary">{drafts.length} {t('drafts')}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedDrafts.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('batchDelete')} ({selectedDrafts.length})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={!currentDraft}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('save')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadDrafts}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 自动保存设置 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <Label>{t('autoSave')}</Label>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t('autoSaveInterval')}:</Label>
                <Select
                  value={autoSaveInterval.toString()}
                  onValueChange={(value) => setAutoSaveInterval(parseInt(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15000">15{t('seconds')}</SelectItem>
                    <SelectItem value="30000">30{t('seconds')}</SelectItem>
                    <SelectItem value="60000">1{t('minutes')}</SelectItem>
                    <SelectItem value="300000">5{t('minutes')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant={isAutoSaveEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
              >
                {isAutoSaveEnabled ? t('autoSaveEnabled') : t('autoSaveDisabled')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索和过滤 */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
            <SelectItem value="auto-saved">{t('autoSaved')}</SelectItem>
            <SelectItem value="manual-saved">{t('manualSaved')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastSaved">{t('lastSaved')}</SelectItem>
            <SelectItem value="title">{t('title')}</SelectItem>
            <SelectItem value="wordCount">{t('wordCount')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
      </div>

      {/* 草稿列表 */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredAndSortedDrafts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('noDrafts')}</p>
                <p className="text-sm text-muted-foreground">{t('noDraftsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedDrafts.map((draft) => (
              <Card
                key={draft.id}
                className={cn(
                  "transition-colors cursor-pointer hover:bg-accent/50",
                  selectedDrafts.includes(draft.id) && "ring-2 ring-primary",
                  currentDraft?.id === draft.id && "bg-accent"
                )}
                onClick={() => {
                  if (selectedDrafts.includes(draft.id)) {
                    setSelectedDrafts(prev => prev.filter(id => id !== draft.id))
                  } else {
                    setSelectedDrafts(prev => [...prev, draft.id])
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">
                          {draft.title || t('untitled')}
                        </h4>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(draft.status, draft.autoSaved)}
                          <Badge variant={
                            draft.status === 'manual-saved' ? 'default' :
                            draft.status === 'auto-saved' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {t(draft.status)}
                          </Badge>
                          {draft.isRecoverable && (
                            <Badge variant="destructive" className="text-xs">
                              {t('recoverable')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(draft.lastSaved)}
                        </div>
                        <div>
                          {draft.wordCount} {t('wordCount')}
                        </div>
                        {draft.category && (
                          <Badge variant="outline" className="text-xs">
                            {draft.category}
                          </Badge>
                        )}
                      </div>
                      
                      {draft.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {draft.excerpt}
                        </p>
                      )}
                      
                      {draft.tags.length > 0 && (
                        <div className="flex gap-1">
                          {draft.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {draft.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{draft.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDraftLoad(draft)
                        }}
                        title={t('load')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {draft.isRecoverable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestoreDraft(draft)
                          }}
                          title={t('restore')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            title={t('preview')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{draft.title || t('untitled')}</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>
                            请根据需要填写或操作。
                          </DialogDescription>
                          <ScrollArea className="h-96">
                            <div className="p-4 whitespace-pre-wrap">
                              {draft.content}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDraft(draft.id)
                        }}
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
