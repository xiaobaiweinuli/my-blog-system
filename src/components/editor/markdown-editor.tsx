'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Link,
  Image,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  EyeOff,
  Save,
  Upload,
  Undo,
  Redo,
  Search,
  Replace,
  Maximize,
  Minimize,
  Settings
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { getCurrentTimestamp } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  autoSave?: boolean
  autoSaveInterval?: number
  showToolbar?: boolean
  showPreview?: boolean
  showWordCount?: boolean
  showLineNumbers?: boolean
  theme?: 'light' | 'dark' | 'auto'
  height?: string
  maxHeight?: string
}

interface EditorSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  lineHeight: number
  tabSize: number
  wordWrap: boolean
  lineNumbers: boolean
  minimap: boolean
  autoComplete: boolean
  spellCheck: boolean
}

interface EditorHistory {
  content: string
  cursor: number
  timestamp: number
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder,
  className,
  readOnly = false,
  autoSave = false,
  autoSaveInterval = 30000,
  showToolbar = true,
  showPreview = true,
  showWordCount = true,
  showLineNumbers = false,
  theme = 'light',
  height = '400px',
  maxHeight = '600px'
}: MarkdownEditorProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      bold: '粗体',
      italic: '斜体',
      underline: '下划线',
      strikethrough: '删除线',
      link: '链接',
      image: '图片',
      code: '代码',
      list: '列表',
      orderedList: '有序列表',
      quote: '引用',
      heading1: '标题1',
      heading2: '标题2',
      heading3: '标题3',
      preview: '预览',
      edit: '编辑',
      save: '保存',
      saved: '已保存',
      saveError: '保存失败',
      wordCount: '字数',
      lineCount: '行数',
      characters: '字符',
      charactersNoSpaces: '字符（不含空格）',
      words: '单词',
      lines: '行',
      paragraphs: '段落',
      readingTime: '阅读时间',
      settings: '设置',
      search: '搜索',
      replace: '替换',
      undo: '撤销',
      redo: '重做',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      theme: '主题',
      fontSize: '字体大小',
      lineHeight: '行高',
      tabSize: '缩进大小',
      wordWrap: '自动换行',
      lineNumbers: '行号',
      minimap: '小地图',
      autoComplete: '自动完成',
      spellCheck: '拼写检查',
    }
    return translations[key] || key
  }
  
  const { showToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSplitView, setIsSplitView] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  // 编辑器设置
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'auto',
    fontSize: 14,
    lineHeight: 1.5,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    autoComplete: true,
    spellCheck: true,
  })

  // 历史记录管理
  const [history, setHistory] = useState<EditorHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

  // 统计信息
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
    readingTime: 0
  })

  // 计算统计信息
  useEffect(() => {
    const text = value || ''
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length
    const readingTime = Math.ceil(words / 200) // 假设每分钟200词

    setStats({
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs,
      readingTime
    })
  }, [value])

  // 自动保存
  useEffect(() => {
    if (!autoSave || !onSave) return

    const timer = setInterval(() => {
      onSave()
      setLastSaveTime(new Date(getCurrentTimestamp()))
    }, autoSaveInterval)

    return () => clearInterval(timer)
  }, [autoSave, autoSaveInterval, onSave])

  // 添加到历史记录
  const addToHistory = useCallback((content: string, cursor: number) => {
    const newEntry: EditorHistory = {
      content,
      cursor,
      timestamp: getCurrentTimestamp()
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newEntry)
      return newHistory.slice(-50) // 保留最近50个历史记录
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1]
      onChange(prevEntry.content)
      setHistoryIndex(prev => prev - 1)
      
      // 恢复光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(prevEntry.cursor, prevEntry.cursor)
        }
      }, 0)
    }
  }, [history, historyIndex, onChange])

  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1]
      onChange(nextEntry.content)
      setHistoryIndex(prev => prev + 1)
      
      // 恢复光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(nextEntry.cursor, nextEntry.cursor)
        }
      }, 0)
    }
  }, [history, historyIndex, onChange])

  // 插入文本
  const insertText = useCallback((text: string, offset = 0) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.slice(0, start) + text + value.slice(end)
    
    onChange(newValue)
    
    // 设置新的光标位置
    setTimeout(() => {
      const newCursor = start + text.length + offset
      textarea.setSelectionRange(newCursor, newCursor)
      textarea.focus()
    }, 0)
  }, [value, onChange])

  // 格式化工具函数
  const formatBold = () => insertText('**粗体文本**', -4)
  const formatItalic = () => insertText('*斜体文本*', -4)
  const formatStrikethrough = () => insertText('~~删除线文本~~', -6)
  const formatCode = () => insertText('`代码`', -1)
  const formatLink = () => insertText('[链接文本](https://example.com)', -21)
  const formatImage = () => insertText('![图片描述](图片URL)', -6)
  const formatHeading1 = () => insertText('# 一级标题\n', 0)
  const formatHeading2 = () => insertText('## 二级标题\n', 0)
  const formatHeading3 = () => insertText('### 三级标题\n', 0)
  const formatList = () => insertText('- 列表项\n', 0)
  const formatOrderedList = () => insertText('1. 有序列表项\n', 0)
  const formatQuote = () => insertText('> 引用文本\n', 0)

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            onSave?.()
            setLastSaveTime(new Date(getCurrentTimestamp()))
            break
          case 'b':
            e.preventDefault()
            formatBold()
            break
          case 'i':
            e.preventDefault()
            formatItalic()
            break
          case 'k':
            e.preventDefault()
            formatLink()
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'f':
            e.preventDefault()
            setIsSearchOpen(true)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave, undo, redo])

  // 搜索和替换
  const handleSearch = (query: string) => {
    if (!textareaRef.current || !query) return

    const textarea = textareaRef.current
    const text = textarea.value.toLowerCase()
    const searchText = query.toLowerCase()
    const index = text.indexOf(searchText, textarea.selectionStart)

    if (index !== -1) {
      textarea.setSelectionRange(index, index + query.length)
      textarea.focus()
    }
  }

  const handleReplace = (searchText: string, replaceText: string) => {
    if (!searchText) return

    const newValue = value.replace(new RegExp(searchText, 'g'), replaceText)
    onChange(newValue)
  }

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      isFullscreen && 'fixed inset-0 z-50 bg-background',
      className
    )}>
      {/* 工具栏 */}
      {showToolbar && (
        <div className="border-b bg-muted/50 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* 格式化工具 */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={formatBold} title={t('bold')}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatItalic} title={t('italic')}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatStrikethrough} title={t('strikethrough')}>
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={formatHeading1} title={t('heading1')}>
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatHeading2} title={t('heading2')}>
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatHeading3} title={t('heading3')}>
                  <Heading3 className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={formatList} title={t('bulletList')}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatOrderedList} title={t('numberedList')}>
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatQuote} title={t('quote')}>
                  <Quote className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={formatLink} title={t('link')}>
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatImage} title={t('image')}>
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatCode} title={t('code')}>
                  <Code className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* 历史操作 */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  title={t('undo')}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  title={t('redo')}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* 搜索 */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSearchOpen(true)}
                title={t('search')}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* 视图切换 */}
              <div className="flex items-center gap-1">
                <Button
                  variant={!isPreviewMode && !isSplitView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setIsPreviewMode(false)
                    setIsSplitView(false)
                  }}
                  title={t('editMode')}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant={isSplitView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setIsPreviewMode(false)
                    setIsSplitView(true)
                  }}
                  title={t('splitView')}
                >
                  {t('split')}
                </Button>
                <Button
                  variant={isPreviewMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setIsPreviewMode(true)
                    setIsSplitView(false)
                  }}
                  title={t('previewMode')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* 设置和全屏 */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSettingsOpen(true)}
                title={t('settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>

              {/* 保存 */}
              {onSave && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    onSave()
                    setLastSaveTime(new Date(getCurrentTimestamp()))
                  }}
                  title={t('save')}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {t('save')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 编辑器内容区域 */}
      <div className={cn(
        'flex',
        isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-96'
      )}>
        {/* 编辑器 */}
        {(!isPreviewMode || isSplitView) && (
          <div className={cn(
            'flex-1 flex flex-col',
            isSplitView && 'border-r'
          )}>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                // 添加到历史记录
                if (e.target.value !== value) {
                  addToHistory(e.target.value, e.target.selectionStart)
                }
              }}
              placeholder={placeholder}
              className={cn(
                'flex-1 resize-none border-0 rounded-none focus-visible:ring-0',
                settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
              )}
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                tabSize: settings.tabSize,
              }}
              readOnly={readOnly}
              spellCheck={settings.spellCheck}
            />
          </div>
        )}

        {/* 预览 */}
        {(isPreviewMode || isSplitView) && (
          <div className={cn(
            'flex-1 overflow-auto',
            isSplitView && 'border-l'
          )}>
            <ScrollArea className="h-full">
              <div className="p-4">
                <MarkdownRenderer content={value} />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* 状态栏 */}
      {showWordCount && (
        <div className="border-t bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>{t('words')}: {stats.words}</span>
              <span>{t('characters')}: {stats.characters}</span>
              <span>{t('lines')}: {stats.lines}</span>
              <span>{t('readingTime')}: {stats.readingTime} 分钟</span>
            </div>
            <div className="flex items-center gap-2">
              {lastSaveTime && (
                <span>最后保存: {lastSaveTime.toLocaleTimeString()}</span>
              )}
              {autoSave && <Badge variant="secondary" className="text-xs">自动保存</Badge>}
            </div>
          </div>
        </div>
      )}

      {/* 搜索对话框 */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>搜索和替换</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入搜索内容"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery)
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="replace">替换</Label>
              <Input
                id="replace"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="输入替换内容"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSearch(searchQuery)}>
                查找下一个
              </Button>
              <Button onClick={() => handleReplace(searchQuery, replaceQuery)}>
                全部替换
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 设置对话框 */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑器设置</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>字体大小</Label>
                <Input
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  min="10"
                  max="24"
                />
              </div>
              <div>
                <Label>行高</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => setSettings(prev => ({ ...prev, lineHeight: parseFloat(e.target.value) }))}
                  min="1"
                  max="3"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>自动换行</Label>
                <Switch
                  checked={settings.wordWrap}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, wordWrap: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>拼写检查</Label>
                <Switch
                  checked={settings.spellCheck}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, spellCheck: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>自动完成</Label>
                <Switch
                  checked={settings.autoComplete}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoComplete: checked }))}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
