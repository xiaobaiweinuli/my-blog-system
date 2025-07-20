import DashboardLayout from './layout'
import { requireCollaborator } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DashboardStats } from "@/components/analytics/dashboard-stats"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { FileText, Plus, Users, BarChart3, Settings } from "lucide-react"
import Link from "next/link"
import { DataService } from "@/lib/data-service"
import { formatTime } from "@/lib/utils/time"

export default async function DashboardPage() {
  const user = await requireCollaborator()
  // 对接后端API获取统计数据
  type DashboardStats = {
    articles?: { total?: number; draft?: number }
    users?: { total?: number }
    views?: { total_views?: number }
  }
  const dashboardStats: DashboardStats = (await DataService.getInstance().getDashboardStats().catch(() => ({}))) || {}
  // 兼容API返回结构
  const stats = [
    {
      title: "总文章数",
      value: dashboardStats?.articles?.total ?? 0,
      description: "已发布的文章",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "草稿",
      value: dashboardStats?.articles?.draft ?? 0,
      description: "未发布的草稿",
      icon: FileText,
      color: "text-orange-600",
    },
    {
      title: "总访问量",
      value: dashboardStats?.views?.total_views ?? 0,
      description: "本月访问量",
      icon: BarChart3,
      color: "text-green-600",
    },
    {
      title: "用户数",
      value: dashboardStats?.users?.total ?? 0,
      description: "注册用户",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  const quickActions = [
    {
      title: "创建新文章",
      description: "开始写作新的博客文章",
      href: "/dashboard/articles/new",
      icon: Plus,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "管理文章",
      description: "查看和编辑现有文章",
      href: "/dashboard/articles",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "文件管理",
      description: "上传和管理媒体文件",
      href: "/dashboard/files",
      icon: Settings,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "站点设置",
      description: "管理网站全局设置",
      href: "/dashboard/settings",
      icon: Settings,
      color: "bg-cyan-500 hover:bg-cyan-600",
    },
    {
      title: "页面管理",
      description: "管理自定义页面内容",
      href: "/dashboard/pages",
      icon: FileText,
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      title: "数据分析",
      description: "查看网站访问和内容分析",
      href: "/dashboard/analytics",
      icon: BarChart3,
      color: "bg-teal-500 hover:bg-teal-600",
    },
    {
      title: "编辑友链",
      description: "管理和编辑友情链接",
      href: "/dashboard/friend-links",
      icon: Users,
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      title: "编辑用户",
      description: "管理和编辑用户信息",
      href: "/dashboard/users",
      icon: Users,
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      title: "编辑sitemap",
      description: "管理和生成网站地图",
      href: "/dashboard/sitemap",
      icon: Settings,
      color: "bg-gray-500 hover:bg-gray-600",
    },
  ]

  // 获取最近活动
  const recentActivity = await DataService.getInstance().getRecentActivity()

  return (
    <div className="space-y-8">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">仪表板</h1>
              <p className="text-muted-foreground">
                欢迎回来，{user.name}！管理您的内容和设置。
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/articles/new">
                <Plus className="w-4 h-4 mr-2" />
                创建文章
              </Link>
            </Button>
          </div>

          {/* 统计概览 */}
          <DashboardStats />

          {/* 统计卡片 */}
          <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap={6}>
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </ResponsiveGrid>

          {/* 快速操作 */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">快速操作</h2>
            <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={6}>
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Card key={action.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle>{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href={action.href}>
                          开始
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </ResponsiveGrid>
          </div>

          {/* 最近活动 */}
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>
                您最近的操作记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 && (
                  <div className="text-muted-foreground text-sm">暂无活动</div>
                )}
                {recentActivity.map((item, idx) => {
                  let color = "bg-blue-500"
                  let content = null
                  if (item.type === "file_upload") {
                    color = "bg-purple-500"
                    content = <>
                      <p className="text-sm">上传了文件 "{item.original_name || item.filename}"</p>
                    </>
                  } else if (item.type === "article_create") {
                    color = "bg-blue-500"
                    content = <>
                      <p className="text-sm">创建了新文章 "{item.title}"</p>
                    </>
                  } else if (item.type === "article_publish") {
                    color = "bg-green-500"
                    content = <>
                      <p className="text-sm">发布了文章 "{item.title}"</p>
                    </>
                  } else {
                    content = <p className="text-sm">{item.type}</p>
                  }
                  return (
                    <div className="flex items-center space-x-4" key={`${item.id}-${item.type}-${item.time}`}>
                      <div className={`w-2 h-2 ${color} rounded-full`}></div>
                      <div className="flex-1">
                        {content}
                        <p className="text-xs text-muted-foreground">{formatTime(item.time)} <span className="ml-2 text-[10px] text-gray-400">{item.id}</span></p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
  )
} 