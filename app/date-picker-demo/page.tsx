'use client';

import React, { useState } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker-new';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function DatePickerDemo() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Date Range Picker Demo</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Date Range Picker</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker
              onUpdate={setDateRange}
              align="start"
            />
            {dateRange && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected Range:</p>
                <p className="font-medium">
                  {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date Range Picker with Initial Values</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker
              initialDateFrom={new Date('2024-01-01')}
              initialDateTo={new Date('2024-01-31')}
              onUpdate={(range) => console.log('Date range updated:', range)}
              align="center"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Two-month calendar view for easy range selection</li>
              <li>• Preset date ranges (Today, Yesterday, Last 7 days, etc.)</li>
              <li>• Manual date input with calendar picker</li>
              <li>• Clear and Update buttons</li>
              <li>• Responsive design</li>
              <li>• No compare option (as requested)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 