"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { dataService } from "@/lib/data-service"
import type { FriendLink } from "@/types"
import { getCurrentTimestamp } from '@/lib/utils'
import { useToast } from "@/components/ui/toast"

export function FriendLinkManager() {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    avatar: "",
    category: "",
    status: "active" as "active" | "pending" | "inactive",
  })

  const { success, error } = useToast()

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [links, cats] = await Promise.all([
        dataService.getFriendLinks({ status: "all" }),
        dataService.getFriendLinkCategories()
      ])
      setFriendLinks(links)
      setCategories(cats)
    } catch (err) {
      error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingLink) {
        // 更新现有链接
        const updatedLink = {
          ...editingLink,
          ...formData,
          updatedAt: new Date(getCurrentTimestamp())
        }
        await dataService.updateFriendLink(editingLink.id, updatedLink)
        success('友情链接更新成功')
      } else {
        // 创建新链接
        const newLink = {
          id: getCurrentTimestamp().toString(),
          ...formData,
          createdAt: new Date(getCurrentTimestamp()),
          updatedAt: new Date(getCurrentTimestamp()),
        }
        await dataService.createFriendLink(newLink)
        success('友情链接创建成功')
      }
      
      handleCloseDialog()
      loadData() // 重新加载数据
    } catch (err) {
      error('操作失败，请重试')
    }
  }

  // 处理编辑
  const handleEdit = (link: FriendLink) => {
    setEditingLink(link)
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description,
      avatar: link.avatar || "",
      category: link.category,
      status: link.status,
    })
    setIsDialogOpen(true)
  }

  // 处理删除
  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这个友情链接吗？")) {
      try {
        await dataService.deleteFriendLink(id)
        success('删除成功')
        loadData() // 重新加载数据
      } catch (err) {
        error('删除失败')
      }
    }
  }

  // 切换状态
  const handleToggleStatus = async (id: string) => {
    try {
      const link = friendLinks.find(l => l.id === id)
      if (!link) return
      
      const newStatus = link.status === "active" ? "inactive" : "active"
      await dataService.updateFriendLink(id, {
        ...link,
        status: newStatus,
        updatedAt: new Date(getCurrentTimestamp())
      })
      success('状态更新成功')
      loadData() // 重新加载数据
    } catch (err) {
      error('状态更新失败')
    }
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingLink(null)
    setFormData({
      name: "",
      url: "",
      description: "",
      avatar: "",
      category: "",
      status: "active",
    })
  }

  // 获取状态徽章
  const getStatusBadge = (status: FriendLink["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">活跃</Badge>
      case "inactive":
        return <Badge variant="secondary">停用</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">待审核</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>友情链接管理</CardTitle>
            <CardDescription>
              管理网站的友情链接，包括添加、编辑和删除
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingLink(null)}>
                <Plus className="w-4 h-4 mr-2" />
                添加友链
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? "编辑友情链接" : "添加友情链接"}
                </DialogTitle>
                <DialogDescription>
                  填写友情链接的基本信息
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="friendlink-name">网站名称</Label>
                  <Input
                    id="friendlink-name"
                    aria-label="网站名称"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入网站名称"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="friendlink-url">网站地址</Label>
                  <Input
                    id="friendlink-url"
                    aria-label="网站地址"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">网站描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入网站描述"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="friendlink-avatar">网站图标</Label>
                  <Input
                    id="friendlink-avatar"
                    aria-label="网站图标"
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="friendlink-category">分类</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="friendlink-status">状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "pending" | "inactive") => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">活跃</SelectItem>
                      <SelectItem value="pending">待审核</SelectItem>
                      <SelectItem value="inactive">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    取消
                  </Button>
                  <Button type="submit">
                    {editingLink ? "更新" : "创建"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">共 {friendLinks.length} 个友情链接</span>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>网站</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {friendLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {link.avatar && (
                        <OptimizedImage
                          src={link.avatar}
                          alt={link.name}
                          width={32}
                          height={32}
                          className="rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium">{link.name}</div>
                        <div className="text-sm text-muted-foreground">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center"
                          >
                            {link.url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {link.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{link.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(link.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(link.id)}
                      >
                        {link.status === "active" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(link)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 