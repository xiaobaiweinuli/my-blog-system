import { requireCollaborator } from "@/lib/auth-utils"
import { FileManager } from "@/components/files/file-manager"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"

export default async function FilesPage() {
  const user = await requireCollaborator()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">文件管理</h1>
        <p className="text-muted-foreground">
          上传、管理和组织您的媒体文件
        </p>
      </div>
      <FileManager user={user} />
    </div>
  )
}
