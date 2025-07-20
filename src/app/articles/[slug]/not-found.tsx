import Link from "next/link"
import { FileX, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"

export default function ArticleNotFound() {
  return (
    <MainLayout>
      <PageContainer maxWidth="md">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileX className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">文章未找到</CardTitle>
              <CardDescription>
                抱歉，您访问的文章不存在或已被删除
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>可能的原因：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>文章链接有误</li>
                  <li>文章已被删除</li>
                  <li>文章尚未发布</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/articles">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回文章列表
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    返回首页
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  )
}
