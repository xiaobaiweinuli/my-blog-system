import Link from "next/link"
import { Github, Twitter, Mail } from "lucide-react"
import { siteConfig } from "@/config/site"
import { useEffect, useState } from "react"

export function Footer() {
  const [year, setYear] = useState<string>("")
  useEffect(() => {
    setYear(new Date().getFullYear().toString())
  }, [])
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto py-8 md:py-12">
        {/* Hide main footer content on mobile, show only on md and up */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* 网站信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{siteConfig.name}</h3>
            <p className="text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
            <div className="flex space-x-4">
              {siteConfig.links.github && (
                <Link
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </Link>
              )}
              {siteConfig.links.twitter && (
                <Link
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
              <Link
                href={`mailto:${siteConfig.author.email}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/articles" className="text-muted-foreground hover:text-foreground">
                  文章列表
                </Link>
              </li>
              <li>
                <Link href="/archive" className="text-muted-foreground hover:text-foreground">
                  文章归档
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-muted-foreground hover:text-foreground">
                  标签云
                </Link>
              </li>
              <li>
                <Link href="/pages/about" className="text-muted-foreground hover:text-foreground">
                  关于我们
                </Link>
              </li>
            </ul>
          </div>

          {/* 功能页面 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">功能页面</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/now" className="text-muted-foreground hover:text-foreground">
                  此刻
                </Link>
              </li>
              <li>
                <Link href="/guestbook" className="text-muted-foreground hover:text-foreground">
                  留言板
                </Link>
              </li>
              <li>
                <Link href="/friends" className="text-muted-foreground hover:text-foreground">
                  友情链接
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-muted-foreground hover:text-foreground">
                  更新日志
                </Link>
              </li>
            </ul>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">其他</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rss" className="text-muted-foreground hover:text-foreground">
                  RSS 订阅
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-muted-foreground hover:text-foreground">
                  网站地图
                </Link>
              </li>
              <li>
                <Link href="/pages/privacy" className="text-muted-foreground hover:text-foreground">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/pages/terms" className="text-muted-foreground hover:text-foreground">
                  使用条款
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="md:mt-8 md:pt-8 md:border-t w-full text-center text-sm text-muted-foreground mx-auto flex flex-col items-center">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="mt-2">
            Built with ❤️ using Next.js, Tailwind CSS, and Shadcn UI
          </p>
        </div>
      </div>
    </footer>
  )
}
