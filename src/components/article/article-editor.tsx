"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Eye, Send, ArrowLeft, Sparkles, Tag as TagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { SEOAnalyzer } from "./seo-analyzer"
import { AIAssistant } from "./ai-assistant"
import { DataService } from "@/lib/data-service"
import type { Category, Tag, User, Article } from "@/types"
import { generateSlug } from "@/lib/utils"
import { articlesAPI } from "@/lib/api/articles"
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command"
import { ChevronDownIcon } from "lucide-react"

interface ArticleEditorProps {
  user: User
  articleId?: string
  initialData?: Partial<Article>
  onSave?: (data: Partial<Article>) => Promise<{ success: boolean; error?: string }>
}

interface ArticleForm {
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  coverImage: string
  status: 'draft' | 'published' | 'archived' | 'scheduled' | 'auto-saved' | 'manual-saved'
}

function TagMultiSelect({ tags, value, onChange }: { tags: Tag[]; value: string[]; onChange: (tags: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const filtered = tags.filter(
    (t: Tag) => !value.includes(t.name) && (!input || t.name.includes(input))
  )
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag: string) => (
          <Badge
            key={tag}
            variant="default"
            className="cursor-pointer"
            onClick={() => onChange(value.filter((t: string) => t !== tag))}
          >
            {tag} ×
          </Badge>
        ))}
      </div>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        选择或输入标签
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </Button>
      {open && (
        <div className="relative z-50">
          <Command>
            <CommandInput
              placeholder="搜索标签或输入新标签"
              value={input}
              onValueChange={setInput}
            />
            <CommandList>
              {filtered.map((tag: Tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => {
                    onChange([...value, tag.name])
                    setInput("")
                  }}
                >
                  {tag.name}
                </CommandItem>
              ))}
              {input && !tags.some((t: Tag) => t.name === input) && (
                <CommandItem
                  onSelect={() => {
                    onChange([...value, input])
                    setInput("")
                  }}
                >
                  新建标签“{input}”
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}

function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (category: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const filtered = categories.filter(
    (c: Category) => !input || c.name.includes(input)
  );
  return (
    <div>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {value || "选择或输入分类"}
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </Button>
      {open && (
        <div className="relative z-50">
          <Command>
            <CommandInput
              placeholder="搜索分类或输入新分类"
              value={input}
              onValueChange={setInput}
            />
            <CommandList>
              {filtered.map((cat: Category) => (
                <CommandItem
                  key={cat.id}
                  onSelect={() => {
                    onChange(cat.name);
                    setOpen(false);
                    setInput("");
                  }}
                >
                  {cat.name}
                </CommandItem>
              ))}
              {input && !categories.some((c: Category) => c.name === input) && (
                <CommandItem
                  onSelect={() => {
                    onChange(input);
                    setOpen(false);
                    setInput("");
                  }}
                >
                  新建分类“{input}”
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

export function ArticleEditor({ user, articleId, initialData, onSave }: ArticleEditorProps) {
  const router = useRouter()
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isRecommendingTags, setIsRecommendingTags] = useState(false)
  
  const [form, setForm] = useState<ArticleForm>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    category: initialData?.category || "",
    tags: initialData?.tags || [],
    coverImage: initialData?.coverImage || "",
    status: initialData?.status || "draft",
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState("")

  // 自动生成 slug（仅在创建新文章时）
  useEffect(() => {
    if (form.title && !articleId && !initialData) {
      setForm(prev => ({
        ...prev,
        slug: generateSlug(form.title)
      }))
    }
  }, [form.title, articleId, initialData])

  // 自动保存草稿（仅在创建新文章时）
  useEffect(() => {
    if (articleId || initialData) return // 编辑模式不自动保存
    
    const timer = setTimeout(() => {
      if (form.title || form.content) {
        handleSaveDraft()
      }
    }, 30000) // 30秒自动保存

    return () => clearTimeout(timer)
  }, [form, articleId, initialData])

  useEffect(() => {
    const fetchData = async () => {
      const dataService = DataService.getInstance()
      // 分类
      const catRes = await dataService.getCategories()
      setCategories(catRes || [])
      console.log('获取到的分类:', catRes)
      // 标签
      const tagRes = await dataService.getTags()
      setTags(tagRes || [])
      console.log('获取到的标签:', tagRes)
    }
    fetchData()
  }, [])

  // 分类相关调试
  console.log('当前分类 state:', categories)
  console.log('当前选中分类:', form.category)

  // 标签相关调试
  console.log('当前标签 state:', tags)
  console.log('当前已选标签:', form.tags)
  console.log('当前标签输入:', tagInput)

  const handleInputChange = (field: keyof ArticleForm, value: string | string[]) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagToggle = (tag: string) => {
    setForm(prev => {
      const next = prev.tags.includes(tag)
        ? { ...prev, tags: prev.tags.filter(t => t !== tag) }
        : { ...prev, tags: [...prev.tags, tag] }
      console.log('切换标签:', tag, '结果:', next.tags)
      return next
    })
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const articleData = {
        ...form,
        status: 'draft' as const,
        cover_image: form.coverImage
      }
      
      if (onSave) {
        // 编辑模式：使用传入的保存回调
        const result = await onSave(articleData)
        if (!result.success) {
          throw new Error(result.error || '保存失败')
        }
      } else {
        // 创建模式：使用原有的创建逻辑
        const result = await articlesAPI.createArticle(articleData)
        if (result.success) {
          if (result.data?.id) {
            router.push(`/dashboard/articles/edit/${result.data.id}`)
          }
        } else {
          throw new Error(result.error || '保存失败')
        }
      }
    } catch (error) {
      console.error("保存失败:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsSaving(true)
    try {
      const articleData = {
        ...form,
        status: 'published' as const,
        cover_image: form.coverImage
      }
      
      if (onSave) {
        // 编辑模式：使用传入的保存回调
        const result = await onSave(articleData)
        if (result.success) {
          router.push("/dashboard/articles")
        } else {
          throw new Error(result.error || '发布失败')
        }
      } else {
        // 创建模式：使用原有的创建逻辑
        const result = await articlesAPI.createArticle(articleData)
        if (result.success) {
          router.push("/dashboard/articles")
        } else {
          throw new Error(result.error || '发布失败')
        }
      }
    } catch (error) {
      console.error("发布失败:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateAISummary = async () => {
    if (!form.content) return

    setIsGeneratingAI(true)
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

      // 请求真实后端
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
      const response = await fetch(`${apiBase}/api/ai/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content: form.content,
          options: {
            maxLength: 150,
            language: "zh",
            style: "formal",
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setForm(prev => ({
          ...prev,
          excerpt: data.data?.data || ""
        }))
      } else {
        console.error("AI 生成失败:", data.error)
      }
    } catch (error) {
      console.error("AI 生成失败:", error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // 处理 AI 摘要生成
  const handleAISummaryGenerated = (summary: string) => {
    setForm(prev => ({
      ...prev,
      excerpt: summary
    }))
  }

  // 处理 AI 标签推荐
  const handleAITagsRecommended = (tags: string[]) => {
    setForm(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, ...tags])]
    }))
  }

  // 标签推荐按钮逻辑
  const handleRecommendTags = async () => {
    if (!form.title || !form.content) return
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
          title: form.title,
          content: form.content
        }),
      })
      const data = await response.json()
      if (data.success) {
        const aiTags = Array.isArray(data.data?.data) ? data.data.data : []
        setForm(prev => ({
          ...prev,
          tags: [...new Set([...prev.tags, ...aiTags])]
        }))
      } else {
        console.error("AI 标签推荐失败:", data.error)
      }
    } catch (error) {
      console.error("AI 标签推荐失败:", error)
    } finally {
      setIsRecommendingTags(false)
    }
  }

  // 标签输入和选择
  const filteredTagOptions = tags.filter(
    t => !form.tags.includes(t.name) && (!tagInput || t.name.includes(tagInput))
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 编辑器主体 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 工具栏 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? "编辑" : "预览"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "保存中..." : (onSave ? "保存更改" : "保存草稿")}
            </Button>
            <Button onClick={handlePublish} disabled={isSaving}>
              <Send className="w-4 h-4 mr-2" />
              {onSave ? "更新文章" : "发布文章"}
            </Button>
          </div>
        </div>

        {/* 文章标题 */}
        <Card>
          <CardHeader>
            <CardTitle>文章信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="输入文章标题..."
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL 别名</Label>
              <Input
                id="slug"
                placeholder="article-slug"
                value={form.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="excerpt">文章摘要</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingAI || !form.content}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isGeneratingAI ? "生成中..." : "AI 生成"}
                </Button>
              </div>
              <Textarea
                id="excerpt"
                placeholder="输入文章摘要..."
                rows={3}
                value={form.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 内容编辑器 */}
        <Card>
          <CardHeader>
            <CardTitle>文章内容</CardTitle>
            <CardDescription>
              使用 Markdown 语法编写文章内容
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPreview ? (
              <div className="min-h-[400px] border rounded-lg p-4">
                <MarkdownRenderer content={form.content} />
              </div>
            ) : (
              <Textarea
                placeholder="开始编写您的文章内容..."
                className="min-h-[400px] font-mono"
                value={form.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 侧边栏设置 */}
      <div className="space-y-6">
        {/* 发布设置 */}
        <Card>
          <CardHeader>
            <CardTitle>发布设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <CategorySelect
                categories={categories}
                value={form.category}
                onChange={category => setForm(prev => ({ ...prev, category }))}
              />
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <TagMultiSelect
                    tags={tags}
                    value={form.tags}
                    onChange={tags => setForm(prev => ({ ...prev, tags }))}
                  />
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRecommendTags}
                  disabled={isRecommendingTags || !form.title || !form.content}
                  className="flex items-center gap-2 h-9 px-4 flex-shrink-0 mt-2"
                >
                  <TagIcon className="w-4 h-4 mr-1" />
                  {isRecommendingTags ? "推荐中..." : "推荐标签"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="coverImage">封面图片 URL</Label>
              <Input
                id="coverImage"
                placeholder="https://example.com/image.jpg"
                value={form.coverImage}
                onChange={(e) => handleInputChange("coverImage", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO 分析 */}
        <SEOAnalyzer article={form} />

        {/* AI 助手 */}
        <AIAssistant
          title={form.title}
          content={form.content}
          onSummaryGenerated={handleAISummaryGenerated}
          onTagsRecommended={handleAITagsRecommended}
        />
        {/* 文章统计 */}
        <Card>
          <CardHeader>
            <CardTitle>文章统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>字符数:</span>
              <span>{form.content.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>预计阅读时间:</span>
              <span>{Math.ceil(form.content.length / 500)} 分钟</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>状态:</span>
              <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                {form.status === 'published' ? '已发布' : '草稿'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
