import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Loading({ size = "md", className }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size]
      )} />
    </div>
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted rounded", className)} />
  )
}

export function ArticleCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <LoadingSkeleton className="h-5 w-16" />
        <LoadingSkeleton className="h-5 w-12" />
      </div>
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-2/3" />
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <LoadingSkeleton className="h-6 w-6 rounded-full" />
          <LoadingSkeleton className="h-4 w-20" />
        </div>
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loading size="lg" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}
