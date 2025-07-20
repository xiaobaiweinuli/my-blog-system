import { Clock, MapPin, Book, Code, Coffee, Music, Target, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { generateBaseMetadata } from "@/lib/seo"
import type { Metadata } from "next"

// 生成页面元数据
export function generateMetadata(): Metadata {
  return generateBaseMetadata({
    title: "此刻",
    description: "分享我当前的状态、正在进行的项目和近期计划",
    keywords: ["此刻", "现状", "项目", "计划", "生活"],
  })
}

export default function NowPage() {
  const lastUpdated = "2024年12月"
  const currentLocation = "中国"
  
  // 当前项目
  const currentProjects = [
    {
      name: "现代化博客系统",
      description: "基于 Next.js 的全栈博客平台",
      progress: 95,
      status: "即将完成",
      tech: ["Next.js", "TypeScript", "Tailwind CSS", "AI"],
    },
    {
      name: "AI 内容助手",
      description: "智能文章摘要和标签推荐系统",
      progress: 80,
      status: "开发中",
      tech: ["OpenAI", "Cloudflare Workers", "AI"],
    },
    {
      name: "性能优化",
      description: "网站性能和用户体验优化",
      progress: 70,
      status: "进行中",
      tech: ["Web Vitals", "优化", "无障碍访问"],
    },
  ]

  // 正在学习
  const currentLearning = [
    { topic: "AI 应用开发", progress: 75 },
    { topic: "Web 性能优化", progress: 60 },
    { topic: "无障碍访问设计", progress: 50 },
    { topic: "Cloudflare 生态", progress: 80 },
  ]

  // 近期目标
  const goals = [
    "完成博客系统的所有功能",
    "发布技术文章分享经验",
    "学习更多 AI 应用开发",
    "提升网站性能和用户体验",
    "建立活跃的技术社区",
  ]

  // 当前状态
  const currentStatus = {
    mood: "专注",
    activity: "开发博客系统",
    music: "Lo-fi Hip Hop",
    reading: "《Clean Architecture》",
    coffee: "美式咖啡",
  }

  return (
    <MainLayout>
      <PageContainer maxWidth="4xl">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">此刻</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              分享我当前的状态、正在进行的项目和近期计划
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>最后更新：{lastUpdated}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{currentLocation}</span>
              </div>
            </div>
          </div>

          {/* 当前状态 */}
          <Card>
            <CardHeader>
              <CardTitle>当前状态</CardTitle>
              <CardDescription>
                我现在正在做什么，感受如何
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">😊</span>
                  </div>
                  <div>
                    <p className="font-medium">心情</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.mood}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Code className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">正在做</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.activity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <Music className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">背景音乐</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.music}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <Book className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">在读</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.reading}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">饮品</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.coffee}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 当前项目 */}
          <Card>
            <CardHeader>
              <CardTitle>当前项目</CardTitle>
              <CardDescription>
                我正在进行的主要项目和进展
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentProjects.map((project, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>进度</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 正在学习 */}
          <Card>
            <CardHeader>
              <CardTitle>正在学习</CardTitle>
              <CardDescription>
                当前正在深入学习的技术和知识
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentLearning.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.topic}</span>
                      <span className="text-sm text-muted-foreground">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 近期目标 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                近期目标
              </CardTitle>
              <CardDescription>
                接下来几个月想要完成的事情
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {goals.map((goal, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">想要交流？</h3>
                <p className="text-muted-foreground">
                  如果您对我的项目感兴趣，或者想要交流技术话题，
                  欢迎通过留言板或邮件联系我。
                </p>
                <div className="flex justify-center gap-4">
                  <Badge variant="outline">
                    📧 hello@example.com
                  </Badge>
                  <Badge variant="outline">
                    🐙 GitHub
                  </Badge>
                  <Badge variant="outline">
                    🐦 Twitter
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  )
}
