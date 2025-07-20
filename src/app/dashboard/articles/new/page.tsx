import { requireCollaborator } from "@/lib/auth-utils"
import { ArticleEditor } from "@/components/article/article-editor"

export default async function NewArticlePage() {
  const user = await requireCollaborator()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">创建新文章</h1>
        <p className="text-muted-foreground">
          使用 Markdown 编辑器创建您的文章内容
        </p>
      </div>
      <ArticleEditor user={user} />
    </div>
  )
}
