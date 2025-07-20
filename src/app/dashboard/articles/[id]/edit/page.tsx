'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArticleEditor } from '@/components/article/article-editor'
import { articlesAPI } from '@/lib/api/articles'
import { transformArticleFromAPI } from '@/lib/api/articles'
import type { Article, User } from '@/types'

export default function EditArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [article, setArticle] = useState<Article | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 获取文章数据和用户信息
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // 获取用户信息
        let userInfo: User | null = null
        const cacheStr = localStorage.getItem('global_session_cache')
        if (cacheStr) {
          try {
            const cache = JSON.parse(cacheStr)
            userInfo = cache?.user || null
          } catch (e) {
            console.error('解析用户缓存失败:', e)
          }
        }
        
        if (!userInfo) {
          setError('用户未登录')
          router.push('/auth/login')
          return
        }
        
        setUser(userInfo)

        // 获取文章详情
        const articleId = params.id as string
        if (!articleId) {
          setError('文章ID无效')
          return
        }

        const response = await articlesAPI.getArticleBySlug(articleId)
        
        if (response.success && response.data) {
          // 转换API数据为前端格式
          const transformedArticle = transformArticleFromAPI(response.data)
          setArticle(transformedArticle)
        } else {
          setError(response.error || '获取文章失败')
        }
      } catch (error) {
        console.error('获取文章失败:', error)
        setError('网络错误或服务器异常')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  // 处理保存和发布
  const handleSave = async (articleData: Partial<Article>) => {
    if (!article || !user) {
      return { success: false, error: '文章或用户信息无效' }
    }

    try {
      const updateData = {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        category: articleData.category,
        tags: articleData.tags,
        status: articleData.status,
        cover_image: articleData.coverImage,
      }

      const response = await articlesAPI.updateArticle(article.id, updateData)
      
      if (response.success) {
        // 更新本地文章数据
        setArticle(prev => prev ? { ...prev, ...response.data } : null)
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('保存文章失败:', error)
      return { success: false, error: '保存失败' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载文章数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">加载失败</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/articles')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回文章列表
          </Button>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">文章不存在</h2>
          <p className="mt-2 text-muted-foreground">无法找到请求的文章</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/articles')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回文章列表
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">需要登录</h2>
          <p className="mt-2 text-muted-foreground">请先登录后再编辑文章</p>
          <Button className="mt-4" onClick={() => router.push('/auth/login')}>
            去登录
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">编辑文章</h1>
        <p className="text-muted-foreground">
          编辑文章内容、分类、标签等信息
        </p>
      </div>
      
      <ArticleEditor 
        user={user} 
        articleId={article.id}
        initialData={article}
        onSave={handleSave}
      />
    </div>
  )
}