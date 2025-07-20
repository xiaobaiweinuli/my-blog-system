'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Braces, 
  FileJson, 
  Copy, 
  Eye, 
  FileCheck, 
  AlertTriangle,
  Check,
  Info,
  Code,
  Download,
  RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface StructuredDataTemplate {
  id: string
  type: string
  name: string
  description: string
  fields: StructuredDataField[]
  example: string
}

interface StructuredDataField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required: boolean
  description: string
  default?: string
}

interface StructuredDataGeneratorProps {
  url?: string
  className?: string
}

export function StructuredDataGenerator({ url, className }: StructuredDataGeneratorProps) {
  // 检查是否有国际化上下文
  const t = {
    title: '结构化数据生成器',
    description: '生成和验证结构化数据标记',
    generate: '生成',
    copy: '复制',
    preview: '预览',
    validate: '验证',
    loading: '生成中...',
    success: '生成成功',
    error: '生成失败',
    copySuccess: '代码已复制',
    copyError: '复制失败',
    validationSuccess: '验证通过',
    validationFailed: '验证失败',
    validationError: '验证出错',
    applySuccess: '已应用到页面',
    applyFailed: '应用失败',
    loadTemplatesFailed: '加载模板失败',
    requiredFieldsMissing: '缺少必填字段',
    generationSuccess: '代码生成成功',
    generationFailed: '代码生成失败',
    structuredDataGenerator: '结构化数据生成器',
    structuredDataDescription: '生成和验证结构化数据标记',
    selectTemplate: '选择模板',
    selectTemplatePlaceholder: '选择结构化数据模板',
    fillDetails: '填写详情',
    targetUrl: '目标URL',
    generateCode: '生成代码',
    generatedCode: '生成的代码',
    copyCode: '复制代码',
    validateCode: '验证代码',
    previewCode: '预览代码',
    applyToPage: '应用到页面',
    noCodeGenerated: '未生成代码',
    selectTemplateAndFill: '请选择模板并填写详情',
    validationResults: '验证结果',
    validStructuredData: '有效的结构化数据',
    validStructuredDataDescription: '您的结构化数据格式正确，可以被搜索引擎正确解析。',
    errors: '错误',
    warnings: '警告',
    structuredDataPreview: '结构化数据预览',
    previewDescription: '这是生成的JSON-LD结构化数据的预览',
    true: '是',
    false: '否'
  }
  
  const { showToast } = useToast()
  
  const [templates, setTemplates] = useState<StructuredDataTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [targetUrl, setTargetUrl] = useState(url || '')

  // 加载模板
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/structured-data/templates')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTemplates(data.data.templates)
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      showToast.error(t.loadTemplatesFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    
    if (template) {
      const initialData: Record<string, any> = {}
      template.fields.forEach(field => {
        if (field.default !== undefined) {
          initialData[field.name] = field.default
        } else {
          switch (field.type) {
            case 'string':
              initialData[field.name] = ''
              break
            case 'number':
              initialData[field.name] = 0
              break
            case 'boolean':
              initialData[field.name] = false
              break
            case 'array':
              initialData[field.name] = []
              break
            case 'object':
              initialData[field.name] = {}
              break
            default:
              initialData[field.name] = ''
          }
        }
      })
      setFormData(initialData)
    }
  }

  const updateFormData = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const generateStructuredData = async () => {
    if (!selectedTemplate) {
      showToast.error('请选择模板')
      return
    }

    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return

    // 验证必填字段
    const missingFields = template.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.name)

    if (missingFields.length > 0) {
      showToast.error(`缺少必填字段: ${missingFields.join(', ')}`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/structured-data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: formData,
          url: targetUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setGeneratedCode(data.data.code)
          showToast.success(t.generationSuccess)
        }
      }
    } catch (error) {
      console.error('Failed to generate structured data:', error)
      showToast.error(t.generationFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const validateStructuredData = async () => {
    if (!generatedCode) return

    setIsValidating(true)
    try {
      const response = await fetch('/api/structured-data/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: generatedCode })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setValidationResult(data.data.result)
          
          if (data.data.result.valid) {
            showToast.success(t.validationSuccess)
          } else {
            showToast.error(t.validationFailed)
          }
        }
      }
    } catch (error) {
      console.error('Failed to validate structured data:', error)
      showToast.error(t.validationError)
    } finally {
      setIsValidating(false)
    }
  }

  const applyStructuredData = async () => {
    if (!generatedCode || !targetUrl) return

    try {
      const response = await fetch('/api/structured-data/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: generatedCode,
          url: targetUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success(t.applySuccess)
        }
      }
    } catch (error) {
      console.error('Failed to apply structured data:', error)
      showToast.error(t.applyFailed)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      showToast.success(t.copySuccess)
    } catch (error) {
      console.error('Failed to copy code:', error)
      showToast.error(t.copyError)
    }
  }

  const previewStructuredData = () => {
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${t.structuredDataPreview}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script type="application/ld+json">
            ${generatedCode}
          </script>
        </head>
        <body>
          <h1>${t.structuredDataPreview}</h1>
          <p>${t.previewDescription}</p>
          <pre><code>${generatedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Braces className="h-6 w-6" />
            {t.structuredDataGenerator}
          </h1>
          <p className="text-muted-foreground">{t.structuredDataDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：模板选择和表单 */}
        <div className="space-y-6">
          {/* 模板选择 */}
          <Card>
            <CardHeader>
              <CardTitle>{t.selectTemplate}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectTemplatePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 表单填写 */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>{t.fillDetails}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetUrl">{t.targetUrl}</Label>
                    <Input
                      id="targetUrl"
                      aria-label={t.targetUrl}
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com/page"
                    />
                  </div>

                  {templates
                    .find(t => t.id === selectedTemplate)
                    ?.fields.map((field) => (
                      <div key={field.name}>
                        <Label htmlFor={field.name}>
                          {field.description}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        
                        {field.type === 'string' && (
                          <Input
                            id={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => updateFormData(field.name, e.target.value)}
                            placeholder={field.description}
                          />
                        )}
                        
                        {field.type === 'number' && (
                          <Input
                            id={field.name}
                            type="number"
                            value={formData[field.name] || ''}
                            onChange={(e) => updateFormData(field.name, Number(e.target.value))}
                            placeholder={field.description}
                          />
                        )}
                        
                        {field.type === 'boolean' && (
                          <Select
                            value={String(formData[field.name] || false)}
                            onValueChange={(value) => updateFormData(field.name, value === 'true')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">{t.true}</SelectItem>
                              <SelectItem value="false">{t.false}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        {field.type === 'date' && (
                          <Input
                            id={field.name}
                            type="date"
                            value={formData[field.name] || ''}
                            onChange={(e) => updateFormData(field.name, e.target.value)}
                          />
                        )}
                        
                        {field.type === 'array' && (
                          <Textarea
                            id={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => updateFormData(field.name, e.target.value.split(',').map(s => s.trim()))}
                            placeholder="用逗号分隔多个值"
                          />
                        )}
                      </div>
                    ))}

                  <Button
                    onClick={generateStructuredData}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Code className="h-4 w-4 mr-2" />
                    )}
                    {t.generateCode}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：生成的代码和验证 */}
        <div className="space-y-6">
          {/* 生成的代码 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.generatedCode}
                <div className="flex items-center gap-2">
                  {generatedCode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        {t.copy}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validateStructuredData}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileCheck className="h-4 w-4" />
                        )}
                        {t.validate}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={previewStructuredData}
                      >
                        <Eye className="h-4 w-4" />
                        {t.preview}
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedCode ? (
                <>
                  <Textarea
                    value={generatedCode}
                    readOnly
                    className="font-mono text-sm h-64"
                  />
                  
                  {targetUrl && (
                    <div className="mt-4">
                      <Button onClick={applyStructuredData}>
                        {t.applyToPage}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t.noCodeGenerated}</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t.selectTemplateAndFill}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 验证结果 */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {t.validationResults}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResult.valid ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle>{t.validStructuredData}</AlertTitle>
                    <AlertDescription>
                      {t.validStructuredDataDescription}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {validationResult.errors.length > 0 && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertTitle>{t.errors}</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 space-y-1 mt-2">
                            {validationResult.errors.map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <Info className="h-4 w-4 text-yellow-500" />
                        <AlertTitle>{t.warnings}</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 space-y-1 mt-2">
                            {validationResult.warnings.map((warning, index) => (
                              <li key={index} className="text-sm">{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
