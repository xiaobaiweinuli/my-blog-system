"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  id?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({
    value,
    defaultValue = [0],
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || defaultValue)
    const sliderRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (value) {
        setInternalValue(value)
      }
    }, [value])

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = (e.clientX - rect.left) / rect.width
      const newValue = Math.round((min + percentage * (max - min)) / step) * step
      const clampedValue = Math.max(min, Math.min(max, newValue))

      const newValues = [clampedValue]
      setInternalValue(newValues)
      onValueChange?.(newValues)
    }

    const currentValue = internalValue[0] || 0
    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <div
          ref={sliderRef}
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 -translate-y-1/2 top-1/2"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
