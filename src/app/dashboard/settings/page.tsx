"use client";
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from "@/components/providers/global-auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

function formatValue(key: string, value: any) {
  if (value == null) return '-'
  // 时间类型
  if (/time|at/i.test(key) && typeof value === 'string' && !isNaN(Date.parse(value))) {
    return new Date(value).toLocaleString()
  }
  // JSON/数组
  if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
    try {
      const obj = JSON.parse(value)
      return (
        <pre className="whitespace-pre-wrap break-all text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">{JSON.stringify(obj, null, 2)}</pre>
      )
    } catch {
      // 非法 JSON
    }
  }
  // 长字符串省略
  if (typeof value === 'string' && value.length > 40) {
    return <span title={value}>{value.slice(0, 40)}... </span>
  }
  return value
}

export default function SettingsPage() {
  const { session, status } = useAuth();
  const [settings, setSettings] = useState<any[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editArray, setEditArray] = useState<string[]>([])
  const [jsonError, setJsonError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isArrayEdit, setIsArrayEdit] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addKey, setAddKey] = useState('')
  const [addValue, setAddValue] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [addError, setAddError] = useState('')

  // 判断是否有编辑权限
  const isAdmin = session?.user?.role === 'admin'

  // 加载全部设置
  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true)
      fetch('/api/settings', {
        headers: {
          Authorization: session?.user?.token ? `Bearer ${session.user.token}` : ''
        }
      })
        .then(res => res.json())
        .then(data => setSettings(data.data || []))
        .finally(() => setLoading(false))
    }
  }, [status])

  // 编辑时
  const handleEdit = (idx: number) => {
    setEditIndex(idx)
    setEditValue(settings[idx].value)
    setJsonError('')
    setMessage('')
    // 判断是否为数组
    try {
      const arr = JSON.parse(settings[idx].value)
      if (Array.isArray(arr)) {
        setEditArray(arr.map(String))
        setIsArrayEdit(true)
      } else {
        setEditArray([])
        setIsArrayEdit(false)
      }
    } catch {
      setEditArray([])
      setIsArrayEdit(false)
    }
  }

  // 编辑内容变化时
  const handleEditValueChange = (val: string) => {
    setEditValue(val)
    setIsArrayEdit(false)
    // 如果是 JSON 类型，做校验
    if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
      try {
        JSON.parse(val)
        setJsonError('')
      } catch {
        setJsonError('JSON 格式错误')
      }
    } else {
      setJsonError('')
    }
  }

  // 可视化数组编辑相关
  const handleArrayChange = (i: number, val: string) => {
    const arr = [...editArray]
    arr[i] = val
    setEditArray(arr)
    setEditValue(JSON.stringify(arr))
  }
  const handleAddArrayItem = () => {
    const arr = [...editArray, '']
    setEditArray(arr)
    setEditValue(JSON.stringify(arr))
  }
  const handleRemoveArrayItem = (i: number) => {
    const arr = [...editArray]
    arr.splice(i, 1)
    setEditArray(arr)
    setEditValue(JSON.stringify(arr))
  }

  // 一键格式化
  const handleFormatJson = () => {
    try {
      const obj = JSON.parse(editValue)
      setEditValue(JSON.stringify(obj, null, 2))
      setJsonError('')
    } catch {
      setJsonError('JSON 格式错误')
    }
  }

  // 保存单项
  const handleSave = async (idx: number) => {
    const key = settings[idx].key
    setMessage('保存中...')
    const res = await fetch(`/api/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: session?.user?.token ? `Bearer ${session.user.token}` : ''
      },
      body: JSON.stringify({ value: editValue })
    })
    const data = await res.json()
    if (data.success) {
      // 更新本地数据
      const newSettings = [...settings]
      newSettings[idx].value = editValue
      setSettings(newSettings)
      setMessage('保存成功！')
      setEditIndex(null)
      setIsArrayEdit(false)
    } else {
      setMessage('保存失败：' + (data.error || '未知错误'))
    }
  }

  // 新增设置提交
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!addKey || !addValue) {
      setAddError('key 和 value 必填')
      return
    }
    let valueToSend = addValue
    // 尝试自动识别数组
    if (addValue.trim().startsWith('[') || addValue.trim().startsWith('{')) {
      try {
        JSON.parse(addValue)
      } catch {
        setAddError('value 不是合法 JSON')
        return
      }
    }
    const res = await fetch(`/api/settings/${addKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: session?.user?.token ? `Bearer ${session.user.token}` : ''
      },
      body: JSON.stringify({
        value: valueToSend,
        description: addDesc,
        url: addUrl
      })
    })
    const data = await res.json()
    if (data.success) {
      setAddOpen(false)
      setAddKey('')
      setAddValue('')
      setAddDesc('')
      setAddUrl('')
      setAddError('')
      // 刷新列表
      setSettings(data.data)
      setMessage('新增成功！')
    } else {
      setAddError('新增失败：' + (data.error || '未知错误'))
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        {isAdmin && (
          <Button className="rounded-full px-6 py-2 text-base font-semibold shadow-md bg-primary hover:bg-primary/90 transition" onClick={() => setAddOpen(true)}>新增设置</Button>
        )}
      </div>
      {/* 新增设置弹窗 */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增设置项</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block mb-1 text-sm">key *</label>
              <Input value={addKey} onChange={e => setAddKey(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm">value *</label>
              <Input value={addValue} onChange={e => setAddValue(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm">描述</label>
              <Input value={addDesc} onChange={e => setAddDesc(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1 text-sm">url</label>
              <Input value={addUrl} onChange={e => setAddUrl(e.target.value)} />
            </div>
            {addError && <div className="text-red-500 text-xs">{addError}</div>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
              <Button type="submit">提交</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div className="rounded-2xl shadow-lg bg-white p-4">
          <table className="w-full border-collapse overflow-hidden rounded-2xl">
            <thead>
              <tr className="bg-gray-100 text-gray-800 text-base font-bold h-14">
                <th className="p-4 rounded-tl-2xl min-w-[120px] text-center">Key</th>
                <th className="p-4 min-w-[260px] text-center">Value</th>
                <th className="p-4 min-w-[120px] text-center">描述</th>
                <th className="p-4 min-w-[120px] text-center">更新时间</th>
                <th className="p-4 min-w-[90px] text-center">修改人</th>
                <th className="p-4 min-w-[120px] text-center">链接</th>
                {isAdmin && <th className="p-4 rounded-tr-2xl min-w-[90px] text-center">操作</th>}
              </tr>
            </thead>
            <tbody>
              {settings.map((item, idx) => (
                <tr key={item.key} className={"border-b-2 border-gray-300 hover:bg-gray-50 transition-all group"}>
                  <td className="p-4 align-top font-mono text-xs text-gray-700 break-all text-center">{item.key}</td>
                  <td className="p-4 align-top bg-gray-50 max-w-[420px] break-words whitespace-pre-wrap text-center">
                    {editIndex === idx ? (
                      isArrayEdit ? (
                        <div>
                          {editArray.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <Input
                                value={v}
                                onChange={e => handleArrayChange(i, e.target.value)}
                                className="w-full rounded-lg"
                              />
                              <Button size="sm" type="button" variant="outline" className="rounded-full" onClick={() => handleRemoveArrayItem(i)}>删除</Button>
                            </div>
                          ))}
                          <Button size="sm" type="button" className="rounded-full mt-1" onClick={handleAddArrayItem}>添加一行</Button>
                        </div>
                      ) : (
                        (typeof editValue === 'string' && (editValue.trim().startsWith('[') || editValue.trim().startsWith('{') || editValue.length > 40)) ? (
                          <div>
                            <textarea
                              value={editValue}
                              onChange={e => handleEditValueChange(e.target.value)}
                              className={`w-full min-h-[80px] border rounded-lg p-2 font-mono text-xs ${jsonError ? 'border-red-500' : ''}`}
                            />
                            <div className="flex items-center gap-2 mt-1">
                              <Button size="sm" type="button" className="rounded-full" onClick={handleFormatJson}>格式化</Button>
                              {jsonError && <span className="text-red-500 text-xs">{jsonError}</span>}
                            </div>
                          </div>
                        ) : (
                          <Input
                            value={editValue}
                            onChange={e => handleEditValueChange(e.target.value)}
                            className="w-full rounded-lg"
                          />
                        )
                      )
                    ) : (
                      formatValue(item.key, item.value)
                    )}
                  </td>
                  <td className="p-4 align-top text-gray-500 text-xs min-w-[120px] text-center">{item.description || '-'}</td>
                  <td className="p-4 align-top text-xs min-w-[120px] text-center">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</td>
                  <td className="p-4 align-top text-xs min-w-[90px] text-center">{item.updated_by || '-'}</td>
                  <td className="p-4 align-top text-xs min-w-[120px] text-center">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                        {item.url}
                      </a>
                    ) : '-'}
                  </td>
                  {isAdmin && (
                    <td className="p-4 align-top text-center">
                      {editIndex === idx ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="rounded-full px-4" onClick={() => handleSave(idx)} disabled={!!jsonError}>保存</Button>
                          <Button size="sm" variant="outline" className="rounded-full px-4" onClick={() => { setEditIndex(null); setIsArrayEdit(false); }}>取消</Button>
                        </div>
                      ) : (
                        <Button size="sm" className="rounded-full px-4" onClick={() => handleEdit(idx)}>编辑</Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {message && <div className="text-green-600 mt-4">{message}</div>}
      {!isAdmin && (
        <div className="text-gray-500 mt-4">当前用户无编辑权限，仅可查看设置。</div>
      )}
    </div>
  )
}
