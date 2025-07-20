import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { notFound } from "next/navigation"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Metadata } from "next"

interface PageDetailProps {
  params: { slug: string }
}

async function getPageDetail(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
  const res = await fetch(`${baseUrl}/api/pages?slug=${slug}`, { cache: "no-store" })
  const json = await res.json()
  if (!json.success || !json.data || !json.data.length) return null
  return json.data[0]
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageDetail(slug)
  if (!page) return {}
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.excerpt || page.title,
  }
}

export default async function PageDetail({ params }: PageDetailProps) {
  const { slug } = await params
  const page = await getPageDetail(slug)
  if (!page) return notFound()
  return (
    <MainLayout>
      <PageContainer maxWidth="md">
        <div className="space-y-8 max-w-2xl mx-auto bg-white/80 rounded-xl shadow p-8 mt-8">
          <h1 className="text-4xl font-bold text-center mb-4 text-primary">{page.title}</h1>
          {page.excerpt && <p className="text-center text-lg text-muted-foreground mb-6">{page.excerpt}</p>}
          <div className="prose mx-auto min-h-[200px]">
            <MarkdownRenderer content={page.content || ''} />
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  )
} 