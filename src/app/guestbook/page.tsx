import { MessageCircle, Users, Heart, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import GuestbookComments from "@/components/guestbook/guestbook-comments"
import { generateBaseMetadata } from "@/lib/seo"
import type { Metadata } from "next"

// 生成页面元数据
export function generateMetadata(): Metadata {
  return generateBaseMetadata({
    title: "留言板",
    description: "欢迎在这里留下您的想法、建议或问候",
    keywords: ["留言板", "评论", "互动", "社区"],
  })
}

async function getGuestbookStats() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
  const res = await fetch(`${baseUrl}/api/giscus/stats?mapping=title&term=guestbook`, { cache: 'no-store' })
  if (!res.ok) return { comment_count: 0, user_count: 0, reaction_count: 0 }
  return res.json()
}

export default async function GuestbookPage() {
  const stats = await getGuestbookStats()
  return (
    <MainLayout>
      <PageContainer maxWidth="4xl">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">留言板</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              欢迎在这里留下您的想法、建议或问候。让我们一起交流，共同成长！
            </p>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总留言数</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.comment_count}</div>
                <p className="text-xs text-muted-foreground">
                  感谢大家的参与
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">参与用户</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.user_count}</div>
                <p className="text-xs text-muted-foreground">
                  活跃的社区成员
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">互动反应</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.like_count}--{stats.reply_count}</div>
                <p className="text-xs text-muted-foreground">
                  点赞和回复总数
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 留言规则 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                留言规则
              </CardTitle>
              <CardDescription>
                为了营造良好的交流环境，请遵守以下规则
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <div>
                      <h4 className="font-medium">友善交流</h4>
                      <p className="text-sm text-muted-foreground">
                        请保持友善和尊重，避免使用攻击性语言
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    <div>
                      <h4 className="font-medium">内容相关</h4>
                      <p className="text-sm text-muted-foreground">
                        欢迎分享想法、建议或技术讨论
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    <div>
                      <h4 className="font-medium">禁止垃圾信息</h4>
                      <p className="text-sm text-muted-foreground">
                        请勿发布广告、垃圾链接或无关内容
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">4</Badge>
                    <div>
                      <h4 className="font-medium">保护隐私</h4>
                      <p className="text-sm text-muted-foreground">
                        请勿分享个人敏感信息
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 留言区域 */}
          <GuestbookComments />

          {/* 感谢信息 */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">感谢您的参与！</h3>
                <p className="text-muted-foreground">
                  每一条留言都是对我们最大的鼓励和支持。
                  如果您觉得这个网站对您有帮助，欢迎分享给更多朋友。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  )
}
