/** @format */

'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const categories = ['All', 'Needs', 'Wants', 'Investment'];
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

export default function ExpenseList({
  initialCategory = 'All',
}: {
  initialCategory?: string;
}) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const { first: defaultStart, last: defaultEnd } = getFirstAndLastDayOfMonth(
    selectedYear,
    selectedMonth
  );
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState<string>('');

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
    const fetchExpenses = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setExpenses([]);
        setLoading(false);
        return;
      }
      let query = supabase
        .from('expenses')
        .select('id, amount, description, category, subcategory, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (category !== 'All') {
        query = query.eq('category', category);
      }
      if (category !== 'All' && subcategory) {
        query = query.eq('subcategory', subcategory);
      }
      if (startDate) {
        query = query.gte('date', startDate.toISOString().slice(0, 10));
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().slice(0, 10));
      }
      const { data, error } = await query;
      if (!error) {
        setExpenses(data || []);
      } else {
        setExpenses([]);
      }
      setLoading(false);
    };
    fetchExpenses();
  }, [category, subcategory, startDate, endDate]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategory('');
  }, [category]);

  // Years for dropdown (current year +/- 5)
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => now.getFullYear() - 5 + i
  );

  return (
    <Card className='mt-6'>
      <CardContent className='p-4'>
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
          <select
            className='w-40 h-9 rounded-md border px-3 py-1 text-base bg-transparent'
            value={category}
            onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option
                key={cat}
                value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {category !== 'All' && (
            <select
              className='w-40 h-9 rounded-md border px-3 py-1 text-base bg-transparent'
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}>
              <option value=''>All Subcategories</option>
              {subcategories[category]?.map((subcat) => (
                <option
                  key={subcat}
                  value={subcat}>
                  {subcat}
                </option>
              ))}
            </select>
          )}
          <div className='flex gap-2 items-center'>
            <span className='text-sm'>From:</span>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
            />
            <span className='text-sm'>To:</span>
            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}>
              Clear Dates
            </Button>
          </div>
        </div>
        {loading ? (
          <div className='text-center py-8'>Loading...</div>
        ) : expenses.length === 0 ? (
          <div className='text-center py-8'>No expenses found.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='border-b'>
                  <th className='px-2 py-2 text-left'>Amount</th>
                  <th className='px-2 py-2 text-left'>Description</th>
                  <th className='px-2 py-2 text-left'>Category</th>
                  <th className='px-2 py-2 text-left'>Subcategory</th>
                  <th className='px-2 py-2 text-left'>Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className='border-b hover:bg-muted/30'>
                    <td className='px-2 py-2'>
                      ₹{Number(exp.amount).toFixed(2)}
                    </td>
                    <td className='px-2 py-2'>{exp.description}</td>
                    <td className='px-2 py-2'>{exp.category}</td>
                    <td className='px-2 py-2'>{exp.subcategory}</td>
                    <td className='px-2 py-2'>
                      {exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
