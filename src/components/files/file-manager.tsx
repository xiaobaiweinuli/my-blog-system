"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Grid3X3, List, Upload, Search, Download, Trash2, Eye, FileText, Image, Video, Music, Archive } from 'lucide-react'
import { ApiClient, ApiError } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuth } from "@/components/providers/global-auth-context";
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
// 可选：如需更丰富风格可引入其它 highlight.js 主题
// import 'highlight.js/styles/atom-one-dark.css'

interface FileItem {
  id: string
  name: string
  original_name: string
  size: number
  type: string
  url: string
  r2_key: string
  uploaded_by: string
  uploaded_at: string
  is_public: boolean
  folder: string
  metadata?: any
}

interface FileManagerProps {
  user: {
    id: string
    name: string
    role: string
  }
}

export function FileManager({ user }: FileManagerProps) {
  const { session, loading } = useAuth();
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '文件管理',
      upload: '上传文件',
      search: '搜索文件...',
      viewMode: '视图模式',
      grid: '网格',
      list: '列表',
      typeFilter: '文件类型',
      all: '全部',
      images: '图片',
      documents: '文档',
      videos: '视频',
      audio: '音频',
      archives: '压缩包',
      other: '其他',
      name: '文件名',
      size: '大小',
      type: '类型',
      uploadedBy: '上传者',
      uploadedAt: '上传时间',
      actions: '操作',
      view: '查看',
      download: '下载',
      delete: '删除',
      public: '公开',
      private: '私有',
      save: '保存',
      cancel: '取消',
      deleteConfirm: '确定要删除这个文件吗？',
      deleteSuccess: '文件删除成功',
      deleteError: '删除失败',
      uploadSuccess: '上传成功',
      uploadError: '上传失败',
      loadError: '加载失败',
      noFiles: '暂无文件',
      loading: '加载中...',
      uploading: '上传中...',
      selectFiles: '选择文件',
      dragDrop: '拖拽文件到此处或点击选择',
    }
    return translations[key] || key
  }

  const [files, setFiles] = useState<FileItem[]>([])
  const [fileLoading, setFileLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 预览弹窗相关状态
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewType, setPreviewType] = useState<'markdown' | 'json' | 'csv' | 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'svg' | 'code'>('text')
  const [previewTitle, setPreviewTitle] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  type SelectedFile = { file: File, isPublic: boolean }
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // 加载文件列表
  useEffect(() => {
    const loadFiles = async () => {
      setFileLoading(true)
      try {
        const response = await ApiClient.getFiles()
        if (response.success) {
          setFiles(response.data.items)
        } else {
          toast.error(t('loadError'))
        }
      } catch (error) {
        console.error('Failed to load files:', error)
        toast.error(t('loadError'))
      } finally {
        setFileLoading(false)
      }
    }

    loadFiles()
  }, [])

  // 过滤文件
  const filteredFiles = files
    .filter(file => file && file.original_name)
    .filter(file => {
      const matchesSearch = file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      let matchesType = true
      if (typeFilter === "image") matchesType = file.type.startsWith("image/")
      else if (typeFilter === "application") matchesType = file.type.startsWith("application/")
      else if (typeFilter === "video") matchesType = file.type.startsWith("video/")
      else if (typeFilter === "audio") matchesType = file.type.startsWith("audio/")
      else if (typeFilter === "archive") matchesType = file.type.includes("zip") || file.type.includes("rar") || file.type.includes("tar")
      else if (typeFilter === "text") matchesType = file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt") || file.original_name.toLowerCase().endsWith(".txt")
      return matchesSearch && matchesType
    })

  // 获取文件类型图标
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8" />
    if (type.startsWith('video/')) return <Video className="h-8 w-8" />
    if (type.startsWith('audio/')) return <Music className="h-8 w-8" />
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive className="h-8 w-8" />
    return <FileText className="h-8 w-8" />
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 选择文件
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    setSelectedFiles(prev => {
      const all = [
        ...prev,
        ...files.map(f => ({ file: f, isPublic: false }))
      ]
      // 去重
      const unique = Array.from(
        new Map(all.map(f => [f.file.name + f.file.size + f.file.lastModified, f])).values()
      )
      return unique
    })
  }

  // 真正上传
  const handleConfirmUpload = async () => {
    if (!selectedFiles.length) return
    setUploading(true)
    try {
      for (const item of selectedFiles) {
        const response = await ApiClient.uploadFile(item.file, undefined, item.isPublic)
        if (response.success && Array.isArray(response.data)) {
          const newFiles: FileItem[] = response.data.map((data: any) => ({
            id: data.id,
            name: data.name || item.file.name,
            original_name: data.original_name || item.file.name,
            size: data.size || item.file.size,
            type: data.type || item.file.type,
            url: data.url || '',
            r2_key: data.r2_key || '',
            uploaded_by: data.uploaded_by || data.uploaded_by_username || (session?.user?.id || ''),
            uploaded_at: data.uploaded_at || new Date().toISOString(),
            is_public: typeof data.is_public === 'boolean' ? data.is_public : item.isPublic,
            folder: data.folder || '',
            metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : (data.metadata || {}),
          }));
          setFiles(prev => [...newFiles, ...prev]);
        } else if (response.success && response.data && typeof response.data.id === 'string') {
          // 兼容单对象情况
          const data = response.data;
          const fileItem: FileItem = {
            id: data.id,
            name: data.name || item.file.name,
            original_name: data.original_name || item.file.name,
            size: data.size || item.file.size,
            type: data.type || item.file.type,
            url: data.url || '',
            r2_key: data.r2_key || '',
            uploaded_by: data.uploaded_by || data.uploaded_by_username || (session?.user?.id || ''),
            uploaded_at: data.uploaded_at || new Date().toISOString(),
            is_public: typeof data.is_public === 'boolean' ? data.is_public : item.isPublic,
            folder: data.folder || '',
            metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : (data.metadata || {}),
          };
          setFiles(prev => [fileItem, ...prev]);
        } else {
          toast.error(t('uploadError'));
        }
      }
      toast.success(t('uploadSuccess'))
      setSelectedFiles([])
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(t('uploadError'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // 取消选择
  const handleCancelSelect = (idx?: number) => {
    if (typeof idx === 'number') {
      setSelectedFiles(files => files.filter((_, i) => i !== idx))
    } else {
      setSelectedFiles([])
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // 删除文件
  const handleDelete = async () => {
    if (!deletingFile) return

    try {
      const response = await ApiClient.deleteFile(deletingFile.id)
      if (response.success) {
        setFiles(prev => prev.filter(file => file.id !== deletingFile.id))
        toast.success(t('deleteSuccess'))
      } else {
        toast.error(t('deleteError'))
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error(t('deleteError'))
    } finally {
      setDeleteDialogOpen(false)
      setDeletingFile(null)
    }
  }

  // 新增一个工具函数，统一生成文件API路径
  const getFileApiUrl = (file: FileItem) => `/api/files/${file.id}`

  // 下载文件（Blob 方式，优先用 session token，兼容 localStorage）
  const handleDownload = async (file: FileItem) => {
    try {
      let token = ''
      if (session?.user?.token) {
        token = session.user.token
      } else {
        token = localStorage.getItem('token') || ''
      }
      const res = await fetch(getFileApiUrl(file), {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (!res.ok) {
        toast.error('下载失败')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('下载失败')
    }
  }

  // 工具函数：转义 HTML，防止 XSS
  function escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      } as any)[m];
    });
  }

  // 预览文件（弹窗方式）
  const handleView = (file: FileItem) => {
    let token = session?.user?.token || localStorage.getItem('token') || ''
    const url = getFileApiUrl(file) + '?preview=1';
    console.log('[handleView] 请求预览:', url)
    fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(async res => {
        const contentType = res.headers.get('content-type') || ''
        const fileName = file.original_name.toLowerCase()
        console.log('[handleView] 响应 content-type:', contentType, 'fileName:', fileName)
        if (!res.ok) throw new Error('预览失败')
        const blob = await res.blob()
        const isMarkdown = fileName.endsWith('.md') || contentType.includes('markdown')
        const isJson = fileName.endsWith('.json') || contentType.includes('json')
        const isCsv = fileName.endsWith('.csv') || contentType.includes('csv')
        if (contentType.startsWith('image/')) {
          // 图片预览
          const url = URL.createObjectURL(blob)
          setPreviewType('image')
          setPreviewImageUrl(url)
          setPreviewTitle(file.original_name)
          setPreviewOpen(true)
        } else if (contentType.startsWith('audio/')) {
          // 音频预览
          const url = URL.createObjectURL(blob)
          setPreviewType('audio')
          setPreviewImageUrl(url)
          setPreviewTitle(file.original_name)
          setPreviewOpen(true)
        } else if (contentType.startsWith('video/')) {
          // 视频预览
          const url = URL.createObjectURL(blob)
          setPreviewType('video')
          setPreviewImageUrl(url)
          setPreviewTitle(file.original_name)
          setPreviewOpen(true)
        } else if (contentType === 'application/pdf' || fileName.endsWith('.pdf')) {
          // PDF 预览
          const url = URL.createObjectURL(blob)
          setPreviewType('pdf')
          setPreviewImageUrl(url)
          setPreviewTitle(file.original_name)
          setPreviewOpen(true)
        } else if (fileName.endsWith('.svg') || contentType === 'image/svg+xml') {
          // SVG 预览
          const url = URL.createObjectURL(blob)
          setPreviewType('svg')
          setPreviewImageUrl(url)
          setPreviewTitle(file.original_name)
          setPreviewOpen(true)
        } else if (contentType.startsWith('text/') || isMarkdown || isJson || isCsv) {
          const reader = new FileReader()
          reader.onload = async function (e) {
            const text = e.target?.result as string
            setPreviewTitle(file.original_name)
            // 代码文件扩展名判断
            const codeExt = /\.(js|ts|jsx|tsx|py|java|c|cpp|go|sh|rb|php|html|css|scss|xml|yml|yaml|ini|conf|log)$/i
            if (isMarkdown) {
              setPreviewType('markdown')
              const html = await marked.parse(text)
              setPreviewContent(html)
            } else if (isJson) {
              setPreviewType('json')
              setPreviewContent(hljs.highlight(text, { language: 'json' }).value)
            } else if (isCsv) {
              setPreviewType('csv')
              setPreviewContent(hljs.highlight(text, { language: 'csv' }).value)
            } else if (codeExt.test(fileName)) {
              setPreviewType('code')
              setPreviewContent(hljs.highlightAuto(text).value)
            } else {
              setPreviewType('text')
              setPreviewContent(text)
            }
            setPreviewOpen(true)
          }
          reader.readAsText(blob, 'utf-8')
        } else {
          toast.error('暂不支持该类型预览: ' + contentType)
          console.log('[handleView] 预览失败，content-type:', contentType, 'fileName:', fileName, 'blob:', blob)
        }
      })
      .catch((e) => {
        toast.error('预览失败')
        console.error('[handleView] 预览异常:', e)
      })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 删除组件内部的文件管理标题 */}
      {/* <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? t('uploading') : t('upload')}
        </Button>
      </div> */}
      <div className="flex justify-between items-center">
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          选择文件
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {selectedFiles.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 p-4 bg-muted rounded-lg shadow-sm">
          {selectedFiles.map((item, idx) => (
            <div key={item.file.name + item.file.size + item.file.lastModified} className="flex items-center gap-3">
              <span className="font-medium text-base text-foreground truncate max-w-xs">{item.file.name}</span>
              <label className="text-sm text-muted-foreground">权限：</label>
              <Select
                value={item.isPublic ? 'true' : 'false'}
                onValueChange={val => {
                  const isPub = val === 'true'
                  setSelectedFiles(files =>
                    files.map((f, i) => i === idx ? { ...f, isPublic: isPub } : f)
                  )
                }}
              >
                <SelectTrigger className="w-24 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="text-lg text-center font-semibold">公开</SelectItem>
                  <SelectItem value="false" className="text-lg text-center font-semibold">私有</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleCancelSelect(idx)} className="h-9">取消</Button>
            </div>
          ))}
          <Button onClick={handleConfirmUpload} disabled={uploading} className="h-9 mt-2">
            <Upload className="h-4 w-4 mr-2" />
            确认上传
          </Button>
        </div>
      )}


      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="image">图片</SelectItem>
            <SelectItem value="application">文档</SelectItem>
            <SelectItem value="video">视频</SelectItem>
            <SelectItem value="audio">音频</SelectItem>
            <SelectItem value="archive">压缩包</SelectItem>
            <SelectItem value="text">文本（txt）</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('noFiles')}</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {t('upload')}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg mb-3">
                  {getFileIcon(file.type)}
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-sm truncate" title={file.original_name}>
                    {file.original_name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <Badge variant={file.is_public ? "default" : "secondary"}>
                      {file.is_public ? t('public') : t('private')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(file)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingFile(file)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <h3 className="font-medium">{file.original_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={file.is_public ? "default" : "secondary"}>
                      {file.is_public ? t('public') : t('private')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingFile(file)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete')}</DialogTitle>
          </DialogHeader>
          <p>{t('deleteConfirm')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={previewOpen} onOpenChange={open => {
        setPreviewOpen(open)
        if (!open && previewImageUrl) {
          URL.revokeObjectURL(previewImageUrl)
          setPreviewImageUrl(null)
        }
      }}>
        <DialogContent style={{ minWidth: 600, minHeight: 400 }}>
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {previewType === 'image' && previewImageUrl ? (
              <img src={previewImageUrl} alt={previewTitle} style={{ maxWidth: '100%', maxHeight: 480, display: 'block', margin: '0 auto' }} />
            ) : previewType === 'audio' && previewImageUrl ? (
              <audio controls src={previewImageUrl} style={{ width: '100%' }} />
            ) : previewType === 'video' && previewImageUrl ? (
              <video controls src={previewImageUrl} style={{ width: '100%', maxHeight: 480 }} />
            ) : previewType === 'pdf' && previewImageUrl ? (
              <iframe src={previewImageUrl} style={{ width: '100%', height: 480 }} />
            ) : previewType === 'svg' && previewImageUrl ? (
              <object data={previewImageUrl} type="image/svg+xml" style={{ width: '100%', height: 480 }} />
            ) : previewType === 'markdown' ? (
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : previewType === 'json' || previewType === 'csv' ? (
              <pre>
                <code
                  className={`hljs language-${previewType}`}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </pre>
            ) : previewType === 'code' ? (
              <pre>
                <code
                  className="hljs"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </pre>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {previewContent}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
