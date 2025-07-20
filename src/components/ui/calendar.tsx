"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | DateRange
  onSelect?: (date: Date | DateRange | undefined) => void
  defaultMonth?: Date
  numberOfMonths?: number
  className?: string
  initialFocus?: boolean
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  defaultMonth = new Date(),
  numberOfMonths = 1,
  className,
  initialFocus,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(defaultMonth)

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]
  
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    if (mode === 'single') {
      onSelect?.(clickedDate)
    } else if (mode === 'range') {
      const range = selected as DateRange
      if (!range?.from || (range.from && range.to)) {
        // 开始新的范围选择
        onSelect?.({ from: clickedDate, to: undefined })
      } else if (range.from && !range.to) {
        // 完成范围选择
        if (clickedDate >= range.from) {
          onSelect?.({ from: range.from, to: clickedDate })
        } else {
          onSelect?.({ from: clickedDate, to: range.from })
        }
      }
    }
  }

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    if (mode === 'single') {
      const selectedDate = selected as Date
      return selectedDate && 
             date.getDate() === selectedDate.getDate() &&
             date.getMonth() === selectedDate.getMonth() &&
             date.getFullYear() === selectedDate.getFullYear()
    } else if (mode === 'range') {
      const range = selected as DateRange
      if (!range?.from) return false
      
      if (range.from && !range.to) {
        return date.getTime() === range.from.getTime()
      }
      
      if (range.from && range.to) {
        return date >= range.from && date <= range.to
      }
    }
    
    return false
  }

  const isDateInRange = (day: number) => {
    if (mode !== 'range') return false
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const range = selected as DateRange
    
    if (!range?.from || !range.to) return false
    
    return date > range.from && date < range.to
  }

  const renderDays = () => {
    const days = []
    
    // 添加空白天数（月初前的空白）
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    
    // 添加月份中的天数
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day)
      const isInRange = isDateInRange(day)
      
      days.push(
        <button
          key={day}
          type="button"
          id={`calendar-day-${day}`}
          onClick={() => handleDateClick(day)}
          className={cn(
            "p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            isInRange && "bg-accent text-accent-foreground"
          )}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-xs font-medium text-muted-foreground text-center">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  )
}
