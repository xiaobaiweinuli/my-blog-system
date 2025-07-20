'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  SkipBack,
  SkipForward,
  RefreshCw,
  Download,
  Share2,
  Subtitles,
  X,
  ChevronRight,
  Check
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface VideoSource {
  src: string
  type: string
  quality?: string
}

interface VideoTrack {
  src: string
  kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
  srclang: string
  label: string
  default?: boolean
}

interface VideoPlayerProps {
  sources: VideoSource[]
  poster?: string
  tracks?: VideoTrack[]
  title?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  preload?: 'auto' | 'metadata' | 'none'
  className?: string
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

export function VideoPlayer({
  sources,
  poster,
  tracks,
  title,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  preload = 'metadata',
  className,
  onEnded,
  onTimeUpdate
}: VideoPlayerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: '视频播放器',
      loading: '加载中...',
      error: '视频加载失败',
      videoError: '视频播放错误',
      play: '播放',
      pause: '暂停',
      mute: '静音',
      unmute: '取消静音',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      settings: '设置',
      quality: '画质',
      subtitles: '字幕',
      download: '下载',
      share: '分享',
      volume: '音量',
      progress: '进度',
      time: '时间',
      duration: '时长',
      auto: '自动',
      off: '关闭',
      on: '开启',
      high: '高清',
      medium: '标清',
      low: '流畅',
      shareSuccess: '分享成功',
      shareFailed: '分享失败',
      downloadSuccess: '下载成功',
      downloadFailed: '下载失败',
    }
    return translations[key] || key
  }
  const { showToast } = useToast()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuality, setSelectedQuality] = useState<string>('')
  const [selectedTrack, setSelectedTrack] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化视频
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      
      // 设置默认质量
      if (sources.length > 0 && sources[0].quality) {
        setSelectedQuality(sources[0].quality)
      }
      
      // 设置默认字幕
      if (tracks && tracks.length > 0) {
        const defaultTrack = tracks.find(track => track.default)
        if (defaultTrack) {
          setSelectedTrack(defaultTrack.srclang)
        }
      }
    }
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime, video.duration)
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    
    const handleError = () => {
      setError(t('videoError'))
      setIsLoading(false)
    }
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [onEnded, onTimeUpdate, sources, tracks, t])

  // 自动隐藏控制栏
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const handleMouseMove = () => {
      setShowControls(true)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }
    
    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false)
      }
    }
    
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isPlaying])

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 播放/暂停
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    
    setIsPlaying(!isPlaying)
  }

  // 静音/取消静音
  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // 调整音量
  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    
    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    
    if (newVolume === 0) {
      video.muted = true
      setIsMuted(true)
    } else if (isMuted) {
      video.muted = false
      setIsMuted(false)
    }
  }

  // 调整进度
  const handleProgressChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    
    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  // 切换全屏
  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        showToast.error(t('fullscreenError'))
      })
    } else {
      document.exitFullscreen()
    }
  }

  // 切换质量
  const changeQuality = (quality: string) => {
    const video = videoRef.current
    if (!video) return
    
    const currentTime = video.currentTime
    const wasPlaying = !video.paused
    
    const source = sources.find(s => s.quality === quality)
    if (source) {
      video.src = source.src
      video.currentTime = currentTime
      
      if (wasPlaying) {
        video.play()
      }
      
      setSelectedQuality(quality)
      setShowSettings(false)
    }
  }

  // 切换字幕
  const changeTrack = (lang: string) => {
    if (!tracks) return
    
    const video = videoRef.current
    if (!video) return
    
    // 禁用所有字幕
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'disabled'
    }
    
    // 启用选中的字幕
    if (lang !== 'off') {
      const trackIndex = tracks.findIndex(t => t.srclang === lang)
      if (trackIndex !== -1) {
        video.textTracks[trackIndex].mode = 'showing'
      }
    }
    
    setSelectedTrack(lang)
    setShowSettings(false)
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 下载视频
  const downloadVideo = () => {
    const video = videoRef.current
    if (!video || !video.src) return
    
    const a = document.createElement('a')
    a.href = video.src
    a.download = title || 'video'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 分享视频
  const shareVideo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || t('video'),
          text: t('checkOutVideo'),
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        showToast.success(t('linkCopied'))
      } catch (error) {
        console.error('Failed to copy link:', error)
        showToast.error(t('copyFailed'))
      }
    }
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-black rounded-lg",
        isFullscreen ? "fixed inset-0 z-50" : "w-full",
        className
      )}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        preload={preload}
        playsInline
        onClick={togglePlay}
      >
        {sources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        
        {tracks?.map((track, index) => (
          <track
            key={index}
            src={track.src}
            kind={track.kind}
            srcLang={track.srclang}
            label={track.label}
            default={track.default}
          />
        ))}
        
        {t('browserNotSupported')}
      </video>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <RefreshCw className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">{t('errorOccurred')}</h3>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      )}

      {/* 播放按钮覆盖层 */}
      {!isPlaying && !isLoading && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
      )}

      {/* 控制栏 */}
      {controls && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showControls ? 1 : 0,
            y: showControls ? 0 : 20
          }}
          transition={{ duration: 0.2 }}
        >
          {/* 进度条 */}
          <div className="mb-2">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.01}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 播放/暂停按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              {/* 快退/快进按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime -= 10
                  }
                }}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime += 10
                  }
                }}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              
              {/* 音量控制 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="w-20 hidden sm:block">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
              
              {/* 时间显示 */}
              <div className="text-xs text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 字幕按钮 */}
              {tracks && tracks.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-1 h-auto"
                    >
                      <Subtitles className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs">
                    <DialogHeader>
                      <DialogTitle>{t('subtitles')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 pt-4">
                      <div
                        className={cn(
                          "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted",
                          selectedTrack === 'off' && "bg-muted"
                        )}
                        onClick={() => changeTrack('off')}
                      >
                        <span>{t('off')}</span>
                        {selectedTrack === 'off' && <Check className="h-4 w-4" />}
                      </div>
                      
                      {tracks.map((track, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted",
                            selectedTrack === track.srclang && "bg-muted"
                          )}
                          onClick={() => changeTrack(track.srclang)}
                        >
                          <span>{track.label}</span>
                          {selectedTrack === track.srclang && <Check className="h-4 w-4" />}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* 质量选择 */}
              {sources.length > 1 && sources[0].quality && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-1 h-auto"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs">
                    <DialogHeader>
                      <DialogTitle>{t('quality')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 pt-4">
                      {sources
                        .filter(source => source.quality)
                        .map((source, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted",
                              selectedQuality === source.quality && "bg-muted"
                            )}
                            onClick={() => changeQuality(source.quality!)}
                          >
                            <span>{source.quality}</span>
                            {selectedQuality === source.quality && <Check className="h-4 w-4" />}
                          </div>
                        ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* 下载按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadVideo}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <Download className="h-5 w-5" />
              </Button>
              
              {/* 分享按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={shareVideo}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              
              {/* 全屏按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
