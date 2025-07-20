'use client'
import { forwardRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

function getToken() {
  // 优先从 localStorage 获取
  if (typeof window !== 'undefined') {
    const cacheStr = localStorage.getItem('global_session_cache')
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr)
        return cache?.user?.token || ''
      } catch {}
    }
    // 也可以从 cookie 获取 next-auth.session-token
    const match = document.cookie.match(/next-auth\.session-token=([^;]+)/)
    if (match) return match[1]
  }
  return ''
}

export default function PageDeleteButton({ open, onOpenChange, id, onDelete }: { open: boolean, onOpenChange: (v: boolean) => void, id: string, onDelete: () => void }) {
  const [loading, setLoading] = useState(false)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

  const handleDelete = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onDelete()
    } catch (error) {
      console.error('删除页面失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>删除页面</DialogTitle>
          <DialogDescription>
            确定要删除这个页面吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className={loading ? 'opacity-50' : ''}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 