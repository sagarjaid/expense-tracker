/** @format */

'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { format, parse } from 'date-fns';
import { Download } from 'lucide-react';

function toCSV(rows: any[]) {
  if (!rows.length) return '';

  // Log raw data to see what we're getting
  console.log('Raw data from DB:', rows);

  // Define the headers in the desired order
  const headers = ['date', 'category', 'subcategory', 'description', 'amount'];

  // Sort rows by date first
  const sortedRows = [...rows].sort((a, b) => {
    // Parse dates for proper comparison
    const dateA = parse(a.date, 'yyyy-MM-dd', new Date());
    const dateB = parse(b.date, 'yyyy-MM-dd', new Date());
    return dateA.getTime() - dateB.getTime();
  });

  // Format the data according to the headers
  const csvRows = sortedRows.map((row) => {
    return headers
      .map((header) => {
        // Handle date formatting
        if (header === 'date') {
          // Parse the date from yyyy-MM-dd and format to dd-MM-yyyy
          const date = parse(row[header], 'yyyy-MM-dd', new Date());
          return format(date, 'dd-MMMM-yyyy');
        }
        // Format amount with 2 decimal places
        if (header === 'amount') {
          return Number(row[header]).toFixed(2);
        }
        // For other fields, just return the value
        return JSON.stringify(row[header] ?? '');
      })
      .join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}

export default function ExportCSVButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('expenses')
      .select('date, category, subcategory, description, amount')
      .eq('user_id', user.id);
    if (error || !data) {
      setError('Failed to fetch expenses.');
      setLoading(false);
      return;
    }
    console.log('Data from Supabase:', data); // Log the data right after fetching
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={loading}
        variant='outline'
        size='sm'
        className='h-8 px-2'>
        <Download className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      {error && <div className='text-sm text-red-500 mt-2'>{error}</div>}
    </div>
  );
}
