'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  RefreshCw,
  Download,
  Share2,
  Music,
  Repeat,
  Shuffle,
  RotateCcw,
  RotateCw,
  ListMusic,
  X,
  Clock
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { getRandomNumber } from '@/lib/utils'

interface AudioTrack {
  src: string
  title: string
  artist?: string
  album?: string
  artwork?: string
  duration?: number
}

interface AudioPlayerProps {
  tracks: AudioTrack[]
  initialTrackIndex?: number
  autoplay?: boolean
  loop?: boolean
  showPlaylist?: boolean
  showArtwork?: boolean
  variant?: 'default' | 'minimal' | 'compact'
  className?: string
  onTrackChange?: (track: AudioTrack, index: number) => void
  onEnded?: () => void
}

export function AudioPlayer({
  tracks,
  initialTrackIndex = 0,
  autoplay = false,
  loop = false,
  showPlaylist = true,
  showArtwork = true,
  variant = 'default',
  className,
  onTrackChange,
  onEnded
}: AudioPlayerProps) {
  // 中文静态文本
  const t = (key: string) => {
    const translations: Record<string, string> = {
      play: '播放',
      pause: '暂停',
      next: '下一首',
      previous: '上一首',
      volume: '音量',
      mute: '静音',
      unmute: '取消静音',
      shuffle: '随机播放',
      repeat: '循环播放',
      repeatOne: '单曲循环',
      playlist: '播放列表',
      nowPlaying: '正在播放',
      linkCopied: '链接已复制',
      copyFailed: '复制失败',
      audioError: '音频加载失败',
      playbackError: '播放失败',
      download: '下载',
      share: '分享',
      time: '时间',
      duration: '时长',
      track: '曲目',
      artist: '艺术家',
      album: '专辑',
      unknown: '未知',
      shareSuccess: '分享成功',
      shareFailed: '分享失败',
      downloadSuccess: '下载成功',
      downloadFailed: '下载失败',
    }
    return translations[key] || key
  }
  
  const { showToast } = useToast()
  
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [isLooping, setIsLooping] = useState(loop)
  const [isShuffling, setIsShuffling] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTrack = tracks[currentTrackIndex]

  // 初始化音频
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    
    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0
        audio.play()
      } else {
        playNextTrack()
        onEnded?.()
      }
    }
    
    const handleError = () => {
      setError(t('audioError'))
      setIsLoading(false)
    }
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [isLooping, onEnded, t])

  // 更新媒体会话
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || '',
        album: currentTrack.album || '',
        artwork: currentTrack.artwork ? [{ src: currentTrack.artwork }] : []
      })
      
      navigator.mediaSession.setActionHandler('play', () => togglePlay())
      navigator.mediaSession.setActionHandler('pause', () => togglePlay())
      navigator.mediaSession.setActionHandler('previoustrack', () => playPreviousTrack())
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack())
    }
  }, [currentTrack])

  // 切换曲目时重置状态
  useEffect(() => {
    setIsLoading(true)
    setCurrentTime(0)
    setError(null)
    
    if (autoplay) {
      const audio = audioRef.current
      if (audio) {
        audio.play().catch(() => {
          setIsPlaying(false)
        })
      }
    }
    
    onTrackChange?.(currentTrack, currentTrackIndex)
  }, [currentTrackIndex, currentTrack, autoplay, onTrackChange])

  // 播放/暂停
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {
        setIsPlaying(false)
        showToast.error(t('playbackError'))
      })
    }
    
    setIsPlaying(!isPlaying)
  }

  // 静音/取消静音
  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // 调整音量
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    
    if (newVolume === 0) {
      audio.muted = true
      setIsMuted(true)
    } else if (isMuted) {
      audio.muted = false
      setIsMuted(false)
    }
  }

  // 调整进度
  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  // 播放上一曲
  const playPreviousTrack = () => {
    if (isShuffling) {
      const randomIndex = getRandomNumber(0, tracks.length - 1)
      setCurrentTrackIndex(randomIndex)
    } else {
      setCurrentTrackIndex(prev => (prev === 0 ? tracks.length - 1 : prev - 1))
    }
  }

  // 播放下一曲
  const playNextTrack = () => {
    if (isShuffling) {
      const randomIndex = getRandomNumber(0, tracks.length - 1)
      setCurrentTrackIndex(randomIndex)
    } else {
      setCurrentTrackIndex(prev => (prev === tracks.length - 1 ? 0 : prev + 1))
    }
  }

  // 切换循环模式
  const toggleLoop = () => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.loop = !isLooping
    setIsLooping(!isLooping)
  }

  // 切换随机播放
  const toggleShuffle = () => {
    setIsShuffling(!isShuffling)
  }

  // 调整播放速度
  const changePlaybackRate = (direction: 'increase' | 'decrease') => {
    const audio = audioRef.current
    if (!audio) return
    
    let newRate = playbackRate
    
    if (direction === 'increase') {
      newRate = Math.min(2, playbackRate + 0.25)
    } else {
      newRate = Math.max(0.5, playbackRate - 0.25)
    }
    
    audio.playbackRate = newRate
    setPlaybackRate(newRate)
    showToast.success(`${t('playbackSpeed')}: ${newRate.toFixed(2)}`)
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 下载音频
  const downloadAudio = () => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    
    const a = document.createElement('a')
    a.href = audio.src
    a.download = currentTrack.title || 'audio'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 分享音频
  const shareAudio = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: currentTrack.artist ? `${currentTrack.title} - ${currentTrack.artist}` : currentTrack.title,
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

  // 渲染紧凑型播放器
  const renderCompactPlayer = () => (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        className="p-1 h-auto"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{currentTrack.title}</div>
        {currentTrack.artist && (
          <div className="text-xs text-muted-foreground truncate">{currentTrack.artist}</div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  )

  // 渲染最小型播放器
  const renderMinimalPlayer = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{currentTrack.title}</div>
          {currentTrack.artist && (
            <div className="text-xs text-muted-foreground truncate">{currentTrack.artist}</div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={playPreviousTrack}
            className="p-1 h-auto"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            className="p-1 h-auto"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={playNextTrack}
            className="p-1 h-auto"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground">
          {formatTime(currentTime)}
        </div>
        
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.01}
          onValueChange={handleProgressChange}
          className="flex-1"
        />
        
        <div className="text-xs text-muted-foreground">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  )

  // 渲染默认播放器
  const renderDefaultPlayer = () => (
    <div className="space-y-4">
      {/* 专辑封面和信息 */}
      {showArtwork && (
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {currentTrack.artwork ? (
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{currentTrack.title}</h3>
            {currentTrack.artist && (
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
            )}
            {currentTrack.album && (
              <p className="text-xs text-muted-foreground truncate">{currentTrack.album}</p>
            )}
          </div>
        </div>
      )}
      
      {/* 进度条 */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.01}
          onValueChange={handleProgressChange}
        />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShuffle}
            className={cn(
              "p-1 h-auto",
              isShuffling && "text-primary"
            )}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changePlaybackRate('decrease')}
            className="p-1 h-auto"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={playPreviousTrack}
            className="p-1 h-auto"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="rounded-full h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={playNextTrack}
            className="p-1 h-auto"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changePlaybackRate('increase')}
            className="p-1 h-auto"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLoop}
            className={cn(
              "p-1 h-auto",
              isLooping && "text-primary"
            )}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 额外控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="p-1 h-auto"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <div className="w-24">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadAudio}
            className="p-1 h-auto"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={shareAudio}
            className="p-1 h-auto"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          {showPlaylist && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlaylistPanel(!showPlaylistPanel)}
              className={cn(
                "p-1 h-auto",
                showPlaylistPanel && "text-primary"
              )}
            >
              <ListMusic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* 播放速度指示器 */}
      {playbackRate !== 1 && (
        <div className="text-xs text-center text-muted-foreground">
          <Clock className="h-3 w-3 inline-block mr-1" />
          {`${t('playbackSpeed')}: ${playbackRate.toFixed(2)}`}
        </div>
      )}
    </div>
  )

  // 渲染播放列表
  const renderPlaylist = () => {
    if (!showPlaylist || !showPlaylistPanel) return null
    
    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">{t('playlist')}</h3>
          <div className="text-xs text-muted-foreground">
            {currentTrackIndex + 1} / {tracks.length}
          </div>
        </div>
        
        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
          {tracks.map((track, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted",
                index === currentTrackIndex && "bg-muted"
              )}
              onClick={() => setCurrentTrackIndex(index)}
            >
              <div className="flex-shrink-0 w-6 text-center text-xs text-muted-foreground">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{track.title}</div>
                {track.artist && (
                  <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {track.duration ? formatTime(track.duration) : '--:--'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className={cn(
        "p-4",
        variant === 'compact' && "p-0"
      )}>
        {/* 音频元素 */}
        <audio
          ref={audioRef}
          src={currentTrack.src}
          autoPlay={autoplay}
          loop={isLooping}
          preload="metadata"
        />

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="flex items-center justify-center py-4 text-center">
            <div>
              <X className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* 根据变体渲染不同的播放器 */}
        {!isLoading && !error && (
          <>
            {variant === 'compact' && renderCompactPlayer()}
            {variant === 'minimal' && renderMinimalPlayer()}
            {variant === 'default' && renderDefaultPlayer()}
            {renderPlaylist()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
