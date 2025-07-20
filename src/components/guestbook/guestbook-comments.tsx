"use client"
import dynamic from "next/dynamic"

const SimpleGiscusComments = dynamic(
  () => import("@/components/comments/giscus-comments").then(m => m.SimpleGiscusComments),
  { ssr: false }
)

export default function GuestbookComments() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">开始留言</h2>
        <p className="text-muted-foreground">
          使用 GitHub 账号登录即可参与讨论
        </p>
      </div>
      {/* Giscus 评论组件 */}
      <SimpleGiscusComments mapping="specific" term="guestbook" />
    </div>
  )
} 