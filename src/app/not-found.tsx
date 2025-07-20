import Link from "next/link"
import { FileX, Home, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"

export default function NotFound() {
  return (
    <MainLayout>
      <PageContainer maxWidth="md">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileX className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">404</CardTitle>
              <CardDescription className="text-lg">
                页面未找到
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                抱歉，您访问的页面不存在或已被移动。
              </p>
              
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    返回首页
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/articles">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    浏览文章
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/search">
                    <Search className="w-4 h-4 mr-2" />
                    搜索内容
                  </Link>
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  如果您认为这是一个错误，请
                  <a href="mailto:support@example.com" className="underline hover:text-primary">
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
