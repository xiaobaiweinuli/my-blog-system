'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Save, 
  Eye, 
  Settings,
  History,
  Calendar,
  Shield,
  Upload,
  Loader2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

// 导入编辑器组件
import { MarkdownEditor } from './markdown-editor'
import { ImageUpload } from './image-upload'
import { VersionControl } from './version-control'
import { DraftManager } from './draft-manager'
import { PublishScheduler } from './publish-scheduler'
import { ContentWorkflow } from './content-workflow'

interface Article {
  id?: string
  title: string
  content: string
  excerpt?: string
  category?: string
  tags: string[]
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
  author?: {
    id: string
    name: string
    avatar?: string
  }
}

interface ArticleEditorProps {
  article?: Article
  onSave: (article: Partial<Article>) => Promise<Article>
  onPublish: (article: Partial<Article>) => Promise<Article>
  onSchedule: (article: Partial<Article>, scheduledAt: string) => Promise<Article>
  onSubmitForReview?: (article: Partial<Article>) => Promise<void>
  currentUser: {
    id: string
    name: string
    role: 'author' | 'editor' | 'admin'
  }
  className?: string
}

export function ArticleEditor({
  article,
  onSave,
  onPublish,
  onSchedule,
  onSubmitForReview,
  currentUser,
  className
}: ArticleEditorProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '文章编辑器',
      subtitle: '创建和编辑文章',
      articleSaved: '文章已保存',
      saveArticleFailed: '保存文章失败',
      articlePublished: '文章已发布',
      publishArticleFailed: '发布文章失败',
      submittedForReview: '已提交审核',
      submitForReviewFailed: '提交审核失败',
      save: '保存',
      publish: '发布',
      schedule: '定时发布',
      preview: '预览',
      settings: '设置',
      history: '历史版本',
      draft: '草稿',
      published: '已发布',
      scheduled: '定时发布',
      archived: '已归档',
      articleTitle: '标题',
      content: '内容',
      excerpt: '摘要',
      category: '分类',
      tags: '标签',
      status: '状态',
      author: '作者',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      publishedAt: '发布时间',
      autoSave: '自动保存',
      lastSaved: '最后保存',
      unsavedChanges: '有未保存的更改',
      confirmPublish: '确定要发布这篇文章吗？',
      confirmSchedule: '确定要定时发布这篇文章吗？',
      loading: '加载中...',
      error: '操作失败',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  // 文章状态
  const [formData, setFormData] = useState<Partial<Article>>({
    title: article?.title || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    category: article?.category || '',
    tags: article?.tags || [],
    status: article?.status || 'draft'
  })
  
  // UI状态
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // 监听表单变化
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      title: article?.title || '',
      content: article?.content || '',
      excerpt: article?.excerpt || '',
      category: article?.category || '',
      tags: article?.tags || [],
      status: article?.status || 'draft'
    })
    setHasUnsavedChanges(hasChanges)
  }, [formData, article])

  // 自动保存
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 30000) // 30秒自动保存

    return () => clearTimeout(timer)
  }, [formData, hasUnsavedChanges])

  // 自动保存处理
  const handleAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return

    try {
      await onSave(formData)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto save failed:', error)
    }
  }, [formData, hasUnsavedChanges, onSave])

  // 手动保存
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const savedArticle = await onSave(formData)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      showToast.success(t('articleSaved'))
      
      // 更新文章ID（如果是新文章）
      if (!article?.id && savedArticle.id) {
        setFormData(prev => ({ ...prev, id: savedArticle.id }))
      }
    } catch (error) {
      console.error('Save failed:', error)
      showToast.error(t('saveArticleFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  // 发布文章
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await onPublish({ ...formData, status: 'published' })
      setFormData(prev => ({ ...prev, status: 'published' }))
      setHasUnsavedChanges(false)
      showToast.success(t('articlePublished'))
    } catch (error) {
      console.error('Publish failed:', error)
      showToast.error(t('publishArticleFailed'))
    } finally {
      setIsPublishing(false)
    }
  }

  // 提交审核
  const handleSubmitForReview = async () => {
    if (!onSubmitForReview) return

    try {
      await onSubmitForReview(formData)
      showToast.success(t('submittedForReview'))
    } catch (error) {
      console.error('Submit for review failed:', error)
      showToast.error(t('submitForReviewFailed'))
    }
  }

  // 插入图片
  const handleImageInsert = (markdown: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n' + markdown
    }))
  }

  // 更新表单字段
  const updateField = (field: keyof Article, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 添加标签
  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }))
    }
  }

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  return (
    <div className={cn("h-screen flex flex-col", className)}>
      {/* 顶部工具栏 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h1 className="text-lg font-semibold">
                {article?.id ? t('editArticle') : t('newArticle')}
              </h1>
              {hasUnsavedChanges && (
                <Badge variant="secondary">{t('unsavedChanges')}</Badge>
              )}
              {formData.status && (
                <Badge variant={
                  formData.status === 'published' ? 'default' :
                  formData.status === 'scheduled' ? 'secondary' : 'outline'
                }>
                  {t(formData.status)}
                </Badge>
              )}
            </div>
            
            {lastSaved && (
              <span className="text-sm text-muted-foreground">
                {t('lastSaved')}: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 预览切换 */}
            <Button
              variant={isPreviewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? t('exitPreview') : t('preview')}
            </Button>

            {/* 保存按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('save')}
            </Button>

            {/* 发布按钮 */}
            {currentUser.role !== 'author' && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                size="sm"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {t('publish')}
              </Button>
            )}

            {/* 提交审核按钮 */}
            {currentUser.role === 'author' && onSubmitForReview && (
              <Button
                onClick={handleSubmitForReview}
                size="sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                {t('submitForReview')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧编辑器 */}
        <div className="flex-1 flex flex-col">
          {!isPreviewMode && (
            <>
              {/* 文章元信息 */}
              <div className="border-b p-4 space-y-4">
                <div>
                  <label htmlFor="article-title-input" className="sr-only">文章标题</label>
                  <Input
                    id="article-title-input"
                    aria-label={t('articleTitlePlaceholder')}
                    placeholder={t('articleTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select
                      value={formData.category}
                      onValueChange={(value) => updateField('category', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">{t('technology')}</SelectItem>
                        <SelectItem value="design">{t('design')}</SelectItem>
                        <SelectItem value="business">{t('business')}</SelectItem>
                        <SelectItem value="lifestyle">{t('lifestyle')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {formData.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}
                    <Input
                      id="article-tag-input"
                      aria-label={t('addTag')}
                      placeholder={t('addTag')}
                      className="w-32"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const target = e.target as HTMLInputElement
                          addTag(target.value.trim())
                          target.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Markdown编辑器 */}
              <div className="flex-1">
                <MarkdownEditor
                  value={formData.content || ''}
                  onChange={(content) => updateField('content', content)}
                  onSave={handleSave}
                  placeholder={t('contentPlaceholder')}
                  autoSave={true}
                />
              </div>
            </>
          )}

          {/* 预览模式 */}
          {isPreviewMode && (
            <div className="flex-1 p-8 overflow-auto">
              <article className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
                <h1>{formData.title || t('untitled')}</h1>
                <div className="not-prose mb-8">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {formData.category && (
                      <Badge variant="outline">{formData.category}</Badge>
                    )}
                    {formData.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">#{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ 
                  __html: formData.content || t('noContent')
                }} />
              </article>
            </div>
          )}
        </div>

        {/* 右侧面板 */}
        <div className="w-80 border-l bg-muted/30">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-2">
              <TabsTrigger value="editor" className="text-xs">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="versions" className="text-xs">
                <History className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs">
                <Calendar className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="workflow" className="text-xs">
                <Shield className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="editor" className="h-full m-0 p-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">{t('tools')}</h3>
                  <div className="space-y-2">
                    <ImageUpload onChange={handleImageInsert} />
                    <DraftManager
                      currentDraft={formData as any}
                      onDraftLoad={(draft) => setFormData(draft as Partial<Article>)}
                      onDraftSave={async (draft) => {
                        const saved = await onSave(draft as Partial<Article>)
                        return saved as any
                      }}
                      onDraftDelete={async (id) => {
                        // 实现删除草稿逻辑
                      }}
                      onDraftRestore={(draft) => setFormData(draft as Partial<Article>)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="versions" className="h-full m-0 p-4">
                {article?.id && (
                  <VersionControl
                    articleId={article.id}
                    currentContent={formData.content || ''}
                    onVersionRestore={(version) => {
                      setFormData(prev => ({
                        ...prev,
                        title: version.title,
                        content: version.content
                      }))
                    }}
                    onVersionCompare={(v1, v2) => {
                      // 实现版本比较逻辑
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="schedule" className="h-full m-0 p-4">
                <PublishScheduler
                  articleId={article?.id}
                  initialData={formData as any}
                  onSchedule={async (data) => {
                    const scheduled = await onSchedule(formData, data.scheduledAt!)
                    return scheduled as any
                  }}
                  onUpdate={async (id, data) => {
                    // 实现更新调度逻辑
                    return {} as any
                  }}
                  onCancel={async (id) => {
                    // 实现取消调度逻辑
                  }}
                  onPublishNow={async (id) => {
                    await handlePublish()
                  }}
                />
              </TabsContent>

              <TabsContent value="workflow" className="h-full m-0 p-4">
                <ContentWorkflow
                  articleId={article?.id}
                  currentUser={currentUser}
                  onSubmitForReview={async (articleId) => {
                    if (onSubmitForReview) {
                      await onSubmitForReview(formData)
                    }
                    return {} as any
                  }}
                  onApprove={async (itemId, comment) => {
                    // 实现批准逻辑
                  }}
                  onReject={async (itemId, comment) => {
                    // 实现拒绝逻辑
                  }}
                  onAssign={async (itemId, userId) => {
                    // 实现分配逻辑
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
