/** @format */

'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function toCSV(rows: any[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(
    rows.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    )
  );
  return csv.join('\n');
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
      .select('amount, description, category, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (error || !data) {
      setError('Failed to fetch expenses.');
      setLoading(false);
      return;
    }
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
    <div className='mt-4'>
      <Button
        onClick={handleExport}
        disabled={loading}>
        {loading ? 'Exporting...' : 'Export CSV'}
      </Button>
      {error && <div className='text-sm text-red-500 mt-2'>{error}</div>}
    </div>
  );
}
