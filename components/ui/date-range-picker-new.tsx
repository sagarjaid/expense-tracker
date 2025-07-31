"use client"

import * as React from "react"
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  onUpdate?: (values: { from: Date; to: Date }) => void
  initialDateFrom?: Date | string
  initialDateTo?: Date | string
  align?: "start" | "center" | "end"
  locale?: string
  className?: string
}

export function DateRangePicker({
  onUpdate,
  initialDateFrom,
  initialDateTo,
  align = "end",
  locale = "en-US",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Default to current month if no initial dates provided
  const getDefaultDates = () => {
    const today = new Date()
    const firstDayOfMonth = startOfMonth(today)
    const lastDayOfMonth = endOfMonth(today)
    return { from: firstDayOfMonth, to: lastDayOfMonth }
  }

  const defaultDates = getDefaultDates()
  
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    initialDateFrom ? new Date(initialDateFrom) : defaultDates.from
  )
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    initialDateTo ? new Date(initialDateTo) : defaultDates.to
  )

  // Update internal state when props change
  React.useEffect(() => {
    if (initialDateFrom) {
      setDateFrom(new Date(initialDateFrom))
    } else {
      setDateFrom(defaultDates.from)
    }
    if (initialDateTo) {
      setDateTo(new Date(initialDateTo))
    } else {
      setDateTo(defaultDates.to)
    }
  }, [initialDateFrom, initialDateTo])

  const handleUpdate = React.useCallback(() => {
    if (dateFrom && dateTo) {
      onUpdate?.({ from: dateFrom, to: dateTo })
      setIsOpen(false)
    }
  }, [dateFrom, dateTo, onUpdate])

  const handleClear = React.useCallback(() => {
    const defaultDates = getDefaultDates()
    setDateFrom(defaultDates.from)
    setDateTo(defaultDates.to)
    onUpdate?.({ from: defaultDates.from, to: defaultDates.to })
    setIsOpen(false)
  }, [onUpdate])

  const handlePreset = React.useCallback((from: Date, to: Date) => {
    setDateFrom(from)
    setDateTo(to)
  }, [])

  const handleDateInputChange = React.useCallback((field: 'from' | 'to', value: string) => {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      if (field === 'from') {
        setDateFrom(date)
      } else {
        setDateTo(date)
      }
    }
  }, [])

  const getPresetDates = () => {
    const today = new Date()
    const yesterday = subDays(today, 1)
    const last7Days = subDays(today, 7)
    const last14Days = subDays(today, 14)
    const last30Days = subDays(today, 30)
    const thisMonthStart = startOfMonth(today)
    const thisMonthEnd = endOfMonth(today)
    const lastMonthStart = startOfMonth(subDays(today, 30))
    const lastMonthEnd = endOfMonth(subDays(today, 30))
    
    // This year (Jan 1 to Dec 31 of current year)
    const thisYearStart = new Date(today.getFullYear(), 0, 1)
    const thisYearEnd = new Date(today.getFullYear(), 11, 31)
    
    // Last year (Jan 1 to Dec 31 of previous year)
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1)
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)

    return [
      { label: "Today", from: startOfDay(today), to: endOfDay(today) },
      { label: "Yesterday", from: startOfDay(yesterday), to: endOfDay(yesterday) },
      { label: "Last 7 days", from: startOfDay(last7Days), to: endOfDay(today) },
      { label: "Last 14 days", from: startOfDay(last14Days), to: endOfDay(today) },
      { label: "Last 30 days", from: startOfDay(last30Days), to: endOfDay(today) },
      { label: "This Month", from: thisMonthStart, to: thisMonthEnd },
      { label: "Last Month", from: lastMonthStart, to: lastMonthEnd },
      { label: "This Year", from: thisYearStart, to: thisYearEnd },
      { label: "Last Year", from: lastYearStart, to: lastYearEnd },
    ]
  }

  const presets = getPresetDates()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-left font-normal",
            !dateFrom && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateFrom ? (
            dateTo ? (
              <>
                {format(dateFrom, "LLL dd, y")} -{" "}
                {format(dateTo, "LLL dd, y")}
              </>
            ) : (
              format(dateFrom, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[999999]" align={align}>
        <div className="flex">
          <div className="p-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input
                    type="date"
                    value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleDateInputChange('from', e.target.value)}
                    className="w-[120px] h-8 text-xs"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input
                    type="date"
                    value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleDateInputChange('to', e.target.value)}
                    className="w-[120px] h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateFrom,
                    to: dateTo,
                  }}
                  onSelect={(range) => {
                    setDateFrom(range?.from)
                    setDateTo(range?.to)
                  }}
                  numberOfMonths={2}
                  className="rounded-md border"
                />
              </div>
            </div>
          </div>
          <div className="border-l p-3 w-32">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Presets</p>
              <div className="space-y-1 max-h-64">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-xs h-7 px-2"
                    onClick={() => handlePreset(preset.from, preset.to)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 p-3 border-t">
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={!dateFrom || !dateTo}>
            Update
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 