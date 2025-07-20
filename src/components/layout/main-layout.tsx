"use client"

import { ReactNode, useEffect, useState } from "react"
import { Header } from "./header"
import { Footer } from "./footer"
import { BottomNav } from "./bottom-nav"
import { PageTransition } from "@/components/ui/page-transition"
import { SkipLinks } from "@/components/accessibility/skip-links"
import { KeyboardShortcuts } from "@/components/accessibility/keyboard-shortcuts"
import { AppToaster } from "@/components/ui/toast"
import { PageErrorBoundary } from "@/components/error/error-boundary"

interface MainLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  enableTransition?: boolean
}

export function MainLayout({
  children,
  showBottomNav = true,
  enableTransition = true
}: MainLayoutProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const content = (
    <PageErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <SkipLinks />
        {/* 始终渲染完整版 Header，确保所有导航入口都显示 */}
        <Header />
        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 pb-20 md:pb-8" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        {showBottomNav && <BottomNav />}
        <KeyboardShortcuts />
        {mounted && <AppToaster />}
      </div>
    </PageErrorBoundary>
  )

  if (enableTransition) {
    return <PageTransition>{content}</PageTransition>
  }

  return content
}
