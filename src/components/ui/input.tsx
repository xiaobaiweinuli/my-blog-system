import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  required,
  ...props
}: React.ComponentProps<"input">) {
  // 确保输入框有适当的无障碍标签
  const hasAccessibleLabel = id || ariaLabel || ariaDescribedby || props["aria-labelledby"]

  if (!hasAccessibleLabel && process.env.NODE_ENV === "development") {
    console.warn(
      "Input component is missing an accessible label. " +
      "Add an id (paired with a label), aria-label, aria-labelledby, or aria-describedby attribute."
    )
  }

  return (
    <input
      type={type}
      id={id}
      data-slot="input"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      required={required}
      aria-required={required}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
