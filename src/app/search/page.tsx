import { Suspense } from "react"
import { SearchInterface } from "@/components/search/search-interface"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { SearchResultsStructuredData } from "@/components/seo/structured-data"
import { generateSearchMetadata } from "@/lib/seo"
import type { Metadata } from "next"

interface SearchPageProps {
  searchParams: {
    q?: string
    page?: string
    category?: string
    tag?: string
  }
}

// 生成页面元数据
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const query = params.q
  return generateSearchMetadata(query)
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ""
  const page = parseInt(params.page || "1")
  const category = params.category || ""
  const tag = params.tag || ""

  return (
    <MainLayout>
      <PageContainer maxWidth="full">
        <div className="space-y-6">
          {/* 页面标题 */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">搜索</h1>
            {query ? (
              <p className="text-xl text-muted-foreground">
                搜索结果: "{query}"
              </p>
            ) : (
              <p className="text-xl text-muted-foreground">
                搜索网站内容
              </p>
            )}
          </div>

          {/* 搜索界面 */}
          <Suspense fallback={<div>加载中...</div>}>
            <SearchInterface
              initialQuery={query}
              initialPage={page}
              initialCategory={category}
              initialTag={tag}
            />
          </Suspense>
        </div>
      </PageContainer>
    </MainLayout>
  )
}
