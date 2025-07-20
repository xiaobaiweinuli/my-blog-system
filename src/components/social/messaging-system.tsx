'use client'

import { useState, useEffect, useRef } from 'react'
import { formatTime } from '@/lib/utils/time'
// import { AnimatePresence } from 'framer-motion' // 暂时未使用
import {
  MessageCircle,
  Send,
  Search,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Image,
  Paperclip,
  Smile,
  Check,
  CheckCheck
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  conversationId: string
  type: 'text' | 'image' | 'file'
  attachments?: {
    id: string
    name: string
    url: string
    type: string
    size: number
  }[]
  createdAt: string
  readAt?: string
  editedAt?: string
  replyTo?: {
    id: string
    content: string
    sender: string
  }
}

interface Conversation {
  id: string
  participants: {
    id: string
    username: string
    displayName: string
    avatar?: string
    isOnline?: boolean
    lastSeen?: string
  }[]
  lastMessage?: Message
  unreadCount: number
  isArchived: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

interface MessagingSystemProps {
  currentUserId: string
  selectedConversationId?: string
  onConversationSelect?: (conversationId: string) => void
  className?: string
}

export function MessagingSystem({
  currentUserId,
  selectedConversationId,
  onConversationSelect,
  className
}: MessagingSystemProps) {
  const { showToast } = useToast()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载对话列表
  useEffect(() => {
    loadConversations()
  }, [])

  // 加载选中对话的消息
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
      markConversationAsRead(selectedConversationId)
    }
  }, [selectedConversationId])

  // 滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConversations(data.data.conversations || [])
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.data.messages || [])
          const conversation = conversations.find(c => c.id === conversationId)
          setSelectedConversation(conversation || null)
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      senderId: currentUserId,
      receiverId: selectedConversation?.participants.find(p => p.id !== currentUserId)?.id || '',
      conversationId: selectedConversationId,
      type: 'text',
      createdAt: new Date().toISOString(),
      replyTo: replyTo ? {
        id: replyTo.id,
        content: replyTo.content,
        sender: replyTo.senderId
      } : undefined
    }

    // 乐观更新
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')
    setReplyTo(null)
    scrollToBottom()

    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          type: 'text',
          replyTo: replyTo?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // 替换临时消息
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessage.id ? data.data.message : msg
          ))
          
          // 更新对话列表
          await loadConversations()
        }
      } else {
        // 移除失败的消息
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        showToast.error('发送消息失败')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      showToast.error('发送消息失败')
    }
  }

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT'
      })
      
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFileUpload = async (files: FileList) => {
    if (!selectedConversationId) return

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', selectedConversationId)

      try {
        const response = await fetch('/api/conversations/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setMessages(prev => [...prev, data.data.message])
            await loadConversations()
          }
        }
      } catch (error) {
        console.error('Failed to upload file:', error)
        showToast.error('上传失败')
      }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== currentUserId) return null
    
    if (message.readAt) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
    return <Check className="h-3 w-3 text-muted-foreground" />
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    return conv.participants.some(p => 
      p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className={cn("flex h-[600px] border rounded-lg overflow-hidden", className)}>
      {/* 对话列表 */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">消息</h2>
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索对话"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => {
                  onConversationSelect?.(conversation.id)
                  loadMessages(conversation.id)
                }}
              />
            ))}
            
            {filteredConversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? '未找到对话' : '暂无对话'}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* 对话头部 */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.participants.find(p => p.id !== currentUserId)?.avatar} />
                    <AvatarFallback>
                      {selectedConversation.participants.find(p => p.id !== currentUserId)?.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium">
                      {selectedConversation.participants.find(p => p.id !== currentUserId)?.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.participants.find(p => p.id !== currentUserId)?.isOnline 
                        ? '在线' 
                        : '最后在线 ' + formatTime(selectedConversation.participants.find(p => p.id !== currentUserId)?.lastSeen || '')
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 消息列表 */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    showAvatar={
                      index === 0 || 
                      messages[index - 1].senderId !== message.senderId
                    }
                    participants={selectedConversation.participants}
                    onReply={() => setReplyTo(message)}
                  />
                ))}
                
                {isTyping && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    正在输入...
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* 回复预览 */}
            {replyTo && (
              <div className="px-4 py-2 bg-muted/50 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      回复 {selectedConversation.participants.find(p => p.id === replyTo.senderId)?.displayName}
                    </p>
                    <p className="text-sm truncate">{replyTo.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                  >
                    <span className="h-4 w-4">×</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 消息输入 */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息"
                    className="min-h-[40px] max-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                </div>
                
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">请选择对话</h3>
              <p className="text-sm text-muted-foreground">
                请从左侧选择一个对话开始聊天
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 对话项组件
function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick
}: {
  conversation: Conversation
  currentUserId: string
  isSelected: boolean
  onClick: () => void
}) {
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId)
  
  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar>
            <AvatarImage src={otherParticipant?.avatar} />
            <AvatarFallback>
              {otherParticipant?.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {otherParticipant?.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium truncate">
              {otherParticipant?.displayName}
            </h4>
            {conversation.lastMessage && (
              <span className="text-xs text-muted-foreground">
                {formatTime(conversation.lastMessage.createdAt)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate">
              {conversation.lastMessage?.content || '暂无消息'}
            </p>
            {conversation.unreadCount > 0 && (
              <Badge variant="default" className="text-xs">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 消息气泡组件
function MessageBubble({
  message,
  isOwn,
  showAvatar,
  participants,
  onReply
}: {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  participants: any[]
  onReply: () => void
}) {
  const sender = participants.find(p => p.id === message.senderId)

  // 获取消息状态图标
  const getMessageStatus = (message: Message) => {
    if (message.readAt) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
    return <Check className="h-3 w-3 text-muted-foreground" />
  }
  
  return (
    <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback>
            {sender?.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col", isOwn && "items-end")}>
        {message.replyTo && (
          <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted rounded border-l-2 border-primary">
            <p className="font-medium">回复 {message.replyTo.sender}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}
        
        <div
          className={cn(
            "max-w-xs lg:max-w-md px-3 py-2 rounded-lg",
            isOwn 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}
        >
          {message.type === 'text' ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : message.type === 'image' ? (
            <div className="space-y-2">
              {message.attachments?.map((attachment) => (
                <img
                  key={attachment.id}
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-full rounded mx-auto block"
                />
              ))}
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {message.attachments?.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/10 rounded">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {getMessageStatus(message)}
          {message.editedAt && (
            <span className="text-xs text-muted-foreground">
              已编辑
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
