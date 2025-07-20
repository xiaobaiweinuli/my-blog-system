"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  value?: DateRange // 兼容value属性
  onDateChange?: (date: DateRange | undefined) => void
  onChange?: (date: DateRange | undefined) => void // 兼容onChange属性
}

export function DatePickerWithRange({
  className,
  date,
  value,
  onDateChange,
  onChange,
}: DatePickerWithRangeProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date || value)

  const handleDateChange = (newDate: Date | DateRange | undefined) => {
    if (newDate) {
      // 如果是Date类型，转换为DateRange
      if (newDate instanceof Date) {
        const dateRange: DateRange = { from: newDate, to: undefined }
        setSelectedDate(dateRange)
        onDateChange?.(dateRange)
        onChange?.(dateRange)
      } else {
        // 如果是DateRange类型
        setSelectedDate(newDate)
        onDateChange?.(newDate)
        onChange?.(newDate)
      }
    } else {
      setSelectedDate(undefined)
      onDateChange?.(undefined)
      onChange?.(undefined)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {selectedDate.from.toLocaleDateString()} -{" "}
                  {selectedDate.to.toLocaleDateString()}
                </>
              ) : (
                selectedDate.from.toLocaleDateString()
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
