"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const changefreqOptions = [
  { value: 'always', label: 'always（总是，内容变化非常频繁）' },
  { value: 'hourly', label: 'hourly（每小时）' },
  { value: 'daily', label: 'daily（每天）' },
  { value: 'weekly', label: 'weekly（每周）' },
  { value: 'monthly', label: 'monthly（每月）' },
  { value: 'yearly', label: 'yearly（每年）' },
  { value: 'never', label: 'never（从不，内容基本不变）' },
]

export default function SitemapAdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [genResult, setGenResult] = useState('')
  const [configEdit, setConfigEdit] = useState<any>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [statsRes, filesRes, configRes] = await Promise.all([
        fetch('/api/sitemap/stats').then(r => r.json()),
        fetch('/api/sitemap/files').then(r => r.json()),
        fetch('/api/sitemap/config').then(r => r.json()),
      ])
      setStats(statsRes.data)
      setFiles(filesRes.data || filesRes.data?.data || [])
      setConfig(configRes.data)
      setConfigEdit(configRes.data ? { ...configRes.data } : null)
      setLoading(false)
    }
    fetchAll()
  }, [])

  async function handleGenerate() {
    setGenResult('生成中...')
    const res = await fetch('/api/sitemap/generate', { method: 'POST' })
    const data = await res.json()
    setGenResult(data.success ? '生成成功！' : '生成失败')
  }

  function handleArrayInputChange(field: string, value: string) {
    setConfigEdit((c: any) => ({
      ...c,
      [field]: value.split(',').map((v: string) => v.trim()).filter(Boolean)
    }))
  }

  async function handleSaveConfig() {
    setSavingConfig(true)
    setSaveMsg('')
    // 保证 exclude_paths、custom_urls 为数组
    const payload = {
      ...configEdit,
      exclude_paths: Array.isArray(configEdit.exclude_paths) ? configEdit.exclude_paths : (typeof configEdit.exclude_paths === 'string' ? configEdit.exclude_paths.split(',').map((v: string) => v.trim()).filter(Boolean) : []),
      custom_urls: Array.isArray(configEdit.custom_urls) ? configEdit.custom_urls.filter((u: any) => u.loc) : [],
    }
    const res = await fetch('/api/sitemap/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    setSaveMsg(data.success ? '保存成功！' : '保存失败')
    setSavingConfig(false)
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>站点地图统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div>文件总数：{stats?.file_count}</div>
          <div>URL总数：{stats?.total_url_count}</div>
          <div>最近生成时间：{stats?.last_generated}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>站点地图文件</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {(stats?.files || files).map((file: any) => (
              <li key={file.name} className="mb-2">
                <a
                  href={file.url || `/${file.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  {file.name}
                </a>
                {' '} - {file.url_count}条 - {file.size}字节 - 最后修改：{file.lastmod} - 状态：{file.status}
                {file.warnings?.length > 0 && <div className="text-yellow-600 text-xs">警告: {file.warnings.join(', ')}</div>}
                {file.errors?.length > 0 && <div className="text-red-600 text-xs">错误: {file.errors.join(', ')}</div>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>站点地图配置</CardTitle>
        </CardHeader>
        <CardContent>
          {configEdit && (
            <form className="space-y-2" onSubmit={e => { e.preventDefault(); handleSaveConfig(); }}>
              <label className="block">启用sitemap: <input type="checkbox" checked={!!configEdit.enable_sitemap} onChange={e => setConfigEdit((c: any) => ({ ...c, enable_sitemap: e.target.checked }))} /></label>
              <label className="block">自动生成: <input type="checkbox" checked={!!configEdit.auto_generate} onChange={e => setConfigEdit((c: any) => ({ ...c, auto_generate: e.target.checked }))} /></label>
              <label className="block">包含文章: <input type="checkbox" checked={!!configEdit.include_articles} onChange={e => setConfigEdit((c: any) => ({ ...c, include_articles: e.target.checked }))} /></label>
              <label className="block">包含页面: <input type="checkbox" checked={!!configEdit.include_pages} onChange={e => setConfigEdit((c: any) => ({ ...c, include_pages: e.target.checked }))} /></label>
              <label className="block">包含图片: <input type="checkbox" checked={!!configEdit.include_image} onChange={e => setConfigEdit((c: any) => ({ ...c, include_image: e.target.checked }))} /></label>
              <label className="block">包含新闻: <input type="checkbox" checked={!!configEdit.include_news} onChange={e => setConfigEdit((c: any) => ({ ...c, include_news: e.target.checked }))} /></label>
              <label className="block">包含视频: <input type="checkbox" checked={!!configEdit.include_video} onChange={e => setConfigEdit((c: any) => ({ ...c, include_video: e.target.checked }))} /></label>
              <label className="block">默认优先级:
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={configEdit.priority_default ?? ''}
                  onChange={e => {
                    let v = parseFloat(e.target.value)
                    if (isNaN(v)) v = 0.5
                    if (v < 0) v = 0
                    if (v > 1) v = 1
                    setConfigEdit((c: any) => ({ ...c, priority_default: v }))
                  }}
                />
                <span className="ml-2 text-xs text-muted-foreground">0.0 ~ 1.0</span>
              </label>
              <label className="block">默认变更频率:
                <select
                  className="rounded-lg shadow-sm border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 px-3 py-2 outline-none transition"
                  value={configEdit.changefreq_default ?? ''}
                  onChange={e => setConfigEdit((c: any) => ({ ...c, changefreq_default: e.target.value }))}
                >
                  <option value="">请选择</option>
                  {changefreqOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">分块阈值: <input type="number" value={configEdit.split_size ?? ''} onChange={e => setConfigEdit((c: any) => ({ ...c, split_size: parseInt(e.target.value) }))} /></label>
              <label className="block">排除路径:
                <input
                  type="text"
                  className="px-2 py-1 border rounded w-full focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                  value={Array.isArray(configEdit.exclude_paths) ? configEdit.exclude_paths.join(',') : ''}
                  onChange={e => handleArrayInputChange('exclude_paths', e.target.value)}
                />
                <span className="text-xs text-muted-foreground">如 /admin,/private/*，用于排除后台、隐私等页面</span>
              </label>

              <label className="block">自定义URL:
                <div className="space-y-2">
                  {(Array.isArray(configEdit.custom_urls) ? configEdit.custom_urls : []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center mb-1">
                      <input
                        type="text"
                        className="w-2/5 px-2 py-1 border rounded"
                        placeholder="loc，如 https://example.com/special"
                        value={item.loc || ''}
                        onChange={e => setConfigEdit((c: any) => {
                          const arr = [...(Array.isArray(c.custom_urls) ? c.custom_urls : [])]
                          arr[idx] = { ...arr[idx], loc: e.target.value }
                          return { ...c, custom_urls: arr }
                        })}
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        className="w-1/6 px-2 py-1 border rounded"
                        placeholder="优先级 0.0~1.0"
                        value={item.priority ?? ''}
                        onChange={e => setConfigEdit((c: any) => {
                          const arr = [...(Array.isArray(c.custom_urls) ? c.custom_urls : [])]
                          let v = parseFloat(e.target.value)
                          if (isNaN(v)) v = 0.5
                          if (v < 0) v = 0
                          if (v > 1) v = 1
                          arr[idx] = { ...arr[idx], priority: v }
                          return { ...c, custom_urls: arr }
                        })}
                      />
                      <select
                        className="w-1/4 px-2 py-1 border rounded"
                        value={item.changefreq || ''}
                        onChange={e => setConfigEdit((c: any) => {
                          const arr = [...(Array.isArray(c.custom_urls) ? c.custom_urls : [])]
                          arr[idx] = { ...arr[idx], changefreq: e.target.value }
                          return { ...c, custom_urls: arr }
                        })}
                      >
                        <option value="">变更频率</option>
                        {changefreqOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <Button type="button" size="sm" variant="outline" onClick={() => setConfigEdit((c: any) => {
                        const arr = [...(Array.isArray(c.custom_urls) ? c.custom_urls : [])]
                        arr.splice(idx, 1)
                        return { ...c, custom_urls: arr }
                      })}>删除</Button>
                    </div>
                  ))}
                  <Button type="button" size="sm" onClick={() => setConfigEdit((c: any) => ({
                    ...c,
                    custom_urls: [...(Array.isArray(c.custom_urls) ? c.custom_urls : []), { loc: '', priority: 0.5, changefreq: '' }]
                  }))}>添加自定义URL</Button>
                  <span className="text-xs text-muted-foreground block mt-1">每条需填写 loc（URL），priority（0.0~1.0），changefreq（变更频率）</span>
                </div>
              </label>
              <Button type="submit" disabled={savingConfig}>保存配置</Button>
              {saveMsg && <span className="ml-2 text-green-600">{saveMsg}</span>}
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleGenerate}>手动生成站点地图</Button>
        {genResult && <span>{genResult}</span>}
      </div>
    </div>
  )
}
