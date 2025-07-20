import Link from "next/link"
import { AlertTriangle, Home, RefreshCcw, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"

interface ErrorPageTemplateProps {
  title?: string
  description?: string
  statusCode?: number
  showBackButton?: boolean
  showHomeButton?: boolean
  showRefreshButton?: boolean
  showContactButton?: boolean
  customActions?: React.ReactNode
  children?: React.ReactNode
}

export function ErrorPageTemplate({
  title = "出错了",
  description = "页面加载过程中发生错误",
  statusCode,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = true,
  showContactButton = false,
  customActions,
  children,
}: ErrorPageTemplateProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <MainLayout>
      <PageContainer maxWidth="md">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              {statusCode && (
                <div className="text-4xl font-bold text-muted-foreground mb-2">
                  {statusCode}
                </div>
              )}
              
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="text-base">
                {description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {children}
              
              <div className="space-y-3">
                {showHomeButton && (
                  <Button asChild className="w-full">
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      返回首页
                    </Link>
                  </Button>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {showBackButton && (
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      返回上页
                    </Button>
                  )}
                  
                  {showRefreshButton && (
                    <Button variant="outline" onClick={handleRefresh}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      刷新页面
                    </Button>
                  )}
                </div>
                
                {showContactButton && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:support@example.com">
                      <Mail className="w-4 h-4 mr-2" />
                      联系支持
                    </a>
                  </Button>
                )}
                
                {customActions}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  如果问题持续存在，请
                  <a 
                    href="mailto:support@example.com" 
                    className="underline hover:text-primary ml-1"
                  >
                    联系我们
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  )
}

/**
 * 404 错误页面
 */
export function NotFoundPage() {
  return (
    <ErrorPageTemplate
      title="页面未找到"
      description="抱歉，您访问的页面不存在或已被移动"
      statusCode={404}
      showRefreshButton={false}
    >
      <p className="text-muted-foreground">
        您可以尝试搜索相关内容，或浏览我们的文章。
      </p>
      
      <div className="mt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/search">
            搜索内容
          </Link>
        </Button>
      </div>
    </ErrorPageTemplate>
  )
}

/**
 * 500 错误页面
 */
export function ServerErrorPage() {
  return (
    <ErrorPageTemplate
      title="服务器错误"
      description="服务器遇到了一个错误，无法完成您的请求"
      statusCode={500}
      showContactButton={true}
    >
      <p className="text-muted-foreground">
        我们已经收到错误报告，正在努力修复这个问题。
      </p>
    </ErrorPageTemplate>
  )
}

/**
 * 网络错误页面
 */
export function NetworkErrorPage() {
  return (
    <ErrorPageTemplate
      title="网络连接错误"
      description="无法连接到服务器，请检查您的网络连接"
      showContactButton={false}
    >
      <p className="text-muted-foreground">
        请检查您的网络连接，然后重试。
      </p>
    </ErrorPageTemplate>
  )
}

/**
 * 权限错误页面
 */
export function UnauthorizedPage() {
  return (
    <ErrorPageTemplate
      title="访问被拒绝"
      description="您没有权限访问此页面"
      statusCode={403}
      showRefreshButton={false}
    >
      <p className="text-muted-foreground">
        请登录后重试，或联系管理员获取访问权限。
      </p>
      
      <div className="mt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/auth/login">
            登录
          </Link>
        </Button>
      </div>
    </ErrorPageTemplate>
  )
}

/**
 * 维护页面
 */
export function MaintenancePage() {
  return (
    <ErrorPageTemplate
      title="系统维护中"
      description="网站正在进行维护，暂时无法访问"
      showBackButton={false}
      showRefreshButton={false}
      showContactButton={false}
    >
      <p className="text-muted-foreground">
        我们正在对系统进行升级维护，预计很快就会恢复正常。
        感谢您的耐心等待。
      </p>
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>预计恢复时间：</strong>
          <br />
          今天 23:00 - 明天 01:00
        </p>
      </div>
    </ErrorPageTemplate>
  )
}
