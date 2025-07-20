import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getPages() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
  const res = await fetch(`${baseUrl}/api/pages`, { cache: "no-store" })
  const json = await res.json()
  if (!json.success) return []
  return json.data.filter((item: any) => item.status === "published")
}

export default async function Pages() {
  const pages = await getPages()
  return (
    <MainLayout>
      <PageContainer maxWidth="2xl">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold">网站说明</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">网站的自定义内容页，如关于、联系、隐私政策、服务条款等</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pages.map((page: any) => (
            <Card key={page.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>{page.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline">
                  <Link href={`/pages/${page.slug}`}>查看详情</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </MainLayout>
  )
} 