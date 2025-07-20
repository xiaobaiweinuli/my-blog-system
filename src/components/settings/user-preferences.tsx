'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Palette, 
  Globe, 
  Bell, 
  Eye, 
  Monitor,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Smartphone,
  Save,
  RotateCcw
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  reducedMotion: boolean
  soundEnabled: boolean
  notifications: {
    comments: boolean
    likes: boolean
    mentions: boolean
    newsletter: boolean
  }
  display: {
    showReadingTime: boolean
    showWordCount: boolean
    compactMode: boolean
    autoNightMode: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowAnalytics: boolean
    shareReadingHistory: boolean
  }
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  fontSize: 16,
  reducedMotion: false,
  soundEnabled: true,
  notifications: {
    comments: true,
    likes: true,
    mentions: true,
    newsletter: false,
  },
  display: {
    showReadingTime: true,
    showWordCount: false,
    compactMode: false,
    autoNightMode: false,
  },
  privacy: {
    showOnlineStatus: true,
    allowAnalytics: true,
    shareReadingHistory: false,
  },
}

export function UserPreferences() {
  // 检查是否有国际化上下文
  const t = {
    title: '用户偏好设置',
    subtitle: '自定义您的使用体验',
    save: '保存',
    reset: '重置',
    saved: '设置已保存',
    error: '保存失败',
    preferences: {
      title: '偏好设置',
      description: '自定义您的使用体验',
      save: '保存设置',
      saving: '保存中...',
      saved: '设置已保存',
      saveError: '保存失败',
      reset: '重置设置',
      appearance: {
        title: '外观',
        description: '自定义界面外观',
        theme: '主题'
      }
    },
    theme: {
      light: '浅色',
      dark: '深色',
      system: '系统'
    },
    display: {
      title: '显示选项',
      showReadingTime: '显示阅读时间',
      showReadingTimeDesc: '在文章底部显示阅读时间',
      compactMode: '紧凑模式',
      compactModeDesc: '减少文章列表的间距和字体大小',
      reducedMotion: '减少动画',
      reducedMotionDesc: '减少页面加载和交互时的动画效果',
    },
    notifications: {
      title: '通知设置',
      description: '自定义您的通知偏好',
      comments: '评论通知',
      commentsDesc: '当您收到新的评论时接收通知',
      likes: '点赞通知',
      likesDesc: '当您收到新的点赞时接收通知',
      soundEnabled: '声音通知',
      soundEnabledDesc: '启用声音通知',
    },
    fontSize: '字体大小',
  }
  
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 加载用户偏好设置
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.error('Failed to parse user preferences:', error)
      }
    }
  }, [])

  // 监听偏好设置变化
  useEffect(() => {
    const currentPrefs = JSON.stringify(preferences)
    const defaultPrefs = JSON.stringify(defaultPreferences)
    setHasChanges(currentPrefs !== defaultPrefs)
  }, [preferences])

  // 更新偏好设置
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  // 更新嵌套偏好设置
  const updateNestedPreference = <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof typeof prev] as any),
        [key]: value,
      },
    }))
  }

  // 保存偏好设置
  const savePreferences = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
      
      // 应用主题设置
      if (preferences.theme !== theme) {
        setTheme(preferences.theme)
      }

      // 应用字体大小
      document.documentElement.style.fontSize = `${preferences.fontSize}px`

      // 应用减少动画设置
      if (preferences.reducedMotion) {
        document.documentElement.style.setProperty('--motion-reduce', '1')
      } else {
        document.documentElement.style.removeProperty('--motion-reduce')
      }

      showToast.success(t.saved)
      setHasChanges(false)
    } catch (error) {
      showToast.error(t.error)
    } finally {
      setIsSaving(false)
    }
  }

  // 重置偏好设置
  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    localStorage.removeItem('userPreferences')
    showToast.info(t.reset)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            {t.preferences.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.preferences.description}
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={resetPreferences}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t.reset}
            </Button>
            <Button
              onClick={savePreferences}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? t.preferences.saving : t.save}
            </Button>
          </div>
        )}
      </div>

      {/* 外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t.preferences.appearance.title}
          </CardTitle>
          <CardDescription>
            {t.preferences.appearance.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 主题设置 */}
          <div className="space-y-2">
            <Label>{t.preferences.appearance.theme}</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => 
                updatePreference('theme', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {t.theme.light}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {t.theme.dark}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t.theme.system}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 字体大小 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t.fontSize}</Label>
              <Badge variant="secondary">{preferences.fontSize}px</Badge>
            </div>
            <Slider
              value={[preferences.fontSize]}
              onValueChange={([value]: number[]) => updatePreference('fontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* 显示选项 */}
          <div className="space-y-4">
            <Label>{t.display.title}</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">
                    {t.display.showReadingTime}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.display.showReadingTimeDesc}
                  </p>
                </div>
                <Switch
                  checked={preferences.display.showReadingTime}
                  onCheckedChange={(checked) =>
                    updateNestedPreference('display', 'showReadingTime', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">
                    {t.display.compactMode}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.display.compactModeDesc}
                  </p>
                </div>
                <Switch
                  checked={preferences.display.compactMode}
                  onCheckedChange={(checked) =>
                    updateNestedPreference('display', 'compactMode', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">
                    {t.display.reducedMotion}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.display.reducedMotionDesc}
                  </p>
                </div>
                <Switch
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) =>
                    updatePreference('reducedMotion', checked)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.notifications.title}
          </CardTitle>
          <CardDescription>
            {t.notifications.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">
                {t.notifications.comments}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.notifications.commentsDesc}
              </p>
            </div>
            <Switch
              checked={preferences.notifications.comments}
              onCheckedChange={(checked) =>
                updateNestedPreference('notifications', 'comments', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">
                {t.notifications.likes}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.notifications.likesDesc}
              </p>
            </div>
            <Switch
              checked={preferences.notifications.likes}
              onCheckedChange={(checked) =>
                updateNestedPreference('notifications', 'likes', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">
                {t.notifications.soundEnabled}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.notifications.soundEnabledDesc}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preferences.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) =>
                  updatePreference('soundEnabled', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
