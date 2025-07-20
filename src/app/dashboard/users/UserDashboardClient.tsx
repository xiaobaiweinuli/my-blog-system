 'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/global-auth-context";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, User, Shield, Users } from "lucide-react"
import { toast } from "sonner"

interface User {
  username: string
  email: string
  name: string
  role: 'admin' | 'collaborator' | 'user'
  is_active: boolean
  created_at: string
  last_login_at?: string
  avatar_url?: string // Added avatar_url to the interface
  bio?: string
  location?: string
  website?: string
}

export default function AdminUsersPage() {
  const { session, status } = useAuth();
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    role: "user" as 'admin' | 'collaborator' | 'user',
    avatar_url: "",
    bio: "",
    location: "",
    website: "",
  })

  // 检查权限
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user?.role !== "admin") {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router])

  // 获取用户列表
  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${session?.user?.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("获取用户列表失败")
      }

      const data = await response.json()
      setUsers(data.data.items || [])
    } catch (error) {
      setError("获取用户列表失败")
      console.error("Fetch users error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user?.token}`,
      };
      const body = JSON.stringify(formData);
      const options = {
        method: 'POST',
        headers,
        body,
      };
      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setCreateError(data?.error || '创建用户失败');
        return;
      }
      toast.success('用户创建成功');
      setIsCreateDialogOpen(false);
      setFormData({ username: '', email: '', name: '', password: '', role: 'user', avatar_url: '', bio: '', location: '', website: '' });
      fetchUsers();
    } catch (error) {
      setCreateError('创建用户失败');
      console.error('[handleCreateUser] 捕获异常:', error);
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${editingUser.username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          role: formData.role,
        }),
      })

      if (!response.ok) {
        throw new Error("更新用户失败")
      }

      toast.success("用户更新成功")
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFormData({ username: "", email: "", name: "", password: "", role: "user", avatar_url: "", bio: "", location: "", website: "" })
      fetchUsers()
    } catch (error) {
      toast.error("更新用户失败")
      console.error("Update user error:", error)
    }
  }

  const handleToggleUserStatus = async (username: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("更新用户状态失败")
      }

      toast.success("用户状态更新成功")
      fetchUsers()
    } catch (error) {
      toast.error("更新用户状态失败")
      console.error("Toggle user status error:", error)
    }
  }

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const handleDeleteUser = async (username: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.user?.token}`,
        },
      })
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setDeleteError(data?.error || "删除用户失败");
        return;
      }
      toast.success("用户删除成功")
      fetchUsers()
    } catch (error) {
      setDeleteError("删除用户失败");
      console.error("Delete user error:", error)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
      avatar_url: user.avatar_url || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      collaborator: "secondary",
      user: "default",
    } as const

    return <Badge variant={variants[role as keyof typeof variants]}>{role}</Badge>
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
              <DialogDescription>创建一个新的系统用户</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入密码"
                />
              </div>
              <div>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">普通用户</SelectItem>
                    <SelectItem value="collaborator">协作者</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="请输入头像图片链接"
                />
              </div>
              <div>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="请输入简介"
                />
              </div>
              <div>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="请输入位置"
                />
              </div>
              <div>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="请输入个人网站链接"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateUser}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.username}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || user.username}
                        className="h-10 w-10 rounded-full object-cover bg-muted"
                        style={{ minWidth: 40, minHeight: 40 }}
                      />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getRoleBadge(user.role)}
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "活跃" : "禁用"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(user.username, user.is_active)}
                  >
                    {user.is_active ? "禁用" : "启用"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息和权限</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">用户名</Label>
              <Input
                id="edit-username"
                value={formData.username}
                disabled
                placeholder="用户名不可修改"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                placeholder="邮箱不可修改"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">姓名</Label>
              <Input
                id="edit-name"
                value={formData.name}
                disabled
                placeholder="姓名不可修改"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">角色</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="collaborator">协作者</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateUser}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={open => { if (!open) setDeleteConfirmUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div>
            确定要删除用户 <b>{deleteConfirmUser?.name || deleteConfirmUser?.username}</b> 吗？此操作不可撤销。
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmUser(null)}>取消</Button>
            <Button variant="destructive" onClick={async () => {
              if (deleteConfirmUser) {
                await handleDeleteUser(deleteConfirmUser.username);
                setDeleteConfirmUser(null);
              }
            }}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 删除失败弹窗 */}
      <Dialog open={!!deleteError} onOpenChange={() => setDeleteError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>操作提示</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div>{deleteError}</div>
          <DialogFooter>
            <Button onClick={() => setDeleteError(null)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 创建用户失败弹窗 */}
      <Dialog open={!!createError} onOpenChange={() => setCreateError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>操作提示</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            请根据需要填写或操作。
          </DialogDescription>
          <div>{createError}</div>
          <DialogFooter>
            <Button onClick={() => setCreateError(null)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
