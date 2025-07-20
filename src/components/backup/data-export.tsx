'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Upload, 
  RefreshCw, 
  FileText, 
  Database,
  Users,
  MessageSquare,
  Image,
  Settings,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Archive,
  HardDrive,
  Cloud,
  Shield
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ExportJob {
  id: string
  name: string
  type: 'full' | 'partial' | 'incremental'
  format: 'json' | 'csv' | 'xml' | 'sql'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  dataTypes: string[]
  dateRange?: {
    start: string
    end: string
  }
  fileSize?: number
  downloadUrl?: string
  createdAt: string
  completedAt?: string
  error?: string
}

interface BackupJob {
  id: string
  name: string
  type: 'manual' | 'scheduled'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  destination: 'local' | 'cloud' | 'external'
  encryption: boolean
  compression: boolean
  fileSize?: number
  createdAt: string
  completedAt?: string
  nextRun?: string
  error?: string
}

interface DataExportProps {
  className?: string
}

export function DataExport({ className }: DataExportProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '数据导出',
      subtitle: '导出和备份博客数据',
      loading: '加载中...',
      loadExportsFailed: '加载导出任务失败',
      exportJobCreated: '导出任务已创建',
      createExportFailed: '创建导出任务失败',
      backupJobCreated: '备份任务已创建',
      createBackupFailed: '创建备份任务失败',
      export: '导出',
      backup: '备份',
      restore: '恢复',
      import: '导入',
      full: '完整',
      partial: '部分',
      incremental: '增量',
      manual: '手动',
      scheduled: '定时',
      pending: '等待中',
      running: '运行中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消',
      json: 'JSON',
      csv: 'CSV',
      xml: 'XML',
      sql: 'SQL',
      local: '本地',
      cloud: '云存储',
      external: '外部',
      articles: '文章',
      users: '用户',
      comments: '评论',
      media: '媒体',
      settings: '设置',
      analytics: '分析',
      name: '名称',
      type: '类型',
      format: '格式',
      status: '状态',
      progress: '进度',
      fileSize: '文件大小',
      createdAt: '创建时间',
      completedAt: '完成时间',
      destination: '目标位置',
      encryption: '加密',
      compression: '压缩',
      schedule: '计划',
      dataTypes: '数据类型',
      dateRange: '日期范围',
      startDate: '开始日期',
      endDate: '结束日期',
      create: '创建',
      cancel: '取消',
      download: '下载',
      delete: '删除',
      retry: '重试',
      refresh: '刷新',
      save: '保存',
      close: '关闭',
      confirm: '确认',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingExport, setIsCreatingExport] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [exportForm, setExportForm] = useState({
    name: '',
    type: 'partial' as 'full' | 'partial' | 'incremental',
    format: 'json' as 'json' | 'csv' | 'xml' | 'sql',
    dataTypes: [] as string[],
    dateRange: {
      start: '',
      end: ''
    }
  })
  const [backupForm, setBackupForm] = useState({
    name: '',
    type: 'manual' as const,
    destination: 'local' as const,
    encryption: true,
    compression: true,
    schedule: ''
  })

  // 可导出的数据类型
  const dataTypes = [
    { id: 'articles', name: t('articles'), icon: FileText },
    { id: 'users', name: t('users'), icon: Users },
    { id: 'comments', name: t('comments'), icon: MessageSquare },
    { id: 'media', name: t('media'), icon: Image },
    { id: 'settings', name: t('settings'), icon: Settings },
    { id: 'analytics', name: t('analytics'), icon: Database }
  ]

  // 加载导出和备份任务
  useEffect(() => {
    loadExportJobs()
    loadBackupJobs()
  }, [])

  const loadExportJobs = async () => {
    try {
      const response = await fetch('/api/backup/exports')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setExportJobs(data.data.jobs)
        }
      }
    } catch (error) {
      console.error('Failed to load export jobs:', error)
      showToast.error(t('loadExportsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadBackupJobs = async () => {
    try {
      const response = await fetch('/api/backup/backups')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBackupJobs(data.data.jobs)
        }
      }
    } catch (error) {
      console.error('Failed to load backup jobs:', error)
    }
  }

  // 创建导出任务
  const createExportJob = async () => {
    try {
      const response = await fetch('/api/backup/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportForm)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(t('exportJobCreated'))
          setIsCreatingExport(false)
          resetExportForm()
          await loadExportJobs()
        }
      }
    } catch (error) {
      console.error('Failed to create export job:', error)
      showToast.error(t('createExportFailed'))
    }
  }

  // 创建备份任务
  const createBackupJob = async () => {
    try {
      const response = await fetch('/api/backup/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupForm)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(t('backupJobCreated'))
          setIsCreatingBackup(false)
          resetBackupForm()
          await loadBackupJobs()
        }
      }
    } catch (error) {
      console.error('Failed to create backup job:', error)
      showToast.error(t('createBackupFailed'))
    }
  }

  // 取消任务
  const cancelJob = async (jobId: string, type: 'export' | 'backup') => {
    try {
      const response = await fetch(`/api/backup/${type}s/${jobId}/cancel`, {
        method: 'PUT'
      })

      if (response.ok) {
        showToast.success(t('jobCancelled'))
        if (type === 'export') {
          await loadExportJobs()
        } else {
          await loadBackupJobs()
        }
      }
    } catch (error) {
      console.error('Failed to cancel job:', error)
      showToast.error(t('cancelJobFailed'))
    }
  }

  // 下载文件
  const downloadFile = async (downloadUrl: string, filename: string) => {
    try {
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download file:', error)
      showToast.error(t('downloadFailed'))
    }
  }

  // 重置表单
  const resetExportForm = () => {
    setExportForm({
      name: '',
      type: 'partial',
      format: 'json',
      dataTypes: [],
      dateRange: {
        start: '',
        end: ''
      }
    })
  }

  const resetBackupForm = () => {
    setBackupForm({
      name: '',
      type: 'manual',
      destination: 'local',
      encryption: true,
      compression: true,
      schedule: ''
    })
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // 渲染导出任务卡片
  const renderExportJobCard = (job: ExportJob) => (
    <Card key={job.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{job.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(`exportType.${job.type}`)} • {job.format.toUpperCase()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <Badge variant={job.status === 'completed' ? "default" : job.status === 'failed' ? "destructive" : "secondary"}>
              {t(`status.${job.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {job.status === 'running' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('progress')}</span>
                <span>{job.progress}%</span>
              </div>
              <Progress value={job.progress} />
            </div>
          )}
          
          <div>
            <Label className="text-xs font-medium text-muted-foreground">{t('dataTypes')}</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {job.dataTypes.map((type, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {t(`dataTypes.${type}`)}
                </Badge>
              ))}
            </div>
          </div>
          
          {job.dateRange && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('dateRange')}</Label>
              <div className="text-sm">
                {new Date(job.dateRange.start).toLocaleDateString()} - {new Date(job.dateRange.end).toLocaleDateString()}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('created')}</Label>
              <div>{new Date(job.createdAt).toLocaleString()}</div>
            </div>
            
            {job.completedAt && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">{t('completed')}</Label>
                <div>{new Date(job.completedAt).toLocaleString()}</div>
              </div>
            )}
          </div>
          
          {job.fileSize && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('fileSize')}</Label>
              <div className="text-sm">{formatFileSize(job.fileSize)}</div>
            </div>
          )}
          
          {job.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {job.error}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.downloadUrl && job.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(job.downloadUrl!, `${job.name}.${job.format}`)}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('download')}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {(job.status === 'running' || job.status === 'pending') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelJob(job.id, 'export')}
            >
              {t('cancel')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )

  // 渲染备份任务卡片
  const renderBackupJobCard = (job: BackupJob) => (
    <Card key={job.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{job.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(`backupType.${job.type}`)} • {t(`destination.${job.destination}`)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <Badge variant={job.status === 'completed' ? "default" : job.status === 'failed' ? "destructive" : "secondary"}>
              {t(`status.${job.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {job.status === 'running' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('progress')}</span>
                <span>{job.progress}%</span>
              </div>
              <Progress value={job.progress} />
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            {job.encryption && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span>{t('encrypted')}</span>
              </div>
            )}
            
            {job.compression && (
              <div className="flex items-center gap-1">
                <Archive className="h-3 w-3 text-blue-500" />
                <span>{t('compressed')}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('created')}</Label>
              <div>{new Date(job.createdAt).toLocaleString()}</div>
            </div>
            
            {job.completedAt && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">{t('completed')}</Label>
                <div>{new Date(job.completedAt).toLocaleString()}</div>
              </div>
            )}
          </div>
          
          {job.nextRun && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('nextRun')}</Label>
              <div className="text-sm">{new Date(job.nextRun).toLocaleString()}</div>
            </div>
          )}
          
          {job.fileSize && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('fileSize')}</Label>
              <div className="text-sm">{formatFileSize(job.fileSize)}</div>
            </div>
          )}
          
          {job.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {job.error}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* 实现恢复功能 */}}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('restore')}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {(job.status === 'running' || job.status === 'pending') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelJob(job.id, 'backup')}
            >
              {t('cancel')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )

  // 渲染创建导出对话框
  const renderCreateExportDialog = () => (
    <Dialog open={isCreatingExport} onOpenChange={setIsCreatingExport}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('createExport')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          请根据需要填写或操作。
        </DialogDescription>
        
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="exportName">{t('name')}</Label>
            <Input
              id="exportName"
              value={exportForm.name}
              onChange={(e) => setExportForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('exportNamePlaceholder')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exportType">{t('exportType')}</Label>
              <Select
                value={exportForm.type}
                onValueChange={(value: any) => setExportForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="exportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">{t('exportType.full')}</SelectItem>
                  <SelectItem value="partial">{t('exportType.partial')}</SelectItem>
                  <SelectItem value="incremental">{t('exportType.incremental')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="exportFormat">{t('format')}</Label>
              <Select
                value={exportForm.format}
                onValueChange={(value: any) => setExportForm(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger id="exportFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>{t('selectDataTypes')}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {dataTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dataType-${type.id}`}
                    checked={exportForm.dataTypes.includes(type.id)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setExportForm(prev => ({
                          ...prev,
                          dataTypes: [...prev.dataTypes, type.id]
                        }))
                      } else {
                        setExportForm(prev => ({
                          ...prev,
                          dataTypes: prev.dataTypes.filter(t => t !== type.id)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={`dataType-${type.id}`} className="flex items-center gap-2 text-sm">
                    <type.icon className="h-4 w-4" />
                    {type.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {exportForm.type !== 'full' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t('startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={exportForm.dateRange.start}
                  onChange={(e) => setExportForm(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">{t('endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={exportForm.dateRange.end}
                  onChange={(e) => setExportForm(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreatingExport(false)}
            >
              {t('cancel')}
            </Button>
            
            <Button
              onClick={createExportJob}
              disabled={!exportForm.name || exportForm.dataTypes.length === 0}
            >
              {t('createExport')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { loadExportJobs(); loadBackupJobs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="exports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exports">
            {t('export')} ({exportJobs.length})
          </TabsTrigger>
          <TabsTrigger value="backups">
            {t('backup')} ({backupJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreatingExport(true)}>
              <Download className="h-4 w-4 mr-2" />
              {t('createExport')}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                      <div className="h-20 bg-muted rounded mb-4" />
                      <div className="h-8 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exportJobs.map(renderExportJobCard)}
            </div>
          )}
          
          {!isLoading && exportJobs.length === 0 && (
            <div className="text-center py-12">
              <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t('noExports')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noExportsDescription')}
              </p>
              <Button onClick={() => setIsCreatingExport(true)}>
                <Download className="h-4 w-4 mr-2" />
                {t('createFirstExport')}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreatingBackup(true)}>
              <HardDrive className="h-4 w-4 mr-2" />
              {t('createBackup')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {backupJobs.map(renderBackupJobCard)}
          </div>
          
          {backupJobs.length === 0 && (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t('noBackups')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noBackupsDescription')}
              </p>
              <Button onClick={() => setIsCreatingBackup(true)}>
                <HardDrive className="h-4 w-4 mr-2" />
                {t('createFirstBackup')}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 创建导出对话框 */}
      {renderCreateExportDialog()}
    </div>
  )
}
