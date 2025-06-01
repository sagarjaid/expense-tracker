/** @format */

'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const categories = ['Needs', 'Wants', 'Investment'];
const subcategories: Record<string, string[]> = {
  Needs: [
    'Rent',
    'Food and Grocery',
    'Mobile',
    'Clothes',
    'Transport',
    'Bills',
    'Health insurance',
    'TDS',
    'Shopping',
    'Grooming',
    'Lending',
    'EMI',
    'Wife',
    'Other',
  ],
  Wants: [
    'Dining Out',
    'Entertainment',
    'Yearly travel plan',
    'Car/Bike',
    'New Gadget',
    'Phone',
    'Startup',
    'Other',
  ],
  Investment: [
    'PPF',
    'NPS',
    'Term Insurance',
    'Emergency Fund',
    'ELSS (MF)',
    'LIC',
    'Stocks/Index',
    'Home',
    'Other',
  ],
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getFirstAndLastDayOfMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { first, last };
}

export default function ExpenseSummary() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const { first: defaultStart, last: defaultEnd } = getFirstAndLastDayOfMonth(
    selectedYear,
    selectedMonth
  );
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd);
  const [totals, setTotals] = useState<{
    [cat: string]: { [subcat: string]: number };
  }>({});
  const [loading, setLoading] = useState(true);

  // Update start/end date when month/year changes
  useEffect(() => {
    const { first, last } = getFirstAndLastDayOfMonth(
      selectedYear,
      selectedMonth
    );
    setStartDate(first);
    setEndDate(last);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTotals({});
        setLoading(false);
        return;
      }
      let query = supabase
        .from('expenses')
        .select('amount, category, subcategory, date')
        .eq('user_id', user.id);
      if (startDate) {
        query = query.gte('date', startDate.toISOString().slice(0, 10));
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().slice(0, 10));
      }
      const { data, error } = await query;
      if (error || !data) {
        setTotals({});
      } else {
        const sums: { [cat: string]: { [subcat: string]: number } } = {};
        for (const cat of categories) {
          sums[cat] = {};
          for (const subcat of subcategories[cat]) {
            sums[cat][subcat] = 0;
          }
        }
        for (const exp of data) {
          if (
            categories.includes(exp.category) &&
            subcategories[exp.category]?.includes(exp.subcategory)
          ) {
            sums[exp.category][exp.subcategory] += Number(exp.amount);
          }
        }
        setTotals(sums);
      }
      setLoading(false);
    };
    fetchSummary();
  }, [startDate, endDate]);

  // Years for dropdown (current year +/- 5)
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => now.getFullYear() - 5 + i
  );

  return (
    <Card className='mt-6'>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-4 mb-4 items-center'>
          <select
            className='h-9 rounded-md border px-3 py-1 text-base bg-transparent'
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {monthNames.map((name, idx) => (
              <option
                key={name}
                value={idx}>
                {name}
              </option>
            ))}
          </select>
          <select
            className='h-9 rounded-md border px-3 py-1 text-base bg-transparent'
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {yearOptions.map((y) => (
              <option
                key={y}
                value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className='text-center py-8'>Loading...</div>
        ) : Object.keys(totals).length === 0 ? (
          <div className='text-center py-8'>No expenses found.</div>
        ) : (
          <div className='space-y-8'>
            {categories.map((cat) => (
              <div
                key={cat}
                className=''>
                <div className='text-lg font-semibold mb-2'>{cat}</div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {subcategories[cat].map((subcat) => (
                    <div
                      key={subcat}
                      className='flex justify-between border-b py-1'>
                      <span>{subcat}</span>
                      <span className='font-bold'>
                        ₹{totals[cat]?.[subcat]?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className='mt-2 font-bold text-right'>
                  Total: ₹
                  {Object.values(totals[cat] || {})
                    .reduce((a, b) => a + b, 0)
                    .toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
