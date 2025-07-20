"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bold, 
  Italic, 
  Link, 
  Image, 
  List, 
  ListOrdered,
  Quote,
  Code,
  Eye,
  Edit
} from 'lucide-react'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  height?: string
}

export function MarkdownEditor({
  value = '',
  onChange,
  placeholder = '开始编写...',
  className = '',
  height = '400px'
}: MarkdownEditorProps) {
  const [content, setContent] = useState(value)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(value)
  }, [value])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onChange?.(newContent)
  }

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder
    
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end)
    
    handleContentChange(newContent)
    
    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + textToInsert.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertLink = () => {
    const url = prompt('请输入链接地址:')
    if (url) {
      insertText('[', `](${url})`, '链接文本')
    }
  }

  const insertImage = () => {
    const url = prompt('请输入图片地址:')
    if (url) {
      insertText('![', `](${url})`, '图片描述')
    }
  }

  // 简单的 Markdown 预览渲染
  const renderPreview = (markdown: string) => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br>')
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
        <div className="flex items-center justify-between border-b p-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('**', '**', '粗体文本')}
              title="粗体"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('*', '*', '斜体文本')}
              title="斜体"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertLink}
              title="链接"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertImage}
              title="图片"
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('- ', '', '列表项')}
              title="无序列表"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('1. ', '', '列表项')}
              title="有序列表"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('> ', '', '引用文本')}
              title="引用"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('`', '`', '代码')}
              title="行内代码"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <Edit className="h-3 w-3" />
              编辑
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              预览
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 resize-none focus-visible:ring-0"
            style={{ height, minHeight: height }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div 
            className="p-4 prose prose-sm max-w-none"
            style={{ height, minHeight: height, overflow: 'auto' }}
            dangerouslySetInnerHTML={{ 
              __html: content ? renderPreview(content) : '<p class="text-muted-foreground">暂无内容</p>' 
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
