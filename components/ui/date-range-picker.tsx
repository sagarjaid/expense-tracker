/** @format */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ date, onDateChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-40 justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}>
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? format(date, 'dd/MM/yyyy') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(newDate) => {
            onDateChange(newDate);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Legacy DateRangePicker - keeping for backward compatibility
export function DateRangePicker() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  return (
    <div className='flex items-center gap-2'>
      <span>From:</span>
      <DatePicker
        date={startDate ? new Date(startDate) : undefined}
        onDateChange={(date) => {
          setStartDate(date ? format(date, 'dd-MM-yyyy') : '');
        }}
        className='w-40'
      />
      <span>To:</span>
      <DatePicker
        date={endDate ? new Date(endDate) : undefined}
        onDateChange={(date) => {
          setEndDate(date ? format(date, 'dd-MM-yyyy') : '');
        }}
        className='w-40'
      />
    </div>
  );
}

// Re-export the new DateRangePicker for convenience
export { DateRangePicker as DateRangePickerNew } from './date-range-picker-new';
