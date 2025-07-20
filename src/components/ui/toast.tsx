'use client'

// import { Toaster as Sonner } from 'sonner'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

// 客户端安全的ID生成
function generateId(): string {
  if (typeof window === 'undefined') {
    return 'temp-id';
  }
  return Math.random().toString(36).substr(2, 9);
}

// 临时的Toaster组件，直到安装sonner包
const Sonner = ({ children, ...props }: any) => <div {...props}>{children}</div>

type ToasterProps = React.ComponentProps<typeof Sonner>

const AppToaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      {...props}
    />
  )
}

export { AppToaster };

/**
 * Toast 工具函数
 */
import { toast } from 'sonner'

export const showToast = {
  success: (message: string, values?: any) => {
    const id = generateId()
    toast.success(message, { id, ...values })
    return id
  },
  
  error: (message: string, values?: any) => {
    const id = generateId()
    toast.error(message, { id, ...values })
    return id
  },
  
  warning: (message: string, values?: any) => {
    const id = generateId()
    toast.warning(message, { id, ...values })
    return id
  },
  
  info: (message: string, values?: any) => {
    const id = generateId()
    toast.info(message, { id, ...values })
    return id
  },
  
  loading: (message: string, values?: any) => {
    const id = generateId()
    toast.loading(message, { id, ...values })
    return id
  },
  
  promise: function<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: any
  ): string | number {
    // 简化的promise toast实现
    const id = generateId()
    toast.loading(messages.loading, { id, ...options })

    promise
      .then((data) => {
        const successMsg = typeof messages.success === 'function'
          ? messages.success(data)
          : messages.success
        toast.success(successMsg, { id, ...options })
      })
      .catch((error) => {
        const errorMsg = typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error
        toast.error(errorMsg, { id, ...options })
      })

    return id
  },
  
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId)
  },
  
  custom: (jsx: React.ReactNode, options?: any) => {
    // 简化的custom toast实现
    const id = generateId()
    if (jsx) {
      toast.success(jsx.toString(), { id, ...options })
    }
    return id
  },
}

/**
 * Toast Hook
 */
export function useToast() {
  return {
    success: (message: string, values?: any) => showToast.success(message, values),
    error: (message: string, values?: any) => showToast.error(message, values),
    warning: (message: string, values?: any) => showToast.warning(message, values),
    info: (message: string, values?: any) => showToast.info(message, values),
    loading: (message: string, values?: any) => showToast.loading(message, values),
    promise: function<T>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ): string | number {
      return showToast.promise(promise, messages)
    },
    dismiss: showToast.dismiss,
    custom: showToast.custom,
    // 添加showToast属性以兼容现有组件
    showToast: showToast,
  }
}

/**
 * API 请求 Toast Hook
 */
export function useApiToast() {
  const handleApiCall = async function<T>(
    apiCall: () => Promise<T>,
    options: {
      loadingMessage?: string
      successMessage?: string | ((data: T) => string)
      errorMessage?: string | ((error: any) => string)
      showLoading?: boolean
      showSuccess?: boolean
      showError?: boolean
    } = {}
  ): Promise<T> {
    const {
      loadingMessage = '加载中...',
      successMessage = '操作成功',
      errorMessage = '操作失败',
      showLoading = true,
      showSuccess = true,
      showError = true,
    } = options

    let loadingToast: string | number | undefined

    try {
      if (showLoading) {
        loadingToast = showToast.loading(loadingMessage)
      }

      const result = await apiCall()

      if (loadingToast) {
        showToast.dismiss(loadingToast)
      }

      if (showSuccess) {
        const message = typeof successMessage === 'function' 
          ? successMessage(result) 
          : successMessage
        showToast.success(message)
      }

      return result
    } catch (error) {
      if (loadingToast) {
        showToast.dismiss(loadingToast)
      }

      if (showError) {
        const message = typeof errorMessage === 'function' 
          ? errorMessage(error) 
          : errorMessage
        showToast.error(message)
      }

      throw error
    }
  }

  return { handleApiCall }
}

/**
 * 表单提交 Toast Hook
 */
export function useFormToast() {
  const handleFormSubmit = async function<T>(
    submitFn: () => Promise<T>,
    options: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (data: T) => void
      onError?: (error: any) => void
    } = {}
  ) {
    const {
      successMessage = '提交成功',
      errorMessage = '提交失败',
      onSuccess,
      onError,
    } = options

    try {
      const result = await submitFn()
      showToast.success(successMessage)
      onSuccess?.(result)
      return result
    } catch (error) {
      showToast.error(errorMessage)
      onError?.(error)
      throw error
    }
  }

  return { handleFormSubmit }
}

/**
 * 文件上传 Toast Hook
 */
export function useFileUploadToast() {
  const handleFileUpload = async (
    uploadFn: (onProgress?: (progress: number) => void) => Promise<any>,
    options: {
      successMessage?: string
      errorMessage?: string
      showProgress?: boolean
    } = {}
  ) => {
    const {
      successMessage = '上传成功',
      errorMessage = '上传失败',
      showProgress = true,
    } = options

    try {
      const result = await uploadFn()
      showToast.success(successMessage)
      return result
    } catch (error) {
      showToast.error(errorMessage)
      throw error
    }
  }

  return { handleFileUpload }
}

/**
 * 复制到剪贴板 Toast Hook
 */
export function useCopyToast() {
  const copyToClipboard = async (text: string, successMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast.success(successMessage || '复制成功')
    } catch (error) {
      showToast.error('复制失败')
    }
  }

  return { copyToClipboard }
}
