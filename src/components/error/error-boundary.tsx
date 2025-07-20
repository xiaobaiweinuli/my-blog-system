"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { secureFetch } from '@/lib/utils/secure-fetch';
import { getCurrentTimestamp, generateId } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'component' | 'critical'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * 错误边界组件
 * 捕获子组件中的 JavaScript 错误，并显示备用 UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: `error_${getCurrentTimestamp()}_${generateId()}`,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state，下次渲染时显示备用 UI
    return {
      hasError: true,
      error,
      errorId: `error_${getCurrentTimestamp()}_${generateId()}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    this.setState({ errorInfo })

    // 调用错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 记录错误到控制台
    console.error("Error caught by ErrorBoundary:", error, errorInfo)

    // 发送错误到监控服务
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 发送到自定义错误收集 API
    if (process.env.NODE_ENV === 'production') {
      const errorReport = {
        errorId: this.state.errorId,
        timestamp: new Date(getCurrentTimestamp()).toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : '',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
      }
      secureFetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(console.error)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback，则使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 根据错误级别显示不同的错误界面
      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI() {
    const { level = 'component', showDetails = false } = this.props
    const { error, errorInfo, errorId } = this.state

    if (level === 'critical') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">系统错误</CardTitle>
              <CardDescription>
                应用程序遇到了严重错误，请刷新页面或联系技术支持
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDetails && error && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-medium text-destructive mb-2">错误详情:</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {error.message}
                  </p>
                  {errorId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      错误ID: {errorId}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  刷新页面
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (level === 'page') {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>页面加载失败</CardTitle>
              <CardDescription>
                页面在加载过程中遇到了错误，请尝试刷新页面
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDetails && error && (
                <details className="rounded-md bg-muted p-3">
                  <summary className="text-sm font-medium text-destructive cursor-pointer mb-2">
                    查看错误详情
                  </summary>
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                    {error.message}
                    {errorInfo?.componentStack}
                  </pre>
                  {errorId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      错误ID: {errorId}
                    </p>
                  )}
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button variant="outline" onClick={this.handleReload}>
                  刷新页面
                </Button>
                <Button variant="outline" onClick={this.handleGoHome}>
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // 组件级错误 - 保持原有的简单样式
    return (
      <Card className="border-destructive">
        <CardHeader className="bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>组件加载失败</CardTitle>
          </div>
          <CardDescription>
            这个组件在渲染时遇到了错误
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              很抱歉，页面的这一部分遇到了问题。您可以尝试重新加载这个组件。
            </p>
              
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="p-4 bg-muted rounded-lg overflow-auto max-h-40">
                  <p className="font-mono text-sm text-destructive">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
              
              <div className="flex gap-4">
                <Button onClick={this.handleReset}>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  重试
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  刷新页面
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
  }
}

/**
 * 错误页面组件
 * 用于全局错误处理
 */
export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>出错了</CardTitle>
          </div>
          <CardDescription>
            页面加载过程中发生错误
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              很抱歉，页面加载过程中遇到了问题。您可以尝试刷新页面或返回首页。
            </p>
            
            {process.env.NODE_ENV === "development" && (
              <div className="p-4 bg-muted rounded-lg overflow-auto max-h-40">
                <p className="font-mono text-sm text-destructive">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-muted-foreground">
                    {error.stack}
                  </pre>
                )}
                {error.digest && (
                  <p className="mt-2 text-xs">
                    错误 ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-4">
              <Button onClick={reset}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                重试
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                返回首页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 错误边界 HOC
 * 为组件包装错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * 页面级错误边界
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * 组件级错误边界
 */
export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * 关键错误边界
 */
export function CriticalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="critical" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * 异步错误边界 Hook
 */
export function useAsyncError() {
  const [, setError] = React.useState()

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}
