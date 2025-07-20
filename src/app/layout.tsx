import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AppToaster } from "@/components/ui/toast"
import ClientProviders from "../components/providers/client-providers";

export const metadata: Metadata = {
  title: "现代博客系统",
  description: "基于 Next.js 和 Cloudflare Workers 的现代化博客系统",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans">
        <ClientProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <AppToaster />
          </ThemeProvider>
        </ClientProviders>
      </body>
    </html>
  )
}
