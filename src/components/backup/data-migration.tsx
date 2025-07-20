'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRightLeft, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Cloud,
  HardDrive,
  FileText,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Copy
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface MigrationJob {
  id: string
  name: string
  type: 'import' | 'export' | 'sync'
  source: {
    type: 'file' | 'database' | 'api' | 'url'
    config: Record<string, any>
  }
  destination: {
    type: 'database' | 'file' | 'api'
    config: Record<string, any>
  }
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  totalRecords: number
  processedRecords: number
  errorCount: number
  mapping: Record<string, string>
  validation: {
    enabled: boolean
    rules: string[]
  }
  createdAt: string
  startedAt?: string
  completedAt?: string
  error?: string
  logs: string[]
}

interface DataMigrationProps {
  className?: string
}

export function DataMigration({ className }: DataMigrationProps) {
  // 中文静态文本
  const t = (key: string) => {
    // 修复重复键名，只保留最后一个
    const translations: Record<string, string> = {
      dataMigration: '数据迁移',
      dataMigrationDescription: '导入、导出和同步数据',
      refresh: '刷新',
      createJob: '新建任务',
      createMigrationJob: '新建迁移任务',
      jobCreated: '任务创建成功',
      loadJobsFailed: '加载任务失败',
      createJobFailed: '创建任务失败',
      startSuccess: '任务已启动',
      startFailed: '启动失败',
      pauseSuccess: '已暂停',
      pauseFailed: '暂停失败',
      resumeSuccess: '已恢复',
      resumeFailed: '恢复失败',
      cancelSuccess: '已取消',
      cancelFailed: '取消失败',
      jobType_import: '导入',
      jobType_export: '导出',
      jobType_sync: '同步',
      sourceTypes_file: '文件',
      sourceTypes_database: '数据库',
      sourceTypes_api: 'API',
      sourceTypes_url: 'URL',
      destinationTypes_database: '数据库',
      destinationTypes_file: '文件',
      destinationTypes_api: 'API',
      status_pending: '待处理',
      status_running: '进行中',
      status_completed: '已完成',
      status_failed: '失败',
      status_paused: '已暂停',
      progress: '进度',
      totalRecords: '总记录数',
      processed: '已处理',
      errors: '错误',
      created: '创建时间',
      completed: '完成时间',
      validation: '校验',
      validationEnabled: '已启用',
      error: '错误',
      name: '名称',
      type: '类型',
      source: '数据源',
      sourceType: '源类型',
      selectFile: '选择文件',
      host: '主机',
      database: '数据库',
      url: 'URL',
      destination: '目标',
      destinationType: '目标类型',
      table: '数据表',
      fileName: '文件名',
      enableValidation: '启用校验',
      validationDescription: '启用后将对数据进行完整性校验',
      cancel: '取消',
      create: '创建',
      jobNamePlaceholder: '请输入任务名称',
      start: '启动',
      pause: '暂停',
      resume: '恢复',
      restart: '重试',
      delete: '删除',
      logs: '日志',
      jobLogs: '任务日志',
      noLogs: '暂无日志',
      noJobs: '暂无任务',
      noJobsDescription: '还没有迁移任务，点击下方按钮新建。',
      createFirstJob: '新建第一个任务',
    }
    if (key.startsWith('jobType.')) return translations['jobType_' + key.split('.')[1]] || key
    if (key.startsWith('sourceTypes.')) return translations['sourceTypes_' + key.split('.')[1]] || key
    if (key.startsWith('destinationTypes.')) return translations['destinationTypes_' + key.split('.')[1]] || key
    if (key.startsWith('status.')) return translations['status_' + key.split('.')[1]] || key
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [migrationJobs, setMigrationJobs] = useState<MigrationJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<MigrationJob | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showLogs, setShowLogs] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'import' as 'import' | 'export' | 'sync',
    source: {
      type: 'file' as 'file' | 'database' | 'api' | 'url',
      config: {}
    },
    destination: {
      type: 'database' as 'database' | 'file' | 'api',
      config: {}
    },
    validation: {
      enabled: true,
      rules: []
    }
  })

  // 支持的数据源类型
  const sourceTypes = [
    { id: 'file', name: t('sourceTypes.file'), icon: FileText },
    { id: 'database', name: t('sourceTypes.database'), icon: Database },
    { id: 'api', name: t('sourceTypes.api'), icon: Cloud },
    { id: 'url', name: t('sourceTypes.url'), icon: Download }
  ]

  const destinationTypes = [
    { id: 'database', name: t('destinationTypes.database'), icon: Database },
    { id: 'file', name: t('destinationTypes.file'), icon: FileText },
    { id: 'api', name: t('destinationTypes.api'), icon: Cloud }
  ]

  // 加载迁移任务
  useEffect(() => {
    loadMigrationJobs()
  }, [])

  const loadMigrationJobs = async () => {
    try {
      const response = await fetch('/api/migration/jobs')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMigrationJobs(data.data.jobs)
        }
      }
    } catch (error) {
      console.error('Failed to load migration jobs:', error)
      showToast.error(t('loadJobsFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 创建迁移任务
  const createMigrationJob = async () => {
    try {
      const response = await fetch('/api/migration/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(t('jobCreated'))
          setIsCreating(false)
          resetForm()
          await loadMigrationJobs()
        }
      }
    } catch (error) {
      console.error('Failed to create migration job:', error)
      showToast.error(t('createJobFailed'))
    }
  }

  // 控制任务执行
  const controlJob = async (jobId: string, action: 'start' | 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch(`/api/migration/jobs/${jobId}/${action}`, {
        method: 'PUT'
      })

      if (response.ok) {
        showToast.success(t(`${action}Success`))
        await loadMigrationJobs()
      }
    } catch (error) {
      console.error(`Failed to ${action} job:`, error)
      showToast.error(t(`${action}Failed`))
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'import',
      source: {
        type: 'file',
        config: {}
      },
      destination: {
        type: 'database',
        config: {}
      },
      validation: {
        enabled: true,
        rules: []
      }
    })
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
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'pending':
        return <Play className="h-4 w-4 text-gray-500" />
      default:
        return <Play className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'import':
        return <Upload className="h-4 w-4" />
      case 'export':
        return <Download className="h-4 w-4" />
      case 'sync':
        return <ArrowRightLeft className="h-4 w-4" />
      default:
        return <ArrowRightLeft className="h-4 w-4" />
    }
  }

  // 渲染迁移任务卡片
  const renderMigrationJobCard = (job: MigrationJob) => (
    <Card key={job.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(job.type)}
            <div>
              <CardTitle className="text-lg">{job.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(`jobType.${job.type}`)} • {t(`sourceTypes.${job.source.type}`)} → {t(`destinationTypes.${job.destination.type}`)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <Badge variant={
              job.status === 'completed' ? "default" : 
              job.status === 'failed' ? "destructive" : 
              job.status === 'running' ? "default" : "secondary"
            }>
              {t(`status.${job.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {(job.status === 'running' || job.status === 'paused') && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('progress')}</span>
                <span>{job.progress}% ({job.processedRecords.toLocaleString()} / {job.totalRecords.toLocaleString()})</span>
              </div>
              <Progress value={job.progress} />
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{job.totalRecords.toLocaleString()}</div>
              <div className="text-muted-foreground">{t('totalRecords')}</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium">{job.processedRecords.toLocaleString()}</div>
              <div className="text-muted-foreground">{t('processed')}</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-red-600">{job.errorCount}</div>
              <div className="text-muted-foreground">{t('errors')}</div>
            </div>
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
          
          {job.validation.enabled && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t('validation')}</Label>
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{t('validationEnabled')}</span>
              </div>
            </div>
          )}
          
          {job.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{job.error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(job.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(job.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {job.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => controlJob(job.id, 'start')}
            >
              <Play className="h-4 w-4 mr-2" />
              {t('start')}
            </Button>
          )}
          
          {job.status === 'running' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => controlJob(job.id, 'pause')}
            >
              <Pause className="h-4 w-4 mr-2" />
              {t('pause')}
            </Button>
          )}
          
          {job.status === 'paused' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => controlJob(job.id, 'resume')}
              >
                <Play className="h-4 w-4 mr-2" />
                {t('resume')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => controlJob(job.id, 'cancel')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>
            </>
          )}
          
          {(job.status === 'failed' || job.status === 'completed') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => controlJob(job.id, 'start')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('restart')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )

  // 渲染创建任务对话框
  const renderCreateJobDialog = () => (
    <Dialog open={isCreating} onOpenChange={setIsCreating}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('createMigrationJob')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          请根据需要填写或操作。
        </DialogDescription>
        
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobName">{t('name')}</Label>
              <Input
                id="jobName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('jobNamePlaceholder')}
              />
            </div>
            
            <div>
              <Label htmlFor="jobType">{t('type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="jobType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="import">{t('jobType.import')}</SelectItem>
                  <SelectItem value="export">{t('jobType.export')}</SelectItem>
                  <SelectItem value="sync">{t('jobType.sync')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('source')}</h3>
              
              <div>
                <Label htmlFor="sourceType">{t('sourceType')}</Label>
                <Select
                  value={formData.source.type}
                  onValueChange={(value: any) => setFormData(prev => ({
                    ...prev,
                    source: { ...prev.source, type: value, config: {} }
                  }))}
                >
                  <SelectTrigger id="sourceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.source.type === 'file' && (
                <div>
                  <Label htmlFor="sourceFile">{t('selectFile')}</Label>
                  <Input
                    id="sourceFile"
                    type="file"
                    accept=".json,.csv,.xml,.sql"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData(prev => ({
                          ...prev,
                          source: { ...prev.source, config: { fileName: file.name } }
                        }))
                      }
                    }}
                  />
                </div>
              )}
              
              {formData.source.type === 'database' && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="sourceHost">{t('host')}</Label>
                    <Input
                      id="sourceHost"
                      placeholder="localhost"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        source: { ...prev.source, config: { ...prev.source.config, host: e.target.value } }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sourceDatabase">{t('database')}</Label>
                    <Input
                      id="sourceDatabase"
                      placeholder="database_name"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        source: { ...prev.source, config: { ...prev.source.config, database: e.target.value } }
                      }))}
                    />
                  </div>
                </div>
              )}
              
              {formData.source.type === 'url' && (
                <div>
                  <Label htmlFor="sourceUrl">{t('url')}</Label>
                  <Input
                    id="sourceUrl"
                    type="url"
                    placeholder="https://api.example.com/data"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      source: { ...prev.source, config: { url: e.target.value } }
                    }))}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('destination')}</h3>
              
              <div>
                <Label htmlFor="destinationType">{t('destinationType')}</Label>
                <Select
                  value={formData.destination.type}
                  onValueChange={(value: any) => setFormData(prev => ({
                    ...prev,
                    destination: { ...prev.destination, type: value, config: {} }
                  }))}
                >
                  <SelectTrigger id="destinationType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.destination.type === 'database' && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="destTable">{t('table')}</Label>
                    <Input
                      id="destTable"
                      placeholder="table_name"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        destination: { ...prev.destination, config: { ...prev.destination.config, table: e.target.value } }
                      }))}
                    />
                  </div>
                </div>
              )}
              
              {formData.destination.type === 'file' && (
                <div>
                  <Label htmlFor="destFileName">{t('fileName')}</Label>
                  <Input
                    id="destFileName"
                    placeholder="export.json"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, config: { fileName: e.target.value } }
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Switch
                id="validation"
                checked={formData.validation.enabled}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({
                  ...prev,
                  validation: { ...prev.validation, enabled: checked }
                }))}
              />
              <Label htmlFor="validation">{t('enableValidation')}</Label>
            </div>
            
            {formData.validation.enabled && (
              <div className="text-sm text-muted-foreground">
                {t('validationDescription')}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              {t('cancel')}
            </Button>
            
            <Button
              onClick={createMigrationJob}
              disabled={!formData.name}
            >
              {t('createJob')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // 渲染日志对话框
  const renderLogsDialog = () => {
    const job = migrationJobs.find(j => j.id === showLogs)
    if (!job) return null

    return (
      <Dialog open={!!showLogs} onOpenChange={() => setShowLogs(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('jobLogs')} - {job.name}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          
          <div className="space-y-4 pt-4">
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {job.logs.map((log, index) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                    {log}
                  </div>
                ))}
                
                {job.logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noLogs')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6" />
            {t('dataMigration')}
          </h1>
          <p className="text-muted-foreground">{t('dataMigrationDescription')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadMigrationJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
          
          <Button onClick={() => setIsCreating(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {t('createJob')}
          </Button>
        </div>
      </div>

      {/* 迁移任务列表 */}
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
          {migrationJobs.map(renderMigrationJobCard)}
        </div>
      )}
      
      {!isLoading && migrationJobs.length === 0 && (
        <div className="text-center py-12">
          <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{t('noJobs')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('noJobsDescription')}
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {t('createFirstJob')}
          </Button>
        </div>
      )}

      {/* 创建任务对话框 */}
      {renderCreateJobDialog()}

      {/* 日志对话框 */}
      {renderLogsDialog()}
    </div>
  )
}
