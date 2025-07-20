"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    avatar_url: "",
    bio: "",
    location: "",
    website: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const payload = {
        ...form,
        subject: "欢迎注册楼市笔记",
        html: "",
        from: "",
        verifyUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/verify-email` : "",
        successRedirectUrl: "/dashboard",
        failRedirectUrl: "/auth/signin",
        showSupportContact: false,
        expireMinutes: 30,
      }
      //console.log('[register] 提交参数:', payload)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      //console.log('[register] 响应状态:', res.status)
      const data = await res.json()
      //console.log('[register] 响应内容:', data)
      if (data.success) {
        setSuccess("注册成功！请前往邮箱验证。")
        if (data.data && data.token) {
          localStorage.setItem("token", data.token)
          localStorage.setItem("userInfo", JSON.stringify(data.data))
          window.location.href = "/"
        }
      } else {
        setError(data.error || "注册失败")
      }
    } catch (err) {
      console.error('[register] 捕获异常:', err)
      setError("网络错误")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">
            创建新账号，注册后请前往邮箱完成验证
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="请输入用户名"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入邮箱"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <Label htmlFor="name">姓名/昵称</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="请输入姓名/昵称"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="请输入密码"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <Label htmlFor="avatar_url">头像图片链接（可选）</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              type="text"
              placeholder="请输入头像图片链接（可选）"
              value={form.avatar_url}
              onChange={handleChange}
              autoComplete="off"
            />
            <Label htmlFor="bio">个人简介（可选）</Label>
            <Input
              id="bio"
              name="bio"
              type="text"
              placeholder="请输入个人简介（可选）"
              value={form.bio}
              onChange={handleChange}
              autoComplete="off"
            />
            <Label htmlFor="location">位置（可选）</Label>
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="请输入位置（可选）"
              value={form.location}
              onChange={handleChange}
              autoComplete="off"
            />
            <Label htmlFor="website">个人网站（可选）</Label>
            <Input
              id="website"
              name="website"
              type="text"
              placeholder="请输入个人网站（可选）"
              value={form.website}
              onChange={handleChange}
              autoComplete="off"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "注册中..." : "注册"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => router.push('/auth/signin')}
            >
              返回登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}