'use client'

import { ExternalLink, Heart, Users, Globe, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { useState, useRef, useEffect } from "react"
import { generateBaseMetadata } from "@/lib/seo"
import type { Metadata } from "next"
import Link from 'next/link'


interface FriendLink {
  id: string
  name: string
  url: string
  description: string
  avatar?: string | null
  category?: string
  status?: string
  order_index?: number
  is_featured?: boolean
  contact_email?: string | null
  created_at?: string
  updated_at?: string
  approved_at?: string | null
}

export default function FriendsPage() {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/friend-links')
      .then(res => res.json())
      .then(data => {
        const links: FriendLink[] = data.data || []
        setFriendLinks(links)
        // 自动提取所有分类
        const cats = Array.from(new Set(links.map(l => l.category || '未分类')))
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }, [])

  // 按分类分组
  const linksByCategory: Record<string, FriendLink[]> = {}
  categories.forEach(category => {
    linksByCategory[category] = friendLinks.filter(l => (l.category || '未分类') === category)
  })

  return (
    <MainLayout>
      <PageContainer maxWidth="6xl">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-red-500" />
              <h1 className="text-4xl font-bold">友情链接</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              推荐的优质网站和技术资源，与优秀的开发者和项目建立连接
            </p>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">友链总数</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{friendLinks.length}</div>
                <p className="text-xs text-muted-foreground">
                  精选优质资源
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">分类数量</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">
                  涵盖多个领域
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">推荐指数</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">⭐⭐⭐⭐⭐</div>
                <p className="text-xs text-muted-foreground">
                  五星推荐
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 申请友链说明 */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                申请友链
              </CardTitle>
              <CardDescription>
                欢迎优质的技术博客和项目申请友情链接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">申请条件</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 内容原创，质量较高</li>
                      <li>• 网站稳定，访问正常</li>
                      <li>• 主题相关（技术、设计、创意等）</li>
                      <li>• 更新频率较为稳定</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">本站信息</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 网站名称：现代化博客</li>
                      <li>• 网站类别：导航</li>
                      <li>• 网站地址：https://example.com</li>
                      <li>• 网站描述：现代化的技术博客平台</li>
                      <li>• 网站图标：https://example.com/favicon.ico</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-4">
                  <FriendLinkFormTrigger />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 友情链接列表 */}
          <div className="space-y-8">
            {loading ? (
              <div className="text-center text-muted-foreground py-12">加载中...</div>
            ) : categories.map((category) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{category}</h2>
                  <Badge variant="secondary">
                    {linksByCategory[category].length} 个
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {linksByCategory[category].map((link) => (
                    <Card key={link.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {link.avatar ? (
                              <OptimizedImage
                                src={link.avatar}
                                alt={`${link.name} 图标`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                fallbackSrc="/images/default-avatar.png"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {link.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                              {link.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {link.description}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="outline" className="text-xs">
                                {link.category}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                asChild
                              >
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  访问
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 感谢信息 */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">感谢所有朋友</h3>
                <p className="text-muted-foreground">
                  感谢每一位朋友的支持和推荐，让我们一起构建更好的技术社区。
                  如果您觉得某个链接对您有帮助，不妨去支持一下！
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  )
}

// 友链申请表单组件
function FriendLinkForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    avatar: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/friend-links`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form)
      }
    );
    if (res.ok) {
      setMsg("✅ 申请成功，等待审核！");
      setForm({ name: "", url: "", description: "", avatar: "", category: ""});
      // 提交成功后，调用 onSuccess 关闭表单
      if (onSuccess) onSuccess();
    } else {
      setMsg("❌ 申请失败，请重试！");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-md p-4 bg-white dark:bg-gray-900 rounded-lg shadow border">
      <div className="flex gap-2">
        <input name="name" value={form.name} onChange={handleChange} placeholder="网站名称*" required className="flex-1 input input-bordered px-3 py-2 rounded border" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="分类" className="w-32 input input-bordered px-3 py-2 rounded border" />
      </div>
      <input name="url" value={form.url} onChange={handleChange} placeholder="网站地址*" required className="input input-bordered px-3 py-2 rounded border" />
      <input name="avatar" value={form.avatar} onChange={handleChange} placeholder="网站图标URL" className="input input-bordered px-3 py-2 rounded border" />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="网站描述*" required className="input input-bordered px-3 py-2 rounded border resize-none" rows={2} />
      <button type="submit" className="btn btn-primary mt-2" disabled={loading}>{loading ? "提交中..." : "提交申请"}</button>
      {msg && <div className="text-sm mt-1 text-center">{msg}</div>}
    </form>
  );
}

function FriendLinkFormTrigger() {
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showForm) return;
    function handleClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showForm]);

  // 提交成功后关闭表单并显示提示
  const handleSuccess = () => {
    setShowForm(false);
    setSuccessMsg("✅ 申请成功，等待审核！");
    setTimeout(() => setSuccessMsg(""), 4000); // 4秒后自动消失
  };

  return (
    <>
      {!showForm && !successMsg ? (
        <Button onClick={() => setShowForm(true)}>
          <ExternalLink className="w-4 h-4 mr-2" />
          申请友链
        </Button>
      ) : null}
      {showForm ? (
        <div
          ref={formRef}
          style={{
            position: "fixed",
            zIndex: 1000,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <FriendLinkForm onSuccess={handleSuccess} />
        </div>
      ) : null}
      {successMsg && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            color: "#16a34a",
            borderRadius: 8,
            padding: "2rem 2.5rem",
            boxShadow: "0 2px 16px #0002",
            fontSize: "1.2rem",
            fontWeight: 500
          }}
        >
          {successMsg}
        </div>
      )}
    </>
  );
}
