/**
 * 全局错误处理服务
 * 提供统一的错误处理和上报功能
 */

export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  errorBoundary?: string
  url?: string
  userAgent?: string
  timestamp: number
  userId?: string
  sessionId?: string
  buildId?: string
}

export interface ErrorHandlerOptions {
  enableConsoleLog?: boolean
  enableRemoteLogging?: boolean
  remoteEndpoint?: string
  maxRetries?: number
  retryDelay?: number
}

class ErrorHandler {
  private options: ErrorHandlerOptions
  private errorQueue: ErrorInfo[] = []
  private isOnline = true

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      enableConsoleLog: true,
      enableRemoteLogging: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...options,
    }

    this.setupGlobalErrorHandlers()
    this.setupNetworkStatusListener()
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers() {
    if (typeof window === "undefined") return

    // 处理 JavaScript 错误
    window.addEventListener("error", (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: Date.now(),
      })
    })

    // 处理 Promise 拒绝
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
      })
    })

    // 处理资源加载错误
    window.addEventListener(
      "error",
      (event) => {
        if (event.target !== window) {
          const target = event.target as HTMLElement
          this.handleError({
            message: `Resource loading error: ${target.tagName}`,
            url: (target as any).src || (target as any).href || window.location.href,
            timestamp: Date.now(),
          })
        }
      },
      true
    )
  }

  /**
   * 设置网络状态监听器
   */
  private setupNetworkStatusListener() {
    if (typeof window === "undefined") return

    window.addEventListener("online", () => {
      this.isOnline = true
      this.flushErrorQueue()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })
  }

  /**
   * 处理错误
   */
  public handleError(errorInfo: Partial<ErrorInfo>) {
    const fullErrorInfo: ErrorInfo = {
      message: "Unknown error",
      timestamp: Date.now(),
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
      ...errorInfo,
    }

    // 控制台日志
    if (this.options.enableConsoleLog) {
      console.error("Error caught by ErrorHandler:", fullErrorInfo)
    }

    // 添加到队列
    this.errorQueue.push(fullErrorInfo)

    // 尝试上报
    if (this.options.enableRemoteLogging && this.isOnline) {
      this.reportError(fullErrorInfo)
    }
  }

  /**
   * 上报错误到远程服务
   */
  private async reportError(errorInfo: ErrorInfo, retryCount = 0) {
    if (!this.options.remoteEndpoint) return

    try {
      const response = await fetch(this.options.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorInfo),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // 成功上报，从队列中移除
      const index = this.errorQueue.indexOf(errorInfo)
      if (index > -1) {
        this.errorQueue.splice(index, 1)
      }
    } catch (error) {
      console.error("Failed to report error:", error)

      // 重试逻辑
      if (retryCount < (this.options.maxRetries || 3)) {
        setTimeout(() => {
          this.reportError(errorInfo, retryCount + 1)
        }, (this.options.retryDelay || 1000) * Math.pow(2, retryCount))
      }
    }
  }

  /**
   * 刷新错误队列
   */
  private flushErrorQueue() {
    if (!this.options.enableRemoteLogging || !this.isOnline) return

    const errors = [...this.errorQueue]
    errors.forEach((error) => {
      this.reportError(error)
    })
  }

  /**
   * 手动报告错误
   */
  public reportManualError(error: Error, context?: Record<string, any>) {
    this.handleError({
      message: error.message,
      stack: error.stack,
      ...context,
    })
  }

  /**
   * 设置用户信息
   */
  public setUser(userId: string, sessionId?: string) {
    this.errorQueue.forEach((error) => {
      error.userId = userId
      if (sessionId) error.sessionId = sessionId
    })
  }

  /**
   * 清空错误队列
   */
  public clearErrorQueue() {
    this.errorQueue = []
  }

  /**
   * 获取错误统计
   */
  public getErrorStats() {
    const stats = {
      totalErrors: this.errorQueue.length,
      errorsByType: {} as Record<string, number>,
      recentErrors: this.errorQueue.slice(-10),
    }

    this.errorQueue.forEach((error) => {
      const type = error.message.split(":")[0] || "Unknown"
      stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1
    })

    return stats
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler({
  enableConsoleLog: process.env.NODE_ENV === "development",
  enableRemoteLogging: process.env.NODE_ENV === "production",
  remoteEndpoint: process.env.NEXT_PUBLIC_ERROR_ENDPOINT,
})

/**
 * React 错误处理 Hook
 */
export function useErrorHandler() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    errorHandler.reportManualError(error, context)
  }

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      reportError(error as Error, context)
      return null
    }
  }

  return {
    reportError,
    handleAsyncError,
  }
}

/**
 * API 错误处理装饰器
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: Record<string, any>
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args)
      
      // 如果返回 Promise，处理异步错误
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.reportManualError(error, {
            functionName: fn.name,
            arguments: args,
            ...context,
          })
          throw error
        })
      }
      
      return result
    } catch (error) {
      errorHandler.reportManualError(error as Error, {
        functionName: fn.name,
        arguments: args,
        ...context,
      })
      throw error
    }
  }) as T
}
