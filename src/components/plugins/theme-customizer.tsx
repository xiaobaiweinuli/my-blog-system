'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Paintbrush, 
  Check, 
  RefreshCw, 
  Save,
  Copy,
  Palette,
  Layout,
  Type,
  Image,
  Sliders,
  EyeOff,
  Eye,
  Undo,
  Download,
  Upload,
  Code
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    border: string
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
  spacing: {
    containerWidth: number
    gapSmall: number
    gapMedium: number
    gapLarge: number
  }
  borderRadius: {
    small: number
    medium: number
    large: number
  }
  shadows: {
    small: string
    medium: string
    large: string
  }
  animations: {
    enabled: boolean
    duration: number
  }
}

interface ThemePreset {
  id: string
  name: string
  description: string
  preview: string
  config: ThemeConfig
}

interface ThemeCustomizerProps {
  className?: string
}

export function ThemeCustomizer({ className }: ThemeCustomizerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '主题定制器',
      subtitle: '自定义博客主题和样式',
      loading: '加载中...',
      loadConfigFailed: '加载主题配置失败',
      presetApplied: '预设已应用',
      configSaved: '配置已保存',
      saveConfigFailed: '保存配置失败',
      configReset: '配置已重置',
      configExported: '配置已导出',
      configImported: '配置已导入',
      cssCopied: 'CSS代码已复制',
      copyFailed: '复制失败',
      colors: '颜色',
      fonts: '字体',
      spacing: '间距',
      borderRadius: '圆角',
      shadows: '阴影',
      animations: '动画',
      primary: '主色',
      secondary: '次色',
      accent: '强调色',
      background: '背景色',
      foreground: '前景色',
      muted: '静音色',
      mutedForeground: '静音前景色',
      border: '边框色',
      heading: '标题字体',
      body: '正文字体',
      mono: '等宽字体',
      containerWidth: '容器宽度',
      gapSmall: '小间距',
      gapMedium: '中间距',
      gapLarge: '大间距',
      small: '小',
      medium: '中',
      large: '大',
      enabled: '启用',
      disabled: '禁用',
      duration: '持续时间',
      save: '保存',
      reset: '重置',
      export: '导出',
      import: '导入',
      copy: '复制',
      preview: '预览',
      code: '代码',
      presets: '预设',
      custom: '自定义',
      apply: '应用',
      cancel: '取消',
      confirm: '确认',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    name: 'Custom Theme',
    colors: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#3b82f6',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      border: '#e2e8f0'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'Menlo'
    },
    spacing: {
      containerWidth: 1200,
      gapSmall: 8,
      gapMedium: 16,
      gapLarge: 24
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    animations: {
      enabled: true,
      duration: 200
    }
  })
  
  const [presets, setPresets] = useState<ThemePreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [cssCode, setCssCode] = useState('')
  const [originalConfig, setOriginalConfig] = useState<ThemeConfig | null>(null)

  // 加载主题配置和预设
  useEffect(() => {
    loadThemeConfig()
    loadThemePresets()
  }, [])

  // 生成CSS代码
  useEffect(() => {
    generateCssCode()
  }, [themeConfig])

  const loadThemeConfig = async () => {
    try {
      const response = await fetch('/api/themes/current')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setThemeConfig(data.data.config)
          setOriginalConfig(data.data.config)
        }
      }
    } catch (error) {
      console.error('Failed to load theme config:', error)
      showToast.error(t('loadConfigFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadThemePresets = async () => {
    try {
      const response = await fetch('/api/themes/presets')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPresets(data.data.presets)
        }
      }
    } catch (error) {
      console.error('Failed to load theme presets:', error)
    }
  }

  // 应用主题预设
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setThemeConfig(preset.config)
      showToast.success(`预设 "${preset.name}" 已应用`)
    }
  }

  // 保存主题配置
  const saveThemeConfig = async () => {
    try {
      const response = await fetch('/api/themes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: themeConfig })
      })

      if (response.ok) {
        showToast.success(t('configSaved'))
        setOriginalConfig(themeConfig)
      }
    } catch (error) {
      console.error('Failed to save theme config:', error)
      showToast.error(t('saveFailed'))
    }
  }

  // 重置主题配置
  const resetThemeConfig = () => {
    if (originalConfig) {
      setThemeConfig(originalConfig)
      showToast.success(t('configReset'))
    }
  }

  // 导出主题配置
  const exportThemeConfig = () => {
    const dataStr = JSON.stringify(themeConfig, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    
    const exportFileDefaultName = `${themeConfig.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // 导入主题配置
  const importThemeConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        setThemeConfig(config)
        showToast.success(t('configImported'))
      } catch (error) {
        console.error('Failed to parse theme config:', error)
        showToast.error(t('importFailed'))
      }
    }
    reader.readAsText(file)
  }

  // 生成CSS代码
  const generateCssCode = () => {
    const css = `:root {
  /* Colors */
  --color-primary: ${themeConfig.colors.primary};
  --color-secondary: ${themeConfig.colors.secondary};
  --color-accent: ${themeConfig.colors.accent};
  --color-background: ${themeConfig.colors.background};
  --color-foreground: ${themeConfig.colors.foreground};
  --color-muted: ${themeConfig.colors.muted};
  --color-muted-foreground: ${themeConfig.colors.mutedForeground};
  --color-border: ${themeConfig.colors.border};
  
  /* Fonts */
  --font-heading: ${themeConfig.fonts.heading}, sans-serif;
  --font-body: ${themeConfig.fonts.body}, sans-serif;
  --font-mono: ${themeConfig.fonts.mono}, monospace;
  
  /* Spacing */
  --container-width: ${themeConfig.spacing.containerWidth}px;
  --gap-small: ${themeConfig.spacing.gapSmall}px;
  --gap-medium: ${themeConfig.spacing.gapMedium}px;
  --gap-large: ${themeConfig.spacing.gapLarge}px;
  
  /* Border Radius */
  --radius-small: ${themeConfig.borderRadius.small}px;
  --radius-medium: ${themeConfig.borderRadius.medium}px;
  --radius-large: ${themeConfig.borderRadius.large}px;
  
  /* Shadows */
  --shadow-small: ${themeConfig.shadows.small};
  --shadow-medium: ${themeConfig.shadows.medium};
  --shadow-large: ${themeConfig.shadows.large};
  
  /* Animations */
  --animation-duration: ${themeConfig.animations.duration}ms;
}`

    setCssCode(css)
  }

  // 复制CSS代码
  const copyCssCode = async () => {
    try {
      await navigator.clipboard.writeText(cssCode)
      showToast.success(t('codeCopied'))
    } catch (error) {
      console.error('Failed to copy code:', error)
      showToast.error(t('copyFailed'))
    }
  }

  // 更新颜色配置
  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => {
    setThemeConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }))
  }

  // 更新字体配置
  const updateFont = (key: keyof ThemeConfig['fonts'], value: string) => {
    setThemeConfig(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [key]: value
      }
    }))
  }

  // 更新间距配置
  const updateSpacing = (key: keyof ThemeConfig['spacing'], value: number) => {
    setThemeConfig(prev => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        [key]: value
      }
    }))
  }

  // 更新圆角配置
  const updateBorderRadius = (key: keyof ThemeConfig['borderRadius'], value: number) => {
    setThemeConfig(prev => ({
      ...prev,
      borderRadius: {
        ...prev.borderRadius,
        [key]: value
      }
    }))
  }

  // 更新动画配置
  const updateAnimations = (key: keyof ThemeConfig['animations'], value: any) => {
    setThemeConfig(prev => ({
      ...prev,
      animations: {
        ...prev.animations,
        [key]: value
      }
    }))
  }

  // 渲染颜色选择器
  const renderColorPickers = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(themeConfig.colors).map(([key, value]) => (
        <div key={key}>
          <Label htmlFor={`color-${key}`} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: value }}
            />
            {t(`colors.${key}`)}
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id={`color-${key}`}
              type="color"
              value={value}
              onChange={(e) => updateColor(key as keyof ThemeConfig['colors'], e.target.value)}
              className="w-10 h-10 p-1"
            />
            <Input
              value={value}
              onChange={(e) => updateColor(key as keyof ThemeConfig['colors'], e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      ))}
    </div>
  )

  // 渲染字体选择器
  const renderFontSelectors = () => (
    <div className="space-y-4">
      {Object.entries(themeConfig.fonts).map(([key, value]) => (
        <div key={key}>
          <Label htmlFor={`font-${key}`}>{t(`fonts.${key}`)}</Label>
          <Select
            value={value}
            onValueChange={(val) => updateFont(key as keyof ThemeConfig['fonts'], val)}
          >
            <SelectTrigger id={`font-${key}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Lato">Lato</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Menlo">Menlo</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: value }}>
            {t('fontPreview')}
          </p>
        </div>
      ))}
    </div>
  )

  // 渲染间距和圆角配置
  const renderSpacingAndRadius = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">{t('spacing')}</h3>
        <div className="space-y-4">
          {Object.entries(themeConfig.spacing).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor={`spacing-${key}`}>{t(`spacing.${key}`)}</Label>
                <span className="text-sm">{value}px</span>
              </div>
              <Slider
                id={`spacing-${key}`}
                min={key === 'containerWidth' ? 800 : 0}
                max={key === 'containerWidth' ? 1600 : 48}
                step={key === 'containerWidth' ? 50 : 1}
                value={[value]}
                onValueChange={([val]: number[]) => updateSpacing(key as keyof ThemeConfig['spacing'], val)}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-4">{t('borderRadius')}</h3>
        <div className="space-y-4">
          {Object.entries(themeConfig.borderRadius).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor={`radius-${key}`}>{t(`borderRadius.${key}`)}</Label>
                <span className="text-sm">{value}px</span>
              </div>
              <Slider
                id={`radius-${key}`}
                min={0}
                max={24}
                step={1}
                value={[value]}
                onValueChange={([val]: number[]) => updateBorderRadius(key as keyof ThemeConfig['borderRadius'], val)}
              />
              <div 
                className="mt-2 h-10 bg-muted"
                style={{ borderRadius: `${value}px` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // 渲染动画配置
  const renderAnimations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="animations-enabled">{t('animations.enabled')}</Label>
        <Switch
          id="animations-enabled"
          checked={themeConfig.animations.enabled}
          onCheckedChange={(checked) => updateAnimations('enabled', checked)}
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="animations-duration">{t('animations.duration')}</Label>
          <span className="text-sm">{themeConfig.animations.duration}ms</span>
        </div>
        <Slider
          id="animations-duration"
          min={100}
          max={500}
          step={10}
          value={[themeConfig.animations.duration]}
          onValueChange={([val]: number[]) => updateAnimations('duration', val)}
          disabled={!themeConfig.animations.enabled}
        />
      </div>
    </div>
  )

  // 渲染主题预览
  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('livePreview')}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              {t('hidePreview')}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              {t('showPreview')}
            </>
          )}
        </Button>
      </div>
      
      {previewMode && (
        <div className="border rounded-lg p-6 space-y-6">
          <div>
            <h1 style={{ fontFamily: themeConfig.fonts.heading, color: themeConfig.colors.foreground }}>
              {t('previewHeading')}
            </h1>
            <p style={{ fontFamily: themeConfig.fonts.body, color: themeConfig.colors.mutedForeground }}>
              {t('previewSubheading')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              style={{
                backgroundColor: themeConfig.colors.primary,
                color: '#ffffff',
                borderRadius: `${themeConfig.borderRadius.medium}px`,
                transition: `all ${themeConfig.animations.duration}ms ease`
              }}
            >
              {t('primaryButton')}
            </Button>
            
            <Button
              style={{
                backgroundColor: themeConfig.colors.secondary,
                color: '#ffffff',
                borderRadius: `${themeConfig.borderRadius.medium}px`,
                transition: `all ${themeConfig.animations.duration}ms ease`
              }}
            >
              {t('secondaryButton')}
            </Button>
            
            <Button
              style={{
                backgroundColor: 'transparent',
                color: themeConfig.colors.primary,
                borderColor: themeConfig.colors.border,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: `${themeConfig.borderRadius.medium}px`,
                transition: `all ${themeConfig.animations.duration}ms ease`
              }}
            >
              {t('outlineButton')}
            </Button>
          </div>
          
          <div
            style={{
              backgroundColor: themeConfig.colors.muted,
              color: themeConfig.colors.mutedForeground,
              padding: `${themeConfig.spacing.gapMedium}px`,
              borderRadius: `${themeConfig.borderRadius.medium}px`,
              fontFamily: themeConfig.fonts.body
            }}
          >
            {t('previewText')}
          </div>
          
          <div
            style={{
              backgroundColor: themeConfig.colors.accent,
              color: '#ffffff',
              padding: `${themeConfig.spacing.gapMedium}px`,
              borderRadius: `${themeConfig.borderRadius.large}px`,
              fontFamily: themeConfig.fonts.body,
              boxShadow: themeConfig.shadows.medium
            }}
          >
            {t('accentBox')}
          </div>
        </div>
      )}
    </div>
  )

  // 渲染CSS代码
  const renderCssCode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('generatedCSS')}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyCssCode}
        >
          <Copy className="h-4 w-4 mr-2" />
          {t('copyCode')}
        </Button>
      </div>
      
      <div className="relative">
        <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-xs font-mono">
          {cssCode}
        </pre>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Paintbrush className="h-6 w-6" />
            {t('themeCustomizer')}
          </h1>
          <p className="text-muted-foreground">{t('themeCustomizerDescription')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={resetThemeConfig}
          >
            <Undo className="h-4 w-4 mr-2" />
            {t('reset')}
          </Button>
          
          <Button onClick={saveThemeConfig}>
            <Save className="h-4 w-4 mr-2" />
            {t('saveTheme')}
          </Button>
        </div>
      </div>

      {/* 主题名称和预设 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="theme-name">{t('themeName')}</Label>
          <Input
            id="theme-name"
            value={themeConfig.name}
            onChange={(e) => setThemeConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('themeNamePlaceholder')}
          />
        </div>
        
        <div>
          <Label htmlFor="theme-preset">{t('themePresets')}</Label>
          <Select onValueChange={applyPreset}>
            <SelectTrigger id="theme-preset">
              <SelectValue placeholder={t('selectPreset')} />
            </SelectTrigger>
            <SelectContent>
              {presets.map(preset => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 导入/导出按钮 */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={exportThemeConfig}>
          <Download className="h-4 w-4 mr-2" />
          {t('exportTheme')}
        </Button>
        
        <div className="relative">
          <input
            type="file"
            id="import-theme"
            className="absolute inset-0 opacity-0 w-full cursor-pointer"
            accept=".json"
            onChange={importThemeConfig}
          />
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {t('importTheme')}
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('colors')}
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            {t('typography')}
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            {t('layout')}
          </TabsTrigger>
          <TabsTrigger value="animations" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            {t('animations')}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t('preview')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          {renderColorPickers()}
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          {renderFontSelectors()}
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          {renderSpacingAndRadius()}
        </TabsContent>

        <TabsContent value="animations" className="space-y-6">
          {renderAnimations()}
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {renderPreview()}
          {renderCssCode()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
