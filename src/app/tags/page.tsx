import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import { PageContainer } from '@/components/layout/page-container'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default async function TagsPage() {
  // 使用完整 URL 进行服务端渲染
  const res = await fetch(`${API_BASE_URL}/api/tags`, { cache: 'no-store' });
  const data = await res.json();
  const tags = data.data || [];

  return (
    <MainLayout>
      <PageContainer maxWidth="full">
        <div className="py-10">
          <h1 className="text-3xl font-bold mb-6 text-center">标签云</h1>
          {tags.length === 0 ? (
            <div className="text-center text-muted-foreground">暂无标签</div>
          ) : (
            <div
              className="flex flex-wrap gap-x-8 gap-y-6 justify-center items-center min-h-[500px]"
              style={{ maxWidth: "1200px", margin: "0 auto" }}
            >
              {tags.map((tag: any, idx: number) => {
                const fontSize = Math.min(2.2, 1 + 0.1 * (tag.count || 5)) + 'rem'
                // 横向轻微随机偏移（-20~+40px）
                const ml = Math.floor((Math.random() * 60) - 20)
                const rotate = (Math.random() - 0.5) * 8
                return (
                  <Link key={tag.slug} href={`/articles?tag=${tag.slug}`}>
                    <Badge
                      variant="outline"
                      className="px-4 py-2 cursor-pointer transition-all hover:bg-primary/10 hover:scale-110 hover:shadow-lg"
                      style={{
                        fontSize,
                        marginLeft: `${ml}px`,
                        transform: `rotate(${rotate}deg)`
                      }}
                    >
                      {tag.name}
                      <span className="ml-2 text-xs text-muted-foreground">({tag.slug})</span>
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  )
} 