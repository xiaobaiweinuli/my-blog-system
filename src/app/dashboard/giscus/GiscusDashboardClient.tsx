 'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface GiscusStats {
  success: boolean
  comment_count: number
  reply_count: number
  like_count: number
  reaction_summary: Record<string, number>
  discussion_reactions: Record<string, number>
  user_count: number
  users: Array<{
    login: string
    avatarUrl: string
    url: string
    comment_count: number
    comments: string[]
    reactions: Record<string, number>
  }>
  comments: Array<{
    id: string
    body: string
    author: { login: string, avatarUrl: string, url: string }
    created_at: string
    reactions: Record<string, number>
  }>
}

export default function GiscusDashboardClient() {
  const [stats, setStats] = useState<GiscusStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, commentId: string | null }>({ open: false, commentId: null })
  // 可选：支持参数输入
  // discussion_number、mapping、term 已移除，mapping 默认 title
  const [repo, setRepo] = useState('')
  const [first, setFirst] = useState('')
  const [after, setAfter] = useState('')
  const [titles, setTitles] = useState<{ number: number, title: string }[]>([])
  const [titlesLoading, setTitlesLoading] = useState(false)
  const [titlesError, setTitlesError] = useState<string | null>(null)
  const [endCursor, setEndCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  // 拉取统计数据
  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // if (term) params.append('term', term) // Removed term from params
      params.append('mapping', 'title')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/giscus/stats?${params.toString()}`)
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError('加载失败')
    }
    setLoading(false)
  }

  // 获取所有文章标题
  const fetchTitles = async (append = false) => {
    setTitlesLoading(true)
    setTitlesError(null)
    try {
      const params = new URLSearchParams()
      if (repo) params.append('repo', repo)
      if (first) params.append('first', first)
      if (after) params.append('after', after)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/giscus/all-titles?${params.toString()}`)
      const data = await res.json()
      setTitles(t => append ? [...t, ...(data.discussions || [])] : (data.discussions || []))
      setEndCursor(data.endCursor || null)
      setHasNextPage(!!data.hasNextPage)
    } catch {
      setTitlesError('加载失败')
    }
    setTitlesLoading(false)
  }

  // 新增 fetchStatsWithTerm 方法，支持传入 term
  // 支持点击标题时直接查询
  const fetchStatsWithTerm = async (t: string) => {
    setError(null)
    try {
      const params = new URLSearchParams()
      if (t) params.append('term', t)
      params.append('mapping', 'title')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/giscus/stats?${params.toString()}`)
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError('加载失败')
    }
  }

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line
  }, [])

  // 删除评论
  const handleDelete = async (commentId: string) => {
    // 这里需要 repo 信息，建议全局配置或页面输入
    const repo = prompt('请输入仓库（owner/repo）：')
    if (!repo) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/giscus/delete-comment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, comment_id: commentId }),
      })
      setDeleteDialog({ open: false, commentId: null })
      fetchStats()
    } catch {
      alert('删除失败')
    }
  }

  // 表情符号映射
  const reactionEmojiMap: Record<string, string> = {
    THUMBS_UP: '👍',
    THUMBS_DOWN: '👎',
    LAUGH: '😄',
    HOORAY: '🎉',
    CONFUSED: '😕',
    HEART: '❤️',
    ROCKET: '🚀',
    EYES: '👀',
  }

  if (error) return <div>{error}</div>
  if (!stats) return <div>无数据</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h1 className="text-3xl font-bold mb-2">Giscus评论统计</h1>
          <div>评论数：{stats.comment_count}</div>
          <div>回复数：{stats.reply_count}</div>
          <div>点赞数：{stats.like_count}</div>
          <div>用户数：{stats.user_count}</div>
          <div>主楼表情：{(() => {
            const arr = Object.entries(stats.discussion_reactions || {}).filter(([_, v]) => v > 0)
            return arr.length > 0 ? arr.map(([k, v]) => `${reactionEmojiMap[k] || k}: ${v}`).join(', ') : null
          })()}</div>
          <div>全部表情统计：{(() => {
            const arr = Object.entries(stats.reaction_summary || {}).filter(([_, v]) => v > 0)
            return arr.length > 0 ? arr.map(([k, v]) => `${reactionEmojiMap[k] || k}: ${v}`).join(', ') : null
          })()}</div>
        </CardContent>
      </Card>
      {/* 参数输入区，可选 */}
      <Card>
        <CardContent>
          <div className="flex gap-2 items-end mb-2">
            <Button onClick={() => fetchTitles(false)}>获取所有文章标题</Button>
          </div>
        </CardContent>
      </Card>
      {/* 新增：所有文章标题列表 */}
      <Card>
        <CardContent>
          {titlesLoading && <div>加载中...</div>}
          {titlesError && <div className="text-red-500">{titlesError}</div>}
          {titles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">所有文章</h2>
              <ul className="list-disc pl-5">
                {titles.map(d => (
                  <li key={d.number}>
                    <button
                      className="hover:underline text-left"
                      style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', font: 'inherit' }}
                      onClick={() => { fetchStatsWithTerm(d.title); }}
                    >
                      #{d.number} - {d.title}
                    </button>
                  </li>
                ))}
              </ul>
              {hasNextPage && (
                <Button className="mt-2" onClick={() => { setAfter(endCursor || ''); fetchTitles(true) }}>加载更多</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* 用户列表 */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">用户详情</h2>
          <div className="grid gap-2">
            {(stats.users || []).map(user => (
              <div key={user.login} className="flex items-center gap-4 border-b py-2">
                <img src={user.avatarUrl} width={32} height={32} className="rounded-full" />
                <a href={user.url} target="_blank" rel="noopener noreferrer" className="font-bold">{user.login}</a>
                <span>评论数：{user.comment_count}</span>
                <span>
                  表情：
                  {(() => {
                    const arr = Object.entries(user.reactions || {}).filter(([_, v]) => v > 0)
                    return arr.length > 0 ? arr.map(([k, v]) => `${reactionEmojiMap[k] || k}: ${v}`).join(', ') : null
                  })()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* 评论列表 */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">评论详情</h2>
          <div className="grid gap-2">
            {(stats.comments || []).map(comment => (
              <div key={comment.id} className="border-b py-2">
                <div className="flex items-center gap-2">
                  <img src={comment.author.avatarUrl} width={24} height={24} className="rounded-full" />
                  <a href={comment.author.url} target="_blank" rel="noopener noreferrer">{comment.author.login}</a>
                  <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div className="my-1 whitespace-pre-line text-base font-normal">
                  {comment.body}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {(() => {
                    const user = (stats.users || []).find(u => u.login === comment.author.login);
                    if (user && (user.comments || []).length > 0) {
                      return (
                        <>
                          {user.comments.map((c, idx) => (
                            <span key={idx} className="text-base font-normal text-black">评论：{c}</span>
                          ))}
                        </>
                      );
                    }
                    return null;
                  })()}
                  <span className="text-base font-normal text-black">
                    {(() => {
                      const arr = Object.entries(comment.reactions || {}).filter(([_, v]) => v > 0)
                      return arr.length > 0 ? arr.map(([k, v]) => `${reactionEmojiMap[k] || k}: ${v}`).join(', ') : null
                    })()}
                  </span>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ open: true, commentId: comment.id })}>删除</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除评论？</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => deleteDialog.commentId && handleDelete(deleteDialog.commentId)}>确认</Button>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, commentId: null })}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
